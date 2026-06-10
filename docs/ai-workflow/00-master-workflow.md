# 00 - Master Workflow

## Purpose
Define the reusable end-to-end AI QA workflow for any Playwright JavaScript automation project in this repository.

## When to use this skill
Use this skill when the user asks for the overall workflow, wants to start a new project, or asks Codex to coordinate multiple QA workflow stages.

## Required inputs
- Project name or intended project context
- Requested workflow stage or desired end-to-end scope
- Approval status for each stage, when applicable
- Location of project documents, requirements, or environment notes

## Required outputs
- Clear workflow stage selection
- Stage-specific next action
- Approval gate status
- Links or paths to stage outputs

## Step-by-step behavior
1. Identify the requested workflow stage.
2. Read the matching skill file before acting.
3. Confirm whether previous stage outputs exist.
4. Use only the needed stage unless the user explicitly asks for multiple stages.
5. Stop at approval gates before moving to the next stage.
6. Keep generic workflow content separate from project-specific content.
7. Store outputs in the folder defined by the stage skill.

## Quality gates
- The selected skill file was read before work begins.
- Project-specific data is not written into generic skill files.
- The response does not mix unrelated workflow stages.
- Approval gates are respected.

## Do-not rules
- Do not create automation code during intake, analysis, or design stages.
- Do not run tests during design stages unless explicitly requested.
- Do not self-heal failures before failure analysis is complete.
- Do not bypass approvals.

## Output file locations
- Generic workflow: `docs/ai-workflow/`
- Project data: `docs/projects/<project-name>/`
- Requirements: `docs/requirements/`
- Analysis: `docs/analysis/`
- Test design: `docs/test-design/`
- Reports: `docs/reports/` and `reports/`

## Example prompt to use this skill
“Use the master workflow to start a new QA automation project and tell me which stage should run first.”
