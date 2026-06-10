# reporter.md

> Final step of both pipelines.
> Produces structured output: coverage summary, gap report, bug reports, execution summary.
> Generic — consistent format across all projects and domains.

---

## Responsibility

Consolidate outputs from all upstream skills into clean, stakeholder-ready reports.
Generate on request or automatically at the end of a pipeline run.

---

## Report 1: Coverage Summary

Produced at the end of every pipeline run.

```
✅ COVERAGE SUMMARY
──────────────────────────────────────────────────────
Run date          : [date]
Input artifact    : [type + reference]
Pipeline mode     : Standard | CR Delta (CR-[ID])
Domain context    : [or "not specified"]

Intent Units
  Total           : [N]
  P1              : [N]   P2 : [N]   P3 : [N]   P4 : [N]
  Covered         : [N] / [N]  ([%])
  Gaps            : [N] IUs with no TC coverage

Test Cases
  Generated       : [N]
  Positive        : [N]   Negative : [N]   Boundary : [N]   Security : [N]
  Automate: Yes   : [N]
  Automate: No    : [N]
  Automate: Partial:[N]

Flags
  Ambiguities     : [N]
  Missing info    : [N]
  Untestable IUs  : [N]
  Assumptions     : [N]

CR Mode (if applicable)
  Delta TCs       : [N] new / [N] updated
  Retired TCs     : [N]
  Regression scope: [N] TCs
──────────────────────────────────────────────────────
```

---

## Report 2: Gap Report

Produced when any IU has no TC coverage or was flagged.

```
⚠️  GAP REPORT
──────────────────────────────────────────────────────
IU-[N] | [description] | Risk: P[?]
  Status    : ❓ AMBIGUOUS / 🚫 UNTESTABLE / ⚠️ MISSING INFO
  Detail    : [what is missing]
  Blocker   : [what must be provided to resolve]
  Impact    : [what test coverage is missing as a result]
──────────────────────────────────────────────────────
Total gaps : [N]
```

---

## Report 3: Bug Report

Produced when a test failure is classified as an application defect.

```
🐛 BUG REPORT
──────────────────────────────────────────────────────
Title        : [Action] + [Component] + [Impact]
Module       : [screen / feature / API / service]
Linked TC    : TC-[NNN]
Linked IU    : IU-[NNN]
Source req   : [BRD section / CR reference / Story ID]

Environment  :
  OS               :
  Browser/Client   :
  Test environment : Dev / UAT / Staging / Production
  Build/Release    :

Steps to Reproduce :
  1.
  2.
  3.

Expected Result : [per requirement / IU expected outcome]
Actual Result   : [exact observed behavior]

Severity : Critical / High / Medium / Low
Priority : P1 / P2 / P3 / P4

Attachments : [screenshots / video / trace / HAR file / logs]

Suspected Root Cause :
  [ ] Frontend — UI / validation / state management
  [ ] Backend  — API logic / business rule / service error
  [ ] Database — data inconsistency / missing record / constraint violation
  [ ] Integration — API ↔ UI / microservice communication
  [ ] Configuration / environment
  [ ] Cache / sync / race condition / timing

Most likely (ranked by probability):
  1. [most probable] — reason
  2. [second possible] — reason

Notes:
  [Workaround if any. Related tickets. Frequency of occurrence.]
──────────────────────────────────────────────────────
```

---

## Report 4: Failure Classification

When a Playwright test fails, classify as exactly one of:

| Code | Class | Description |
|---|---|---|
| F1 | Automation script issue | Locator broken, assertion wrong, test logic error |
| F2 | Application defect | System behavior does not match requirement → generate Bug Report |
| F3 | Test data issue | Data missing, expired, wrong state, or seeding failed |
| F4 | Environment issue | Connectivity, config, deployment, downstream service down |
| F5 | Requirement ambiguity | Behavior unspecified or contradictory in source artifact |

---

## Report 5: Execution Summary (reports/execution-summary.md)

Generated on request or after a test run.

```markdown
# Execution Summary
Run date     : [date]
Environment  : [env name]
Suite        : [suite name or tags run]

## Results
Total : [N] | Passed : [N] | Failed : [N] | Skipped : [N]

## Failed Tests

### TC-[NNN] — [Title]
- Class      : [F1–F5]
- Error      : [error message]
- Screenshot : [path]
- Video      : [path]
- Trace      : [path]
- IU         : IU-[NNN]
- Notes      : [suspected cause]
```

---

## Reporting Rules

- Every report entry must reference a TC ID and an IU ID.
- Bug reports are generated for F2 failures only — other failure classes get a classification note, not a full bug report.
- Gap reports are produced proactively — do not wait for a test to fail to report a missing IU.
- Execution summaries are stored at `reports/execution-summary.md` and updated after each run.
