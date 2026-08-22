# Project Profile — IScore Fixed Asset Management

> Layer 2 config (skill 22 — Multi-Project Configuration). This profile isolates the
> IScore Asset Management project's domain, environments, and roles from the
> currently active SAIB configuration in `docs/projects/README.md`. Switching to this
> project never requires editing framework code — only `.env` + this profile.

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
| Maker | `Maker` | `.auth/asset-maker-state.json` |
| Checker | `Checker` | `.auth/asset-checker-state.json` |
| Finance Checker | `Finance Checker` | `.auth/asset-finance-checker-state.json` |

To test as a given role: write the role field on the CRM record → clear the portal
session → fresh portal login → read back the active role label from the portal shell
to confirm the switch took effect. See `utils/asset-management/RoleSwitchOrchestrator.ts`.

## Environments

| Env | TARGET_ENV | Notes |
|---|---|---|
| UAT | `UAT` | Only environment currently configured. Never PROD (skill 22 guard). |

## Compliance / restrictions

* Never touch production URLs.
* Never commit `.env`, `.auth/`, or secrets — see RULE 4 in `CLAUDE.md`.
* Never weaken assertions to force a green run.
* Never use `waitForTimeout`.
* No hardcoded URLs, credentials, module names, or role labels in specs/pages —
  resolve through `config/resources.ts` (`ENV.assetPortal`, `ENV.assetCrm`, `ROLES`)
  and the locator repository (skill 24).

## Artifact roots for this project

* Locators: `docs/analysis/locator-repository.json`, `elementId` prefix `ASSET.*`
  (shared single file per skill 24 — never a second locator repository; namespaced
  entries coexist with `PORTAL.*` / `CRM.*` SAIB entries the same way Transfers and
  Accounts already coexist).
* Test design: `docs/projects/iscore-asset-management/test-design/`.
* Regression suite: `tests/regression-tcs/asset-management/`.
* Framework self-tests: `tests/framework/asset-management/`.

## Locator verification status

All `ASSET.*` locator repository entries are currently `UNVERIFIED` — reasoned from
this profile and the requirement set, not yet confirmed against the live IScore
Asset Management DOM. They must be promoted to `ACTIVE` (or corrected) via a live
system walkthrough (skill 02) before the regression suite's results can be trusted
against the real application. Until then, treat any run of
`tests/regression-tcs/asset-management/**` as pending live verification — the
offline framework self-tests in `tests/framework/asset-management/` do not require
a live app and remain trustworthy as-is.

## Config keys added

See `.env.example` for the full list. Summary:

```
ASSET_PORTAL_BASE_URL / ASSET_PORTAL_LOGIN_PATH / ASSET_PORTAL_USERNAME / ASSET_PORTAL_PASSWORD
ASSET_CRM_BASE_URL / ASSET_CRM_USERNAME / ASSET_CRM_PASSWORD / ASSET_CRM_APP_ID
ASSET_CRM_ORG_PATH / ASSET_CRM_USER_RECORD_ID
ASSET_TAGGING_MULTI_SELECT_COUNT / ASSET_TAGGING_FILTER_FIELD_LABEL
```
