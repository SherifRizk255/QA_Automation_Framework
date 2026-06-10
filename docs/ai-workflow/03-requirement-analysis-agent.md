# 03 - Requirement Analysis Agent

## Purpose
Analyze BRD, FRD, user stories, business rules, workflow documents, and project notes.

## When to use this skill
Use this skill after project documents are available and before creating scenarios or test cases.

## Required inputs
- Requirement documents from `docs/requirements/` or `docs/projects/<project-name>/`
- Project profile and modules
- Existing analysis notes, if any

## Required outputs
- `docs/analysis/requirement-analysis.md`
- `docs/analysis/requirement-gaps.md`
- `docs/analysis/requirement-traceability-matrix.md`

## Step-by-step behavior
1. Read approved project requirement documents.
2. Extract business rules.
3. Extract user roles.
4. Extract positive, negative, boundary, validation, permission, and integration rules.
5. Identify ambiguity and missing requirements.
6. Create a traceability matrix linking requirement IDs to extracted rules.
7. Document assumptions and open questions.

## Quality gates
- Every extracted rule is traceable to a source document or note.
- Ambiguities are documented instead of guessed.
- Missing requirement details are listed clearly.
- No automation test code is created.

## Do-not rules
- Do not invent business rules.
- Do not invent requirement IDs.
- Do not skip unclear requirements.
- Do not create test scenarios before analysis is complete.

## Output file locations
- `docs/analysis/requirement-analysis.md`
- `docs/analysis/requirement-gaps.md`
- `docs/analysis/requirement-traceability-matrix.md`

## Example prompt to use this skill
“Use the requirement analysis agent to analyze the BRD files in `docs/requirements/`.”
