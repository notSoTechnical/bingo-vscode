# Changelog

All notable changes to the Bingo — Verified Code Answers extension.

## [0.4.1] — Dummy gate: S7 Night Run

- **Seventh scenario: S7 Night run — dark obstacle** — the Dummy gate (backend v2.4) now also crash-tests controllers in the dark: the main sensor is blind (`obs.gap` reads `inf`), and only the short-range bumper sonar can catch the dark obstacle on the path. The README's `step(obs)` contract now documents `obs.bumper_gap` and `obs.low_light`, and the example controller is the night-aware one — bumper-aware stop, low-light crawl
- **No functional changes** — the extension renders whatever scenarios the API returns, so the new S7 verdicts (GREEN is now 7/7) appear automatically; this release updates the docs, the example, and user-facing text from six scenarios to seven

## [0.4.0] — Dummy: a safety gate for robot controllers

- **New command: Bingo: Verify Robot Controller (Dummy)** — open the Python file that defines your robot controller's `step(obs)` function and run it: the whole file is sent to the Dummy gate, which crash-tests the controller in simulation through six deployment scenarios (obstacle stop, pedestrian crossing, speed limit, emergency stop, blocked goal, clear-world sanity)
- **Gate verdict, honestly reported** — GREEN means every scenario passed ("cleared to deploy"), RED means deploy blocked, with the failing scenarios named in the notification and the full per-scenario report (collision, top speed, closest gap, e-stop latency, detail) in the **Bingo** output channel. Code that crashes, never returns, or doesn't define `step(obs)` comes back RED with the reason — never a silent pass
- **No key needed** — the gate endpoint is a free public beta for now, called directly on the Bingo backend, so this command works without a RapidAPI key. Simulation gate only — not a safety certification, and not a substitute for testing on real hardware

## [0.3.0] — Pick your engine: DeepSeek or Gemini

- **Engine picker** — the **Bingo: Get Verified Answer** flow now asks which AI engine should write the code: **DeepSeek** (default) or **Google Gemini** (gemini-3.8-flash). No typing — it's a picker, right after the language picker
- **Same bar, either engine** — the verification process (sandbox runs + dual test check) is identical whichever engine you pick; the info message and the **Bingo** output channel now report the engine and the exact model that wrote the answer

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
