# Bingo — Verified Code Answers

**AI code that has to prove itself before you see it.**

Most AI code *looks* right and runs wrong — hallucinated packages, invented APIs, logic that passes the demo and fails in production. Bingo works differently: it doesn't just generate an answer, it **proves** it.

## How it works

1. You describe a Python coding problem (and your tests, if you have them)
2. Bingo generates a solution with a fast, low-cost model (DeepSeek)
3. The code runs in a sandbox against the tests
4. If it fails, Bingo fixes and re-runs — up to 3 attempts
5. You get the code **with its test report**: which tests ran, which passed, how many attempts it took

If Bingo cannot produce a passing solution, it tells you honestly — `not_verified` — and **inserts nothing**. Verified answers only. That is the whole product.

> **Honesty note:** "Verified" means the code passed the tests used for that answer (yours, or the tests Bingo generated and shows you in the report). It is strong evidence the code works — not a guarantee against every possible edge case. Verified = passed the tests used; the report is always shown.

<!-- TODO: usage GIF coming soon — a screen recording of "Bingo: Get Verified Answer" will go here. -->

## Getting your free RapidAPI key

Bingo runs on **your own RapidAPI key** — you subscribe to the API yourself, so your usage and billing are yours. The free plan includes **5 verified answers/month**, enough to try it from this extension.

1. Open the [Bingo listing on RapidAPI](https://rapidapi.com/demorgansucks/api/bingo-verified-code-answers-api/playground) and subscribe to the free **BASIC** plan
2. Copy your `X-RapidAPI-Key` from the listing's playground page
3. In VS Code, run **Bingo: Set RapidAPI Key** from the Command Palette and paste it

Your key is stored in VS Code **SecretStorage** — never in settings files, never logged. (A plaintext `bingo.rapidApiKey` setting also exists as a fallback, but the command is the recommended way.)

## Using it

Run **Bingo: Get Verified Answer** from the Command Palette (`Ctrl/Cmd+Shift+P`):

- If you have text selected, it pre-fills the problem box with your selection
- Optionally paste your own tests (Python `assert` lines) — or let Bingo generate tests and show them to you in the report
- Generation + testing takes a little while; the first call after a quiet period can take up to a minute while the backend wakes up

When an answer is verified, the code opens in a new Python editor and the full test report lands in the **Bingo** output channel. When it can't be verified, you get a clear warning — and no code. Nothing is ever inserted into your files automatically.

## Plans

| Plan | Price | Verified answers / month |
|---|---|---|
| BASIC | Free | 5 |
| PRO | $10/mo | 250 |
| ULTRA | $25/mo | 250 (stronger model) |
| MEGA | $50/mo | 600 (stronger model) |

One request = one problem. Bingo may generate and test up to 3 attempts internally — you are only ever counted for the one answer.

## Good to know

- **Python only** in v1 — more languages based on demand
- Errors are explained in plain language: `401/403` means a key problem, `429` means your monthly answers are used up
- Try the API first in your browser, or with the [example code on GitHub](https://github.com/notSoTechnical/bingo-examples)

## About

Bingo is built by **Annizon** — built by a test engineer, because testing is not a feature here; it is the product.

Support: [info@annizon.com](mailto:info@annizon.com)

Bingo is an independent product and is not affiliated with OpenAI, Anthropic, or DeepSeek. Model names belong to their respective owners.
