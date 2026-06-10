# QA Automation Agent Instructions

## Purpose
This repository uses a modular AI QA workflow for Playwright JavaScript automation. `AGENTS.md` is the global rule file only. Detailed stage instructions live in reusable markdown skill files under `docs/ai-workflow/`.

## Modular Workflow
Before doing any workflow task, read the specific skill file that matches the current stage:

- `docs/ai-workflow/00-master-workflow.md`
- `docs/ai-workflow/01-project-intake-agent.md`
- `docs/ai-workflow/02-system-walkthrough-agent.md`
- `docs/ai-workflow/03-requirement-analysis-agent.md`
- `docs/ai-workflow/04-test-scenario-agent.md`
- `docs/ai-workflow/05-manual-test-case-agent.md`
- `docs/ai-workflow/06-automation-implementation-agent.md`
- `docs/ai-workflow/07-test-execution-agent.md`
- `docs/ai-workflow/08-failure-analysis-agent.md`
- `docs/ai-workflow/09-self-healing-agent.md`
- `docs/ai-workflow/10-final-report-agent.md`
- `docs/ai-workflow/11-qa-review-agent.md`

Do not mix all workflow stages in one response unless the user explicitly asks for an end-to-end workflow. Stop at approval gates when a skill requires review or sign-off before continuing.

## Project Separation
- Keep generic workflow instructions under `docs/ai-workflow/`.
- Keep project-specific data under `docs/projects/<project-name>/`, `docs/requirements/`, `docs/analysis/`, `docs/test-design/`, and project-specific report folders.
- Do not put project URLs, credentials, module names, customer data, or business-specific values inside generic skill files.
- Each automation project may have its own URL, credentials strategy, BRD/FRD files, modules, test data, screenshots, reports, and execution notes.

## Framework Rules
- Use JavaScript only unless a project explicitly says otherwise.
- Use Playwright only unless a project explicitly says otherwise.
- Use ES module syntax with `import` and `export`.
- Use Page Object Model for UI automation.
- Keep locators inside Page Object files.
- Keep reusable data in `data`, reusable setup in `fixtures`, and shared helpers in `utils`.
- Do not hardcode credentials.
- Read environment values from `.env` or project-specific config files.
- Do not expose usernames, passwords, account numbers, NID, phone numbers, card numbers, or customer data in reports.
- Mask sensitive values in screenshots and reports where possible.
- Do not use hard-coded waits.
- Do not hide real application defects.
- Classify all failures.
- Self-healing is allowed only for automation issues, not application defects.
- Never perform destructive or risky actions unless explicitly approved.

## Failure Classification
Classify every failure as one of:

1. Automation script issue
2. Application defect
3. Test data issue
4. Environment issue
5. Requirement ambiguity
6. Access/permission issue
7. Known business blocker

## Safety Rules
- Do not create fake locators.
- Do not invent business rules.
- Do not invent expected results.
- Do not remove existing working tests or automation code unless explicitly requested.
- Do not overwrite project-specific files unless necessary for the requested task.
- Do not submit real transactions, delete data, change customer data, change passwords, or perform irreversible actions without explicit approval.
