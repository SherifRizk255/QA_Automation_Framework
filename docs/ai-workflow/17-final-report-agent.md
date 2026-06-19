# 17- Final Report Agent

## Purpose

Generate the final QA assessment package after execution is complete.

This agent consolidates execution results, failure analysis, self-healing outcomes, coverage status, defect findings, risks, and release readiness into a single decision-oriented report.

This is the final reporting stage before QA signoff.

---

## When to use this skill

Use this skill after:

- Test execution is complete
- Failure analysis is complete
- Self-healing activities are complete (if applicable)
- All execution artifacts are available
- Coverage status is available

Typical triggers:

- Test cycle completion
- Regression completion
- Smoke completion
- Release readiness assessment
- Sprint validation
- CR validation completion

---

## Required Inputs

### Execution Inputs

- `reports/execution-raw-results.md`
- `playwright-report/`
- `test-results/`

### Analysis Inputs

- `reports/failure-analysis.md`

### Healing Inputs

- `reports/self-healing-log.md` (if generated)
- `reports/healing-regression-results.md`

### Coverage Inputs

- `docs/test-design/automation-coverage.md`

### Project Inputs

- Project profile
- Environment details
- Build/version information
- Release information (if available)

### Optional Inputs

- Defect tracking references
- CR references
- Requirement references
- Traceability matrix

---

## Required Outputs

### Primary Reports

- `reports/execution-summary.md`
- `reports/defect-summary.md`

### Optional Reports

- `reports/release-readiness.md`
- `reports/coverage-summary.md`

---

## Step-by-Step Behavior

### 1. Collect Execution Results

Gather:

- Execution date/time
- Environment
- Browser/project
- Build version
- Test command executed
- Test scope executed

---

### 2. Validate Execution Counts

Verify:

- Total Tests
- Passed
- Failed
- Skipped
- Blocked (if applicable)

Counts must match execution artifacts.

---

### 3. Aggregate Failure Analysis

For every failed test:

Capture:

- Test name
- TC ID
- Failure step
- Failure reason
- Failure classification
- Evidence locations

---

### 4. Aggregate Self-Healing Results

If self-healing occurred:

Capture:

- Number of healed failures
- Locator fixes
- Wait strategy fixes
- Page Object fixes
- Fixture fixes
- Remaining risks
- Self-Healing Effectiveness
- Total Healing Attempts
- Successful Heals
- Failed Heals
- Healing Success Rate
- Locator Recoveries
- Timing Recoveries
- Assertion Recoveries
- Manual Review Required

Clearly distinguish:

- Originally failed
- Successfully healed
- Still failing

Example:
```
Self-Healing Summary

Healing Attempts:
12

Successful:
10

Failed:
2

Success Rate:
83%

Locator Recoveries:
8

Timing Recoveries:
2

Manual Review:
2
```
---

### 5. Generate Defect Summary

List:

- Confirmed application defects
- Requirement ambiguities
- Environment issues
- Data issues

Exclude:

- Automation-only failures

---

### 6. Generate Automation Summary

List:

- Automation defects
- Healed failures
- Remaining automation risks
- Locator instability observations

---
### 7. ### Generate Locator Repository Health Summary

Summarize:

- Total Repository Entries
- Active Entries
- Degraded Entries
- Stale Entries
- Obsolete Entries
- Entries Updated By Self-Healing
- Most Volatile Screens
- Most Frequently Recovered Elements

Example:

Locator Repository Health

Total Entries:
420

Active:
388

Degraded:
21

Stale:
8

Obsolete:
3

Recovered This Cycle:
11

---


### 8. Generate Coverage Summary

Summarize:

- Planned coverage
- Executed coverage
- Passed coverage
- Failed coverage
- Not executed coverage

If traceability exists:

Include:

```text
Coverage Rate:
92%

Covered IUs:
46 / 50

Uncovered IUs:
4
```

---

### 9. Assess Release Readiness

Determine:

```text
READY
```

or

```text
READY WITH RISKS
```

or

```text
NOT READY
```

Based on:

- Open P1 defects
- Open P2 defects
- Critical failures
- Untested functionality
- Coverage gaps

---

### 10. Produce Recommendations

Provide:

- Defects requiring fix
- Retesting recommendations
- Automation improvements
- Coverage improvements
- Environment improvements

Recommendations must be actionable.

---

### 11. Generate Final QA Decision

Provide final QA assessment.

Possible outcomes:

```text
APPROVED
```

```text
APPROVED WITH RISKS
```

```text
REJECTED
```

Must include justification.

---

## Execution Summary Format

```text
📊 EXECUTION SUMMARY
────────────────────────────────────

Project:
Retail Banking

Environment:
UAT

Build:
1.8.5

Execution Date:
2026-06-14

Command:
npx playwright test

────────────────────────────────────

Execution Statistics

Total Tests:
150

Passed:
138

Failed:
10

Skipped:
2

Pass Rate:
92%

────────────────────────────────────

Artifacts

HTML Report:
playwright-report/

Results:
test-results/

Screenshots:
test-results/screenshots/

Videos:
test-results/videos/

Traces:
test-results/traces/

────────────────────────────────────

Coverage

Planned:
150

Executed:
148

Coverage:
98.7%

────────────────────────────────────

Release Readiness:
READY WITH RISKS
```

---

## Defect Summary Format

```text
🐞 DEFECT SUMMARY
────────────────────────────────────

Application Defects:
5

Automation Issues:
3

Environment Issues:
1

Requirement Ambiguities:
1

────────────────────────────────────

P1:
1

P2:
2

P3:
3

P4:
1

────────────────────────────────────

Open Critical Defects

BUG-001
Payment executed twice

Severity:
P1

Status:
Open

────────────────────────────────────

QA Recommendation

Do not release until BUG-001 is resolved.
```

---

## Release Readiness Rules

### READY

Requirements:

- No open P1 defects
- No critical automation blockers
- Coverage acceptable
- Execution completed successfully

---

### READY WITH RISKS

Requirements:

- No open P1 defects
- Some P2/P3 defects remain
- Risks documented

---

### NOT READY

Requirements:

- Open P1 defects
- Critical functionality failing
- Major coverage gaps
- Blocking environment issues

---

## Quality Gates

Before report completion verify:

### Consistency

- Counts match execution artifacts
- Failure counts match analysis report
- Self-healing counts match healing report

### Traceability

Every reported issue links to:

- Test
- Failure
- Evidence

### Accuracy

No estimated values.

No invented metrics.

---

## Do-Not Rules

- Do not alter execution results.
- Do not hide failed tests.
- Do not hide open defects.
- Do not inflate coverage.
- Do not mark release as READY when P1 defects exist.
- Do not merge automation issues with application defects.
- Do not remove risks from the report.
- Do not expose credentials or sensitive customer data.

---

## Output File Locations

### Reports

- `reports/execution-summary.md`
- `reports/defect-summary.md`

### Optional

- `reports/release-readiness.md`
- `reports/coverage-summary.md`

---

## Example Prompt to Use This Skill

"Use the Final Report Agent to generate the final QA assessment package for the latest regression execution and determine release readiness."

