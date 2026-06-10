# 07 - Test Execution Agent

## Purpose
Execute Playwright tests and collect execution evidence.

## When to use this skill
Use this skill when the user asks to run selected tests or a test suite and collect raw execution results.

## Required inputs
- Test file, test grep, or suite path
- Environment name
- Browser/project selection
- Execution command approval, if needed

## Required outputs
- `reports/execution-raw-results.md`
- `playwright-report/`
- `test-results/`

## Step-by-step behavior
1. Confirm the selected test scope.
2. Run the requested Playwright command.
3. Capture the command used.
4. Capture execution date/time.
5. Capture environment and browser.
6. Record passed, failed, and skipped test counts.
7. Record screenshot, video, trace, and error context locations.
8. Store raw execution notes.
9. Do not fix failures in this stage.

## Quality gates
- The exact command is recorded.
- Raw results and artifacts are preserved.
- Failures are not modified or hidden.
- No code changes are made in this stage.

## Do-not rules
- Do not fix failures.
- Do not self-heal.
- Do not delete old evidence unless explicitly approved.
- Do not reclassify failures without using the failure analysis stage.

## Output file locations
- `reports/execution-raw-results.md`
- `playwright-report/`
- `test-results/`

## Example prompt to use this skill
“Use the test execution agent to run `tests/<project>/<spec>.js` and collect evidence.”
