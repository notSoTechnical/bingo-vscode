import * as vscode from 'vscode';
import { BingoApiError, BingoLanguage, LISTING_URL, requestVerifiedAnswer } from './api';

const SECRET_KEY = 'bingo.rapidApiKey';

let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('Bingo');
  context.subscriptions.push(output);

  context.subscriptions.push(
    vscode.commands.registerCommand('bingo.setApiKey', () => setApiKey(context, true)),
    vscode.commands.registerCommand('bingo.getVerifiedAnswer', () =>
      getVerifiedAnswer(context),
    ),
  );
}

export function deactivate(): void {
  // Nothing to clean up — the output channel is disposed via subscriptions.
}

/** Read the user's key: SecretStorage first, then the plaintext setting as a fallback. */
async function getStoredKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const fromSecrets = await context.secrets.get(SECRET_KEY);
  if (fromSecrets && fromSecrets.trim().length > 0) {
    return fromSecrets.trim();
  }
  const fromSettings = vscode.workspace
    .getConfiguration('bingo')
    .get<string>('rapidApiKey');
  if (fromSettings && fromSettings.trim().length > 0) {
    return fromSettings.trim();
  }
  return undefined;
}

/**
 * Prompt for the user's RapidAPI key and store it in SecretStorage.
 * The key is never written to settings files, logs, or the output channel.
 * Returns true if a key is stored afterwards.
 */
async function setApiKey(
  context: vscode.ExtensionContext,
  interactive: boolean,
): Promise<boolean> {
  const key = await vscode.window.showInputBox({
    title: 'Bingo: Set RapidAPI Key',
    prompt:
      'Paste your own RapidAPI key for the Bingo API. It is stored securely in VS Code SecretStorage.',
    placeHolder: 'Your X-RapidAPI-Key',
    password: true,
    ignoreFocusOut: true,
  });
  if (key === undefined) {
    return (await getStoredKey(context)) !== undefined;
  }
  const trimmed = key.trim();
  if (trimmed.length === 0) {
    await context.secrets.delete(SECRET_KEY);
    if (interactive) {
      void vscode.window.showInformationMessage('Bingo: RapidAPI key cleared.');
    }
    return false;
  }
  await context.secrets.store(SECRET_KEY, trimmed);
  if (interactive) {
    void vscode.window.showInformationMessage(
      'Bingo: RapidAPI key saved securely. You can now run "Bingo: Get Verified Answer".',
    );
  }
  return true;
}

/** Ask for a key, explaining where to get a free one. Returns the key or undefined. */
async function ensureKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const existing = await getStoredKey(context);
  if (existing) {
    return existing;
  }
  const choice = await vscode.window.showInformationMessage(
    'Bingo needs your own RapidAPI key. The free plan gives you 5 verified answers/month — enough to try it out.',
    'Get a free key',
    'I have a key',
  );
  if (choice === 'Get a free key') {
    await vscode.env.openExternal(vscode.Uri.parse(LISTING_URL));
  } else if (choice === undefined) {
    return undefined;
  }
  const saved = await setApiKey(context, false);
  if (!saved) {
    return undefined;
  }
  return getStoredKey(context);
}

/** Languages the Bingo API supports, in picker order. Values are canonical API ids. */
const LANGUAGES = [
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
] as const satisfies ReadonlyArray<{ label: string; value: BingoLanguage }>;

/** Map a VS Code editor languageId to a Bingo language (fallback: python). */
function languageFromEditor(editor: vscode.TextEditor | undefined): BingoLanguage {
  switch (editor?.document.languageId) {
    case 'javascript':
    case 'javascriptreact':
      return 'javascript';
    case 'typescript':
    case 'typescriptreact':
      return 'typescript';
    case 'java':
      return 'java';
    case 'c':
    case 'cpp':
      return 'cpp';
    case 'python':
    default:
      return 'python';
  }
}

/** How pasted tests should look, per language — shown in the tests input box. */
const TEST_PROMPTS: Record<BingoLanguage, { prompt: string; placeHolder: string }> = {
  python: {
    prompt: 'Paste Python assert lines, e.g. assert dedupe([1,1,2]) == [1,2]',
    placeHolder: 'assert your_function(...) == ...',
  },
  javascript: {
    prompt:
      'Paste JavaScript assert lines (node:assert is available), e.g. assert.deepStrictEqual(dedupe([1,1,2]), [1,2])',
    placeHolder: 'assert.deepStrictEqual(yourFunction(...), ...)',
  },
  typescript: {
    prompt:
      'Paste TypeScript assert lines (node:assert is available), e.g. assert.deepStrictEqual(dedupe([1,1,2]), [1,2])',
    placeHolder: 'assert.deepStrictEqual(yourFunction(...), ...)',
  },
  java: {
    prompt:
      'Paste Java test statements for a public class Solution — signal failure with throw new AssertionError("...")',
    placeHolder:
      'if (!Solution.dedupe(List.of(1,1,2)).equals(List.of(1,2))) throw new AssertionError("dedupe");',
  },
  cpp: {
    prompt: 'Paste C++ assert statements, e.g. assert(dedupe({1,1,2}) == std::vector<int>({1,2}));',
    placeHolder: 'assert(yourFunction(...) == ...);',
  },
};

async function getVerifiedAnswer(context: vscode.ExtensionContext): Promise<void> {
  const apiKey = await ensureKey(context);
  if (!apiKey) {
    return;
  }

  // 1. The problem: prefill with the current selection if there is one.
  const editor = vscode.window.activeTextEditor;
  const selection = editor && !editor.selection.isEmpty
    ? editor.document.getText(editor.selection)
    : '';
  const problem = await vscode.window.showInputBox({
    title: 'Bingo: Get Verified Answer',
    prompt: 'Describe the function you need',
    placeHolder: 'e.g. Write a function dedupe(items) that removes duplicates but keeps order',
    value: selection,
    ignoreFocusOut: true,
  });
  if (!problem || problem.trim().length === 0) {
    return;
  }

  // 2. Language: preselect from the active editor's language, fallback Python.
  //    (A created QuickPick is used because showQuickPick's options in the 1.85
  //    API cannot pre-select an item; QuickPick.activeItems can.)
  const languageItems = LANGUAGES.map((l) => ({ label: l.label, value: l.value }));
  const language = await new Promise<BingoLanguage | undefined>((resolve) => {
    const picker = vscode.window.createQuickPick<(typeof languageItems)[number]>();
    picker.title = 'Bingo: Language';
    picker.placeholder = 'Which language should the answer be in?';
    picker.items = languageItems;
    picker.activeItems = languageItems.filter(
      (i) => i.value === languageFromEditor(editor),
    );
    picker.onDidAccept(() => {
      const picked = picker.selectedItems[0]?.value;
      picker.hide();
      resolve(picked);
    });
    picker.onDidHide(() => {
      picker.dispose();
      resolve(undefined);
    });
    picker.show();
  });
  if (!language) {
    return;
  }

  // 3. Optional tests.
  const testsChoice = await vscode.window.showQuickPick(
    [
      { label: 'Let Bingo generate the tests', value: 'generated' },
      { label: 'Paste my own tests', value: 'paste' },
    ],
    { title: 'Bingo: Tests', placeHolder: 'How should the answer be verified?' },
  );
  if (!testsChoice) {
    return;
  }
  let tests: string | undefined;
  if (testsChoice.value === 'paste') {
    const pasted = await vscode.window.showInputBox({
      title: 'Bingo: Your tests',
      prompt: TEST_PROMPTS[language].prompt,
      placeHolder: TEST_PROMPTS[language].placeHolder,
      ignoreFocusOut: true,
    });
    if (pasted === undefined) {
      return;
    }
    tests = pasted.trim().length > 0 ? pasted : undefined;
  }

  // 4. Call the API. Generation + sandbox + fix loop takes a while, and the
  //    free-tier backend may need to wake up first — hence the long timeout.
  let result;
  try {
    result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Bingo is generating and testing your answer… (first call can take a minute)',
        cancellable: false,
      },
      () => requestVerifiedAnswer(apiKey, problem.trim(), language, tests),
    );
  } catch (err) {
    await showError(context, err);
    return;
  }

  // 5. Report, honestly.
  const report = result.test_report;
  const breakdown = result.test_breakdown;
  output.appendLine('—'.repeat(60));
  output.appendLine(`Problem: ${problem.trim()}`);
  output.appendLine(`Language: ${result.language ?? language}`);
  if (report) {
    output.appendLine(
      `Result: ${result.status} — tests: ${report.passed}/${report.ran} passed, attempts: ${report.attempts}`,
    );
  } else {
    output.appendLine(`Result: ${result.status}`);
  }
  if (breakdown) {
    const providedPart = breakdown.provided
      ? `provided: ${breakdown.provided.passed}/${breakdown.provided.ran} passed`
      : 'provided: (none — spec tests only)';
    output.appendLine(
      `Test breakdown — ${providedPart} · spec: ${breakdown.spec.passed}/${breakdown.spec.ran} passed`,
    );
  }
  if (result.tests_used) {
    output.appendLine(`Tests used (${result.tests_source ?? 'provided'}):`);
    output.appendLine(result.tests_used);
  }
  if (result.spec_tests_used) {
    output.appendLine('Spec tests used (generated from your problem statement):');
    output.appendLine(result.spec_tests_used);
  }

  if (result.status === 'verified' && result.code) {
    const doc = await vscode.workspace.openTextDocument({
      language,
      content: result.code,
    });
    await vscode.window.showTextDocument(doc);
    let summary: string;
    if (report) {
      const breakdownSegment =
        breakdown?.provided != null
          ? ` (provided: ${breakdown.provided.passed}/${breakdown.provided.ran} · spec: ${breakdown.spec.passed}/${breakdown.spec.ran})`
          : '';
      summary = `Bingo ✓ verified — tests: ${report.passed}/${report.ran} passed${breakdownSegment}, attempts: ${report.attempts}. See the "Bingo" output channel for the tests used.`;
    } else {
      summary = 'Bingo ✓ verified — the answer passed its tests.';
    }
    output.appendLine(
      `Verified code was opened in a new ${language} editor. Nothing was inserted into your files automatically.`,
    );
    void vscode.window.showInformationMessage(summary);
  } else {
    // Never insert unverified code. Say so plainly — and name the failing suite.
    if (breakdown) {
      const failedSuites: string[] = [];
      if (breakdown.provided && breakdown.provided.passed < breakdown.provided.ran) {
        failedSuites.push(
          `provided tests (${breakdown.provided.passed}/${breakdown.provided.ran} passed)`,
        );
      }
      if (breakdown.spec.passed < breakdown.spec.ran) {
        failedSuites.push(`spec tests (${breakdown.spec.passed}/${breakdown.spec.ran} passed)`);
      }
      if (failedSuites.length > 0) {
        output.appendLine(`Failed suite(s): ${failedSuites.join('; ')}`);
      }
    }
    output.appendLine('No code was delivered. Bingo only ships code that passes its tests.');
    void vscode.window.showWarningMessage(
      'Bingo could not verify a solution after 3 attempts — nothing was inserted. Try rephrasing the problem or adding your own tests. Details are in the "Bingo" output channel.',
    );
  }
}

async function showError(context: vscode.ExtensionContext, err: unknown): Promise<void> {
  output.appendLine('—'.repeat(60));
  if (err instanceof BingoApiError) {
    output.appendLine(`Bingo API error (HTTP ${err.statusCode}): ${err.message}`);
    if (err.statusCode === 401 || err.statusCode === 403) {
      const choice = await vscode.window.showErrorMessage(
        'Bingo: RapidAPI rejected your key (401/403). It may be missing, wrong, or not subscribed to the Bingo API yet.',
        'Set RapidAPI Key',
        'Open the Bingo listing',
      );
      if (choice === 'Set RapidAPI Key') {
        await setApiKey(context, false);
      } else if (choice === 'Open the Bingo listing') {
        await vscode.env.openExternal(vscode.Uri.parse(LISTING_URL));
      }
      return;
    }
    if (err.statusCode === 429) {
      const choice = await vscode.window.showErrorMessage(
        'Bingo: you have used up this month\'s answers on your current RapidAPI plan. The free plan includes 5 answers/month.',
        'View plans',
      );
      if (choice === 'View plans') {
        await vscode.env.openExternal(vscode.Uri.parse(LISTING_URL));
      }
      return;
    }
    void vscode.window.showErrorMessage(
      `Bingo: the API returned an error (HTTP ${err.statusCode}). Details are in the "Bingo" output channel.`,
    );
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  output.appendLine(`Bingo error: ${message}`);
  void vscode.window.showErrorMessage(
    `Bingo: something went wrong — ${message} See the "Bingo" output channel for details.`,
  );
}
