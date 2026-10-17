# Changelog

All notable changes to the Bingo — Verified Code Answers extension.

## [0.1.0] — Initial release

- **Bingo: Get Verified Answer** command — describe a Python problem, optionally add your own tests, and receive code that was generated, run in a sandbox, and auto-fixed (up to 3 attempts) until it passed — delivered with its full test report
- **Honest failure** — if no solution passes, Bingo reports `not_verified` and inserts nothing
- **Bingo: Set RapidAPI Key** command — stores your own RapidAPI key in VS Code SecretStorage (with the free plan: 5 answers/month)
- Verified code opens in a new Python editor; the test report and diagnostics go to the **Bingo** output channel
- Plain-language errors for key problems (401/403) and plan quota (429)
