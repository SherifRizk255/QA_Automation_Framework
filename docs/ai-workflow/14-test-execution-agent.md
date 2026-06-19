# 14 - Test Execution Agent

## Purpose
Execute Playwright TypeScript automated tests and collect complete execution evidence while preserving traceability, execution metadata, blocker information, locator behavior, and failure analysis inputs.

This skill executes tests only.

It does not:
 - Analyze failures
 - Fix automation
 - Modify code
 - Self-heal tests
 - Reclassify defects

---

## When to use this skill
Use this skill when the user asks to run selected tests or a test suite and collect raw execution results.

---

## Required inputs
### Mandatory
 - Approved Playwright test suite
 - Automation Traceability Report
 - Automation Coverage Report
 - Environment configuration
 - Browser/project selection

### Optional
 - Specific test file
 - Specific test suite
 - Specific test tags
 - Specific grep pattern
 - Specific TC list
 - Specific IU list

---

## Consumes
* From Automation Implementation Agent
  - Generated Tests
  - Page Objects
  - Fixtures
  - Utilities
  - Automation Traceability
  - Locator Registry
  - Locator Confidence
  - Locator Volatility
  - Locator Uniqueness
  - Fallback Locator Chains

* From Traceability Manager
  - IU Mapping
  - Scenario Mapping
  - TC Allocation
  - Regression Classification

* From QA Analyzer
  - Risk
  - Dependencies
  - Regression Scope
  - Pipeline Mode

---

## Responsibility

Execute automation and capture:
 - Execution Results
 - Execution Metadata
 - Evidence
 - Blockers
 - Locator Failures
 - Retry Information
 - Failure Inputs

while preserving:
```
Requirement
↓
IU
↓
Scenario
↓
TC
↓
Automation
↓
Execution Result

traceability.
```
---

## Required outputs
- `reports/execution-raw-results.md`
- `reports/execution-metadata.md`
- `reports/failure-analysis-input.md` 
- `playwright-report/`
- `test-results/`
- `test-results/screenshots/`
- `test-results/videos/`
- `test-results/traces/`

---

## Step-by-step behavior
1. Confirm execution scope.
2. Confirm environment selection.
3. Confirm browser/project selection.
4. Read Automation Traceability Report.
5. Read Automation Coverage Report.
6. Execute requested Playwright command.
7. Capture command used.
8. Capture execution timestamp.
9. Capture browser and environment.
10. Record pass/fail/skip counts.
11. Record retries.
12. Record blocker occurrences.
13. Record locator execution behavior.
14. Validate repository locator usage.
15. Record locator failures.
16. Update locator validation results. 
17. Record screenshots when required.
18. Record videos when required.
19. Record traces when required.
20. Preserve raw failure messages.
21. Generate failure-analysis-input.md.
22. Preserve all execution evidence.
23. Stop and hand off to Failure Analysis Agent.

---

## Execution Metadata Capture
For every execution capture:
 - Execution Timestamp
 - Environment
 - Browser
 - Project
 - Git Branch
 - Git Commit
 - Pipeline Mode
 - Executor

Output example:
```
Execution ID:
EXEC-2026-001

Environment:
UAT

Browser:
Chromium

Git Branch:
feature/transfers

Git Commit:
4d8f23a

Pipeline Mode:
FULL
```
---
## Traceability Preservation
Every executed automation test must retain:
```
REQ
↓
IU
↓
SCN
↓
TC
↓
AUT
↓
EXEC
```
mapping.

Example:
```
REQ-001
↓
IU-001
↓
SCN-003
↓
TC-014
↓
AUT-TC014.spec.ts
↓ 
PASSED
```
---
## Execution Result Classification

Allowed statuses:
 - PASSED
 - FAILED
 - SKIPPED 
 - BLOCKED

### Definitions:

 1. PASSED: Expected result achieved
 2. FAILED: Automation executed but assertion failed.
 3. SKIPPED: Execution intentionally skipped.
 4. BLOCKED: Business blocker prevented execution.

Example:
```
BLOCKED

Reason:
Maintenance Window Banner
```

---

## Retry Tracking

Capture:
 - Retry Count
 - Retry Outcome

Output example:
```
Retries:
1

Outcome:
Passed On Retry
```
Possible values:
 - Passed On Retry
 - Failed On Retry
 - No Retry Executed

Execution Agent records only.

No retry analysis occurs here.

---

## Blocker Recording

Capture all runtime blockers.

Examples:
```
Active Session Warning
OTP Expired
Forced Password Reset
Terms & Conditions Dialog
Maintenance Banner
Security Verification Prompt
Concurrent Login Warning
```

For each blocker record:
 - Blocker Type
 - Visible Text
 - Screenshot
 - Timestamp
 - Action Taken

Example:
```
Blocker:
Active Session Warning

Action:
Proceed Selected

Evidence:
active-session-warning.png
```

Do not hide blockers.

Do not suppress blockers.

---

## Locator Failure Recording

Capture locator-related failures.

For every locator failure record:
 - Element
 - Primary Locator
 - Fallback chain
 - Failure Type
 - Locator Confidence
 - Locator Volatility
 - Locator Uniqueness
 - Observed Match Count
 - Page URL
 - Failure Message

Failure Types:
```
NOT_FOUND
MULTIPLE_MATCHES
NOT_VISIBLE
NOT_ENABLED
DETACHED
TIMEOUT
ACTIONABILITY_FAILURE
```

Example:
```
Element:
Transfer Button

Primary:
getByRole()

Fallback:
getByLabel()

Result:
Failed

Failure Type:
MULTIPLE_MATCHES

Confidence:
HIGH
```

This output is consumed by Self-Healing Agent.

---

## Repository Validation Recording

For every locator interaction capture:

- Repository Entry
- Locator Used
- Validation Result
- Match Count
- Visibility Result
- Actionability Result

Example:
```
Element:
Transfer Button

Repository Entry:
TRANSFER.TRANSFER_BUTTON

Locator:
#transferBtn

Validation:
PASSED

Match Count:
1

Visible:
YES

Actionable:
YES
```
---

## DOM Evidence Collection

When a locator failure occurs:

Capture:
 - Current URL
 - Page Title
 - Target Element Name
 - Relevant DOM Snippet
 - Available Accessible Roles
 - Nearby Interactive Elements
 - Visible Text Context

Store in:
`reports/failure-analysis-input.md`

---

## Evidence Collection

Capture:

Required:
- Raw Playwright Errors
- Console Errors
- Network Failures
- Locator Execution Data

Conditional:
- Screenshots
- Videos
- Traces

Screenshots are evidence artifacts.

Screenshots are not locator discovery artifacts.

Locator troubleshooting should rely on DOM and locator metadata whenever possible.


---
## Failure Analysis Handoff

Generate:

`reports/failure-analysis-input.md`

For every failed test include:
 - Test ID
 - TC ID
 - IU ID
 - Failure Message
 - Stack Trace
 - Locator Used
 - Fallback Locator Chain
 - Locator Confidence
 - Locator Volatility
 - Locator Uniqueness
 - Locator Failure Type
 - Observed Match Count
 - Relevant DOM Context
 - Retry Result
 - Blockers Encountered
 - Screenshot Path
 - Video Path
 - Trace Path

This document becomes the direct input for Failure Analysis Agent.

---
## CR Mode Rules

When:

Pipeline Mode = CR_DELTA

Execution must separate:

Delta Tests
Regression Tests

Output:
```
DELTA TESTS

TC-301
TC-302

REGRESSION TESTS

TC-021
TC-022
TC-023
```

Maintain separate statistics.

---

## Quality gates
Before completion verify:
 - Raw results and artifacts are preserved.
 - Every executed test maps to TC.
 - Failures are not modified or hidden.
 - The exact command is recorded.
 - Execution metadata complete.
 - All blockers documented.
 - Locator failures preserved.
 - No code changes are made in this stage.

## Do-not rules
- Do not modify automation code.
- Do not self-heal failures.
- Do not delete execution evidence.
- Do not suppress failures 
- Do not reclassify failures.
- Do not hide blockers.
- Do not retry indefinitely.
- Do not alter screenshots, traces, or videos.
- Do not modify traceability mappings.


## Output file locations
- `reports/execution-raw-results.md`
- `reports/execution-metadata.md`
- `reports/failure-analysis-input.md`
- `playwright-report/`
- `test-results/`
- `test-results/screenshots/`
- `test-results/videos/` 
- `test-results/traces/`


## Example prompt to use this skill
“Use the test execution agent to run `tests/<project>/<spec>.js` and collect evidence.”
