# 22 - Multi-Project Configuration

> Support skill. Not a pipeline stage.
>
> Consumed by: Project Intake Agent, Orchestrator, Automation Implementation Agent, Test Execution Agent.
>
> Purpose: the framework serves multiple client projects (e.g., SAIB, ABK, HDB, EnPPi, Fasal, AWB). This skill defines how project-specific configuration is isolated so switching projects never requires code changes.

---

# CONFIGURATION LAYERS

Layer 1 — Framework (shared, never project-specific): page-object base classes, utilities, reporting standard, lifecycle definitions.

Layer 2 — Project profile (per client): `docs/projects/<project-name>/project-profile.md` — domain, modules, environments, roles, compliance restrictions, data ownership.

Layer 3 — Runtime environment: `.env` files, one per project-environment pair.

---

# ENV FILE CONVENTION

```
.env                      # active configuration (gitignored)
env/.env.saib.uat         # committed templates without secrets
env/.env.abk.sit
env/.env.hdb.uat
```

Switching projects = copying the template to `.env` and filling secrets. Never edit URLs inside spec files or page objects.

Every `.env` must define, per system in scope:

```
<SYSTEM>_BASE_URL
<SYSTEM>_USERNAME
<SYSTEM>_PASSWORD
```

Plus:

```
PROJECT_NAME=            # e.g. SAIB
TARGET_ENV=              # SIT | UAT | DEV
```

---

# PLAYWRIGHT PROJECT SEPARATION

Each system in scope is a Playwright `project` entry with its own auth strategy (per skill 19):

```typescript
projects: [
  { name: 'portal', use: { baseURL: process.env.PORTAL_BASE_URL, storageState: '.auth/portal-state.json' } },
  { name: 'crm',    use: { baseURL: process.env.CRM_BASE_URL, httpCredentials: { ... }, ignoreHTTPSErrors: true } },
]
```

Cross-system specs run under the project of the SOURCE system and create the second system's context per skill 20.

---

# ARTIFACT ISOLATION

All pipeline artifacts for a client project live under:

```
docs/projects/<project-name>/analysis/
docs/projects/<project-name>/test-design/
docs/projects/<project-name>/reports/
```

Shared/legacy artifacts in `docs/analysis/` and `docs/test-design/` remain valid for the currently active project but new multi-client work MUST use the per-project layout. The Orchestrator's Run Context must state which project's artifact root is active.

---

# GUARD RULES

* Before any execution, validate `PROJECT_NAME` and `TARGET_ENV` are set; STOP if missing.
* Never point automation at a production URL. If TARGET_ENV=PROD is detected: STOP with a blocker.
* Air-gapped projects (e.g., on-prem SIT): declare `AIR_GAPPED=true` in `.env`; agents must not attempt network installs or external fetches when set.
* Locator repositories are per-project. Never heal a SAIB locator using evidence from an ABK DOM.

---

# ABSOLUTE RULES

* Never hardcode a client URL, credential, or environment name in framework code.
* Never mix artifacts from two projects in one artifact folder.
* Never run against production.
