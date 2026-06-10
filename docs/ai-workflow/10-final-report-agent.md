# 10 - Final Report Agent

## Purpose
Generate a final structured QA execution report.

## When to use this skill
Use this skill after execution, failure analysis, and any approved self-healing are complete.

## Required inputs
- Raw execution results
- Failure analysis
- Self-healing log, if any
- Test artifacts
- Project profile and environment details

## Required outputs
- `reports/execution-summary.md`
- `reports/defect-summary.md`

## Step-by-step behavior
1. Read raw execution results.
2. Read failure analysis.
3. Read self-healing log if available.
4. Summarize project name and environment.
5. Summarize execution date/time and command.
6. Summarize total, passed, failed, and skipped tests.
7. List failed test names, failed steps, and error messages.
8. List screenshot, video, and trace paths.
9. Include failure classification.
10. Summarize defects found and automation issues fixed.
11. Document unresolved risks and recommendations.
12. Assign QA approval status.

## Quality gates
- Counts match the execution artifacts.
- Every failure has evidence and classification.
- Defects and automation issues are separated.
- Recommendations are specific.

## Do-not rules
- Do not alter test results.
- Do not hide failed tests.
- Do not omit unresolved risks.
- Do not include sensitive customer data or credentials.

## Output file locations
- `reports/execution-summary.md`
- `reports/defect-summary.md`

## Example prompt to use this skill
“Use the final report agent to generate the QA execution summary for the latest run.”
