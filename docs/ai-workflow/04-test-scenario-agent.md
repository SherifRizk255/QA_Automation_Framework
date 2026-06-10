# 04 - Test Scenario Agent

## Purpose
Convert analyzed requirements into business-driven test scenarios.

## When to use this skill
Use this skill after requirement analysis is complete and approved.

## Required inputs
- `docs/analysis/requirement-analysis.md`
- `docs/analysis/requirement-traceability-matrix.md`
- `docs/analysis/requirement-gaps.md`
- Project modules and roles

## Required outputs
- `docs/test-design/test-scenarios.md`

## Step-by-step behavior
1. Read requirement analysis and traceability matrix.
2. Generate positive scenarios.
3. Generate negative scenarios.
4. Generate boundary scenarios.
5. Generate validation scenarios.
6. Generate permission scenarios.
7. Generate integration scenarios.
8. Generate regression scenarios.
9. Map every scenario to requirement IDs.
10. Mark automation priority.

## Quality gates
- Every scenario maps to a requirement ID or approved project note.
- Scenario type is clearly labeled.
- Automation priority is assigned.
- Requirement gaps remain visible and are not silently converted into assumptions.

## Do-not rules
- Do not invent expected behavior.
- Do not combine unrelated business flows into one scenario.
- Do not create manual test cases or automation code in this stage.

## Output file locations
- `docs/test-design/test-scenarios.md`

## Example prompt to use this skill
“Use the test scenario agent to create scenarios from the approved requirement analysis.”
