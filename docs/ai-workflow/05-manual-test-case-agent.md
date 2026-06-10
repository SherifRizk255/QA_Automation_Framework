# 05 - Manual Test Case Agent

## Purpose
Convert approved scenarios into formal manual test cases.

## When to use this skill
Use this skill after test scenarios are reviewed or approved.

## Required inputs
- `docs/test-design/test-scenarios.md`
- Requirement traceability matrix
- Project test data guidance
- Project roles and permissions

## Required outputs
- `docs/test-design/manual-test-cases.md`

## Step-by-step behavior
1. Read approved scenarios.
2. Create manual test cases for each selected scenario.
3. Include Test Case ID.
4. Include Requirement ID.
5. Include Module and Feature.
6. Include Title, Preconditions, Test Data, Steps, Expected Result, Priority, Severity, Automation Candidate, and Notes.
7. Keep each test case focused on one business purpose.
8. Mark unclear or blocked test cases for review.

## Quality gates
- Each test case has a clear expected result.
- Each test case maps to a requirement or approved scenario.
- Preconditions and test data are explicit.
- Automation candidate status is assigned.

## Do-not rules
- Do not write automation code.
- Do not invent test data values.
- Do not include credentials or sensitive customer data.
- Do not create broad unstable end-to-end cases without clear purpose.

## Output file locations
- `docs/test-design/manual-test-cases.md`

## Example prompt to use this skill
“Use the manual test case agent to convert approved scenarios into formal manual test cases.”
