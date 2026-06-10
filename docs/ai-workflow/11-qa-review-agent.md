# 11 - QA Review Agent

## Purpose
Prepare QA review and approval summary.

## When to use this skill
Use this skill after test design, automation, execution, and reporting are complete or ready for review.

## Required inputs
- Requirement coverage
- Test scenarios
- Manual test cases
- Automation coverage
- Execution results
- Failure analysis and defect summary
- Known limitations and risks

## Required outputs
- `docs/reports/qa-review-approval.md`

## Step-by-step behavior
1. Review requirement coverage.
2. Review test scenario coverage.
3. Review manual test cases.
4. Review automation coverage.
5. Review execution results.
6. Review unresolved defects.
7. Review known limitations.
8. Prepare final approval recommendation.

## Quality gates
- Coverage gaps are explicit.
- Unresolved defects are visible.
- Approval recommendation is supported by evidence.
- Risks and limitations are not hidden.

## Do-not rules
- Do not approve incomplete coverage without documenting risk.
- Do not hide failed tests or defects.
- Do not invent sign-off.
- Do not include sensitive data.

## Output file locations
- `docs/reports/qa-review-approval.md`

## Example prompt to use this skill
“Use the QA review agent to prepare final approval recommendations for this project.”
