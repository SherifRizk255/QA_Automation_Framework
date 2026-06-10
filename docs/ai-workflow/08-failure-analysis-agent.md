# 08 - Failure Analysis Agent

## Purpose
Analyze failed tests using Playwright errors, screenshots, videos, traces, and error-context files.

## When to use this skill
Use this skill after test execution produces failures.

## Required inputs
- Playwright console output
- `test-results/`
- `playwright-report/`
- Error context files
- Screenshots, videos, and traces
- Requirement or expected behavior reference

## Required outputs
- `reports/failure-analysis.md`

## Step-by-step behavior
1. Identify failed test case.
2. Identify failed step.
3. Read error message.
4. Review screenshot, video, trace, and error context if available.
5. Compare actual behavior with expected behavior.
6. Classify the failure.
7. Decide whether the failure is an automation issue, application issue, data issue, environment issue, access issue, blocker, or requirement ambiguity.
8. Prepare failure recommendation.
9. Do not change code.

## Quality gates
- Every failure has a classification.
- Evidence paths are listed.
- Automation issues and application defects are separated.
- Recommendations are actionable.

## Do-not rules
- Do not change code.
- Do not hide defects.
- Do not assume an application defect without evidence.
- Do not assume an automation issue without locator/code evidence.

## Output file locations
- `reports/failure-analysis.md`

## Example prompt to use this skill
“Use the failure analysis agent to analyze the latest failed Playwright run.”
