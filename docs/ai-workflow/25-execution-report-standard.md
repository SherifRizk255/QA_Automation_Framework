# 25 - Execution Report Standard (Cubic HTML Report)

> Support skill. Not a pipeline stage.
>
> Consumed by: Test Execution Agent (14), Failure Analysis Agent (15), Final Report Agent (17), QA Review Agent (18).
>
> Purpose: after EVERY test execution the framework produces a self-contained, stakeholder-readable HTML report branded for **Cubic**, plus supporting machine-readable outputs. This skill defines what the report must contain, how failures are classified as test-implementation failures vs system bugs, and how agents consume it.

---

# REPORT OUTPUTS PER RUN

| Output | Path | Producer | Audience |
|---|---|---|---|
| **Cubic HTML report** | `reports/cubic-report/index.html` (+ timestamped copy in `reports/cubic-report/history/`) | `utils/cubicHtmlReporter.ts` — custom Playwright reporter registered in `playwright.config.ts`; runs automatically, no manual step | Stakeholders, QA lead |
| Markdown execution summary | `reports/execution-summary.md` | `npm run report:summary` (`utils/reportGenerator.ts`) | Pipeline agents |
| Allure results | `allure-results/` → `npm run report:allure` | `allure-playwright` reporter (skill 21) | Final Report Agent |
| Playwright JSON | `test-results/results.json` | built-in `json` reporter | Tooling |

The HTML report is generated even when every test fails or the run is interrupted after `onEnd` — never disable the reporter to "clean up" output.

---

# MANDATORY CONTENT OF THE CUBIC HTML REPORT

## Run header
* Company brand: **Cubic** (override: `REPORT_COMPANY_NAME`).
* Project (`PROJECT_NAME`) and environment (`TARGET_ENV`).
* Run start time, finish time, and **total execution time**.

## Summary tiles
Total, Passed, Failed, Flaky, Skipped, Pass rate — with a pass-rate bar and status filters.

## Per executed test
* Status badge (PASSED / FAILED / FLAKY / SKIPPED).
* TC id (extracted from the title — this is why skill 21's `TC-<AREA>-<NNN> |` title format is mandatory) and full business title.
* Spec file and line, Playwright project, **per-test duration**, retry count, start time.

## Per failed/flaky test additionally
* **Failed at step** — the deepest named step that errored (business-facing, from `allure.step`/`test.step` names).
* **Failed at** — file:line:column of the error.
* Full error message (ANSI-stripped).
* **Failure classification (F1–F5) with plain-language verdict** — answers the one question stakeholders ask: *is this a test implementation failure or a bug in the system under test?*
* Recommendation — the concrete next action.
* **Failure screenshots embedded inline** (base64; ≤3 MB each) so the report is a single portable file. Video/trace paths listed underneath.

---

# FAILURE CLASSIFICATION (single implementation: `utils/failureClassification.ts`)

| Code | Class | Verdict shown to stakeholder |
|---|---|---|
| F1 | Automation script issue | Test implementation failure — fix the automation, system is probably fine |
| F2 | Application defect | Potential bug in the system under test → raise/review a defect (skill 17 bug report) |
| F3 | Test data issue | Data problem — neither side proven wrong yet |
| F4 | Environment issue | Environment/connectivity — rerun when healthy |
| F5 | Requirement ambiguity | Expected behavior unclear — clarify before blaming test or system |

Mapping to the Failure Analysis Agent's detailed model (skill 15):

| Report class | Skill 15 classes it summarizes |
|---|---|
| F1 | AUT_LOCATOR, AUT_TIMING, AUT_ASSERTION |
| F2 | APP_FUNCTIONAL, APP_VALIDATION, APP_UI |
| F3 | TEST_DATA, ACCESS_PERMISSION |
| F4 | ENVIRONMENT, EXTERNAL_DEPENDENCY, BLOCKER |
| F5 | REQUIREMENT_AMBIGUITY |

Rules:

* Classification heuristics are signature-based (locator/strict-mode → F1, known app-defect messages → F2, credential/auth → F3, network → F4, otherwise F5). The Failure Analysis Agent (15) may OVERRIDE the heuristic verdict after investigation — the report's classification is the starting hypothesis, not the verdict of record.
* New recurring app-defect signatures discovered by skill 15 must be added to `classifyFailureMessage()` so future reports classify them automatically.
* Bug reports (skill 17 format) are generated for F2 only; other classes get the classification note.
* Every report entry references its TC id; where a traceability matrix exists, TC → IU joining is the Final Report Agent's job.

---

# INPUT → PROCESS → OUTPUT (for agents handling a finished run)

## Input
A completed `npx playwright test` run (any scope).

## Process
1. Confirm `reports/cubic-report/index.html` was regenerated (timestamp matches the run).
2. Read the summary: if failures exist, open each failure block and note step, location, classification, screenshot.
3. Hand F1 to Self-Healing (16) candidates, F2 to Failure Analysis (15) → bug report (17), F3/F4 to the environment/data checklist, F5 to the requirement owner.
4. Reference the HISTORY copy (`reports/cubic-report/history/run-<timestamp>.html`) in any sign-off document — `index.html` is overwritten by the next run.

## Output
Dispatch decisions per failure + the report paths quoted in the execution summary.

---

# FALLBACK BEHAVIOR

* No screenshot captured → the report states "No screenshot captured for this failure." — do not fake evidence.
* No named step errored → only file:line location is shown.
* Title without a TC id → shown with "—" and flagged: fix the title per skill 21 (metadata omissions are automation defects).
* Reporter crash must never fail the run — if generation fails, regenerate via `npm run report:summary` and file an F1 against the reporter.

---

# ABSOLUTE RULES

* Never disable or unregister the Cubic reporter, failure screenshots, or traces to "speed up" runs.
* Never edit a generated report by hand — fix the source data and re-run.
* Never delete `reports/cubic-report/history/` entries referenced by a sign-off.
* Never let the embedded-screenshot budget be raised so far the report stops opening in a browser.
