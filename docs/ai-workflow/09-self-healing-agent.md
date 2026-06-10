# 09 - Self-Healing Agent

## Purpose
Fix automation-related failures only and re-run affected tests.

## When to use this skill
Use this skill after failure analysis confirms a failure is an automation script issue.

## Required inputs
- `reports/failure-analysis.md`
- Failed test file path
- Relevant Page Objects, fixtures, utilities, and data
- Evidence from `test-results/`

## Required outputs
- Code changes for automation issues only
- Re-run result for affected tests
- `reports/self-healing-log.md`

## Step-by-step behavior
1. Read `reports/failure-analysis.md`.
2. Confirm the failure classification is Automation script issue.
3. Identify the smallest safe fix.
4. Apply allowed fixes only.
5. Re-run affected tests.
6. Record changes, command used, result, and remaining risk.

## Allowed fixes
- Locator updates
- Page Object refactoring
- Better web-first waits
- Approved blocker handling
- Better assertions
- Safer navigation handling
- Test data fixture corrections

## Quality gates
- Only automation issues are fixed.
- Affected tests are re-run.
- Changes are documented.
- Real defects remain visible.

## Do-not rules
- Do not hide real bugs.
- Do not remove assertions to make tests pass.
- Do not increase timeout without reason.
- Do not use `page.waitForTimeout()`.
- Do not bypass business validations.
- Do not fix application defects in automation.

## Output file locations
- `reports/self-healing-log.md`
- Updated automation files only when justified

## Example prompt to use this skill
“Use the self-healing agent to fix the automation issues listed in `reports/failure-analysis.md`.”
