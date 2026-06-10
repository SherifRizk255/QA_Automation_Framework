# Projects Folder

Each automation project should have its own folder under `docs/projects/`.

Project-specific files must not be mixed with the generic workflow skill files under `docs/ai-workflow/`. The generic skill files are reusable across all projects and must not contain project URLs, credentials, customer data, module-specific business rules, or environment-specific values.

## Recommended Project Structure

```text
docs/projects/<project-name>/
├── project-profile.md
├── environment-notes.md
├── modules.md
├── risks.md
└── project-test-strategy.md
```

## Guidance
- Store project context, modules, risks, environment notes, and project-level test strategy here.
- Store credentials only in approved secure locations such as `.env` or a project-approved secret store.
- Store BRD/FRD and requirement files under `docs/requirements/` or inside the project folder when project-specific organization is needed.
- Keep generated analysis in `docs/analysis/`.
- Keep generated test design in `docs/test-design/`.
- Keep review and approval reports in `docs/reports/`.
