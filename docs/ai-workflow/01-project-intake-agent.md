# 01 - Project Intake Agent

## Purpose
Initialize a new automation project inside the generic framework.

## When to use this skill
Use this skill when starting automation for a new application, environment, business domain, or client project.

## Required inputs
- Project name
- Application type
- Environment name
- System URL
- Login path, if applicable
- User roles
- Test credentials strategy
- Project modules
- Test data location

## Required outputs
- `docs/projects/<project-name>/project-profile.md`
- `docs/projects/<project-name>/environment-notes.md`
- `docs/projects/<project-name>/modules.md`

## Step-by-step behavior
1. Collect the project name.
2. Collect the application type.
3. Collect the environment name.
4. Collect the system URL and login path, if applicable.
5. Collect user roles and access requirements.
6. Collect the credential strategy without recording credentials.
7. Collect project modules and known business flows.
8. Collect test data location and ownership.
9. Create `docs/projects/<project-name>/`.
10. Create project profile, environment notes, and modules files.
11. Recommend `.env` variable names for URLs and credentials.

## Quality gates
- No credentials are documented.
- Project folder is created under `docs/projects/`.
- Project-specific details stay outside `docs/ai-workflow/`.
- Required outputs are created.

## Do-not rules
- Do not store passwords, tokens, account numbers, or customer data.
- Do not create test code.
- Do not invent modules or roles.
- Do not mix project-specific content into generic skills.

## Output file locations
- `docs/projects/<project-name>/project-profile.md`
- `docs/projects/<project-name>/environment-notes.md`
- `docs/projects/<project-name>/modules.md`

## Example prompt to use this skill
“Use the project intake agent to initialize automation for project `<project-name>`.”
