# Project Profile — IScore Fixed Asset Management

> Layer 2 config (skill 22 — Multi-Project Configuration). This is the only client
> project this repository currently automates. Onboarding a second project later
> means adding its own `docs/projects/<project-name>/` profile and env vars — never
> editing this one or the shared framework layer to fit it.

---

## Domain

Fixed asset tagging and tracking workflow for the IScore Asset Management Portal:
create tracking records for physical assets, filter/select assets from a grid, and
submit selections into a container for downstream Checker/Finance Checker review.

## Systems in scope

| System | Type | Auth strategy (skill 19) |
|---|---|---|
| Portal | Angular SPA, hash-routed | FORM_LOGIN + storage state reuse |
| CRM | Dynamics 365 on-prem (`cis_users` entity) | NTLM via `httpCredentials` |

Both systems authenticate with the same account (`mohamed.rizk` portal /
`Cubicsystems\mohamed.rizk` CRM) but are separate auth contexts — never share a
storage state file between them (skill 19 absolute rule).

## Role model

The portal exposes three roles, all logging in with the same portal credentials. The
active role is a field on the CRM `cis_users` record, not a portal-side setting:

| Role | CRM field value | Storage state |
|---|---|---|
| Maker | `Maker` | `.auth/maker-state.json` |
| Checker | `Checker` | `.auth/checker-state.json` |
| Finance Checker | `Finance Checker` | `.auth/finance-checker-state.json` |

To test as a given role: write the role field on the CRM record → clear the portal
session → fresh portal login → read back the active role label from the portal shell
to confirm the switch took effect. See `utils/roles/RoleSwitchOrchestrator.ts`.

## Environments

| Env | TARGET_ENV | Notes |
|---|---|---|
| DEMO | `DEMO` | Only environment currently configured (demo03.cubicsystems.com). Never PROD (skill 22 guard). |

## Compliance / restrictions

* Never touch production URLs.
* Never commit `.env`, `.auth/`, or secrets — see RULE 4 in `CLAUDE.md`.
* Never weaken assertions to force a green run.
* Never use `waitForTimeout`.
* No hardcoded URLs, credentials, module names, or role labels in specs/pages —
  resolve through `config/resources.ts` (`ENV.portal`, `ENV.crm`, `ROLES`) and the
  locator repository (skill 24).

## Artifact roots for this project

* Locators: `docs/analysis/locator-repository.json` — `PORTAL.*`/`TAGGING.*`/`CRM.*`
  elementId prefixes (single shared repository file per skill 24 — never a second one).
* Test design: `docs/projects/iscore-asset-management/test-design/`.
* Regression suite: `tests/regression-tcs/{authentication,tagging}/`.
* Framework self-tests: `tests/framework/{config,locator-repository}/`.

## Locator verification status

Every locator repository entry is currently `UNVERIFIED` — reasoned from this
profile and the requirement set, not yet confirmed against the live IScore Asset
Management DOM. Entries must be promoted to `ACTIVE` (or corrected) via a live
system walkthrough (skill 02) before the regression suite's results can be trusted
against the real application. Until then, treat any run of
`tests/regression-tcs/**` as pending live verification — the offline framework
self-tests in `tests/framework/{config,locator-repository}/` do not require a live
app and remain trustworthy as-is.

## Config keys

See `.env.example` for the full list, and `config/resources.ts` for how each is
consumed. Summary:

```
PROJECT_NAME / PROJECT_DOMAIN / TARGET_ENV / AIR_GAPPED
PORTAL_BASE_URL / PORTAL_LOGIN_PATH / PORTAL_USERNAME / PORTAL_PASSWORD
CRM_BASE_URL / CRM_ORG_PATH / CRM_USERNAME / CRM_PASSWORD
CRM_APP_ID / CRM_USER_ENTITY / CRM_AUTOMATION_USER_RECORD_ID
TAGGING_MULTI_SELECT_COUNT / TAGGING_FILTER_FIELD_LABEL
```
