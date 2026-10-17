# Changelog

All notable changes to the Bingo — Verified Code Answers extension.

## [0.2.0] — Five languages + dual-tested answers

- **Five languages** — answers now in Python, JavaScript, TypeScript, Java, and C++. The **Bingo: Get Verified Answer** flow adds a language picker, pre-selected from your current editor's language
- **Dual-tested verification** — when you provide your own tests, the answer must now pass those *and* an independent suite of spec tests generated from your problem statement, so hardcoded answers can't sneak through. When you provide no tests, the generated tests remain the single suite
- **Richer reports** — the info message and the **Bingo** output channel show the per-suite breakdown (provided vs spec) alongside the combined counts, plus the spec tests themselves; verified code opens in an editor with the correct language mode, and a `not_verified` result names the suite that failed
- **Per-language test formats** — Python `assert`s, JS/TS `node:assert`, Java statements against a `public class Solution` using `AssertionError`, and C++ `assert` statements

## [0.1.0] — Initial release

- **Bingo: Get Verified Answer** command — describe a Python problem, optionally add your own tests, and receive code that was generated, run in a sandbox, and auto-fixed (up to 3 attempts) until it passed — delivered with its full test report
- **Honest failure** — if no solution passes, Bingo reports `not_verified` and inserts nothing
- **Bingo: Set RapidAPI Key** command — stores your own RapidAPI key in VS Code SecretStorage (with the free plan: 5 answers/month)
- Verified code opens in a new Python editor; the test report and diagnostics go to the **Bingo** output channel
- Plain-language errors for key problems (401/403) and plan quota (429)
