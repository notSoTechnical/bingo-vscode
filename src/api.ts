import * as https from 'https';

/** The RapidAPI proxy host for the Bingo API (confirmed live). */
export const RAPIDAPI_HOST = 'bingo-verified-code-answers-api.p.rapidapi.com';

/** Where users get their own key (free plan: 5 answers/month). */
export const LISTING_URL =
  'https://rapidapi.com/demorgansucks/api/bingo-verified-code-answers-api/playground';

export interface TestReport {
  ran: number;
  passed: number;
  attempts: number;
}

export interface BingoResponse {
  status: 'verified' | 'not_verified';
  code: string | null;
  test_report?: TestReport;
  tests_used?: string;
  tests_source?: string;
}

/** Error carrying the HTTP status code so the UI can explain it in human terms. */
export class BingoApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'BingoApiError';
  }
}

/**
 * Ask Bingo for a verified Python code answer.
 *
 * The request goes through the RapidAPI proxy using the END USER's own key —
 * the key is only ever placed in the X-RapidAPI-Key header of this request.
 * It is never logged and never sent anywhere else.
 */
export function requestVerifiedAnswer(
  apiKey: string,
  problem: string,
  tests: string | undefined,
  timeoutMs = 180_000,
): Promise<BingoResponse> {
  return new Promise<BingoResponse>((resolve, reject) => {
    const payload: Record<string, string> = { problem, language: 'python' };
    if (tests && tests.trim().length > 0) {
      payload.tests = tests;
    }
    const body = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: RAPIDAPI_HOST,
        path: '/v1/answers',
        method: 'POST',
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new BingoApiError(status, text.slice(0, 500) || `HTTP ${status}`));
            return;
          }
          try {
            resolve(JSON.parse(text) as BingoResponse);
          } catch {
            reject(
              new BingoApiError(status, 'Bingo returned a response that was not valid JSON.'),
            );
          }
        });
      },
    );

    req.on('timeout', () => {
      req.destroy(
        new Error(
          'The request timed out. The Bingo backend can be slow to wake up — please try again.',
        ),
      );
    });
    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}
