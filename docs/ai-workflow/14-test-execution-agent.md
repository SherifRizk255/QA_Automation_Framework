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
 - Test Lifecycle Report 
   `docs/test-design/test-lifecycle.md`

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

* From Test Lifecycle

 - Setup Requirements
 - Teardown Requirements
 - Retry Eligibility
 - Self-Healing Scope
 - Evidence Requirements
 - Environment Dependencies
 - Test Data Dependencies
 - Execution Constraints

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
- `reports/lifecycle-execution-report.md`
- `reports/execution-blockers.md`

---

## Step-by-step behavior
1. Confirm execution scope.
2. Confirm environment selection.
3. Confirm browser/project selection.
4. Read Automation Traceability Report.
5. Read Automation Coverage Report.
6. Read Test Lifecycle Report.
7. Execute Lifecycle Setup Phase.
8. Determine Retry Eligibility Rules.
9. Determine Self-Healing Eligibility Scope.
10. Execute requested Playwright command.
11. Capture command used.
12. Capture execution timestamp.
13. Capture browser and environment.
14. Record pass/fail/skip counts.
15. Record retries.
16. Record blocker occurrences.

   16.1 Classify execution blockers.

   16.2 Assign blocker owner.

   16.3 Record blocker remediation requirements.

   16.4 Generate execution-blockers.md.

17. Record locator execution behavior.
18. Validate repository locator usage.
19. Record locator failures.
20. Update locator validation results.
21. Record screenshots when required.
22. Record videos when required.
23. Record traces when required.
24. Preserve raw failure messages.
25. Generate failure-analysis-input.md.
26. Preserve all execution evidence.
27. Stop and hand off to Failure Analysis Agent.

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

Lifecycle setup failures must be reported separately.

Example:
```
BLOCKED

Reason:
Lifecycle Setup Failure

Details:
Required beneficiary test data unavailable.
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

## Lifecycle Execution Tracking

Capture lifecycle execution details.

For every test execution record:

 - Setup Executed
 - Setup Result
 - Setup Failures
 - Teardown Executed
 - Teardown Result
 - Retry Eligibility
 - Retry Attempts
 - Self-Healing Eligible

Example:
```
Lifecycle

Setup:
PASSED

Teardown:
PASSED

Retry Eligible:
YES

Retry Attempts:
1

Self-Healing Eligible:
YES
```
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

## Execution Blocker Report

Generate:

reports/execution-blockers.md

For every blocked test capture:

- TC ID
- IU ID
- Scenario ID
- Automation File
- Blocker Type
- Blocker Description
- Owner
- Required Action
- Dependency Type
- Environment
- Timestamp

Example:

TC:
TC-041

Blocker Type:
OTP Service

Owner:
Environment Team

Required Action:
Provide OTP retrieval API.

Status:
BLOCKED

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

## Self-Healing Eligibility Recording
For every failed test record:

 - Self-Healing Eligible
 - Lifecycle Self-Healing Scope
 - Exclusion Reason (if not eligible)

Example:
```
Self-Healing Eligible:
YES

Scope:
Locator Recovery
```
or
```
Self-Healing Eligible:
NO

Reason:
Application Defect
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
- Setup Execution Logs
- Teardown Execution Logs
- Retry Decision Logs
- Lifecycle Validation Results

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
 - Lifecycle Setup Result
 - Lifecycle Teardown Result
 - Retry Eligibility
 - Retry Attempts
 - Retry Outcome
 - Self-Healing Eligible

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
 -  Lifecycle setup executed when required.
 - Lifecycle teardown executed when required.
 - Retry execution follows lifecycle rules.
 - Self-healing eligibility recorded.

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
- `reports/lifecycle-execution-report.md`


## Example prompt to use this skill
“Use the test execution agent to run `tests/<project>/<spec>.js` and collect evidence.”
