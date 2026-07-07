# AI MODEL GUIDELINES — QA Automation Framework

> Master reference for ANY AI model or agent working on this project.
> Read this file completely before writing, editing, or running anything.
> When this file conflicts with your assumptions, this file wins.

---

## 1. What this project is

A reusable, AI-assisted QA automation framework built on Playwright + TypeScript with Allure reporting. It serves multiple banking/fintech client projects (SAIB, ABK, HDB, EnPPi, Fasal, AWB) across two main system families:

* **Internet Banking Portals** (Angular-style web apps, form login)
* **Microsoft Dynamics 365 CRM** (on-prem, NTLM auth, heavy iframes, `data-id` attributes)

The full QA lifecycle is driven by the skill files in `docs/ai-workflow/` (stages 00–18 plus support skills 19–25). The stage↔file mapping table in `00-master-workflow.md` is the source of truth for which file implements which stage.

---

## 2. The prime directive: FIND before you CREATE

The single most damaging failure mode observed in this project is agents fabricating parallel infrastructure that already exists. Before creating ANY file, method, locator, or fixture:

1. Search the whole repo for the concept by multiple names (`grep -ri "login" pages/`, `grep -ri "fixture" .`).
2. Open and read the closest match fully.
3. Reuse it, or extend it in place.
4. Only create new when you can state exactly why nothing existing fits.

Files copied in from other projects will reference infrastructure by name (e.g., `BaseCrmPage`, `AREAS`, `crmFixtures`). Those dependencies almost always exist in this project under the same or a near-identical name — locate them; do not scaffold replacements.

---

## 3. Folder conventions

```
config/           config/resources.ts — THE central resource file: URLs, routes,
                  env access, shared test data, reporting identity (skill 24)
pages/            page objects (POM) — one class per screen/area; CRM pages extend BaseCrmPage
fixtures/         Playwright test.extend fixtures — one entry per page object
tests/            spec files, grouped per system/module
utils/            shared helpers only (locatorRepository, cubicHtmlReporter,
                  failureClassification, reportGenerator — no page-specific logic)
docs/ai-workflow/ the skill files (00–25) — the QA pipeline definition
docs/analysis/    walkthrough artifacts (module-prefixed) + locator-repository.json
docs/test-design/ test cases, scenarios, coverage, test-lifecycle.md
docs/projects/    per-client artifact roots (multi-project layout)
reports/          execution + failure-analysis + healing reports (gitignored)
reports/cubic-report/  Cubic HTML execution report — regenerated on every run (skill 25)
.auth/            storage state files (gitignored, never commit)
env/              per-project .env templates
```

Artifact naming: module-prefixed kebab-case, e.g. `accounts-management-locator-inventory.md`.

---

## 4. Naming conventions

* Page objects: `PascalCase` classes in files named `<Entity>Page.ts` (e.g., `ServiceRequestsPage.ts`), extending `BaseCrmPage` (CRM) or the portal base page.
* Spec files: `kebab-case.spec.ts`. Cross-system: `<action>-<source>-<target>.spec.ts`.
* Test titles: `TC-<AREA>-<NNN> | <business description>` — the TC id is mandatory (Allure/traceability join key).
* Fixtures: `camelCase` matching the page-object name (`serviceRequestsPage`).
* Locator element IDs in the repository: `SCREEN.ELEMENT_NAME` uppercase.

---

## 5. CRM (Dynamics 365) patterns — do not reinvent

* **Base class**: every CRM page object extends `pages/crm/BaseCrmPage.ts`, which owns `waitForDynamicsReady()`, `waitForGrid()`, `waitForRecordReady()`, `firstDataRow()`, `switchToArea()`, and the `repository` (LocatorRepository) instance. Never re-implement these privately.
* **Auth**: NTLM via `httpCredentials` at context level, or the `setupNtlmAuth()` route-intercept helper in `tests/helpers/ntlm.ts` (skill 19). Never fill an NTLM dialog with locators.
* **URLs**: CRM entity-list URLs come ONLY from `ROUTES.crm.*` / `crmEntityListUrl()` in `config/resources.ts` (skill 24) — never inline an org path, app id, or view id.
* **Area switching**: `switchToArea('<SCREEN>.<AREA_ITEM_ID>')` from `BaseCrmPage` — the target locator lives in `docs/analysis/locator-repository.json`; never hardcode a `data-id` inline.
* **Grid readiness**: `waitForGrid()` — internally: `domcontentloaded` → spinner hidden → `[aria-label="Select row 2"]` visible (row 2 is the first data row; row 1 is the header).
* **Record readiness**: `waitForRecordReady({ entityName, expectedFormLocator })` — always pass both.
* **Forms live inside `main`/`[role="main"]`** — scope record assertions to it.
* Long timeouts are intentional (D365 is slow): grids up to 120s, records 30–60s. Do not "optimize" them down.

## 6. Portal patterns — do not reinvent

* Form login via env credentials, storage state reuse where configured.
* Transfer flows: capture correlation values (from-account, to-account, amount) BEFORE confirming; validate them again on the summary screen.
* Account selection rules: never select the To-account equal to the From-account; currencies must match — otherwise the flow dead-ends by design.

## 7. Cross-system tests

Follow skill 20 exactly: same-context new tab when auth allows, second context when auth differs; unique-key correlation preferred over "latest row"; polling (`expect(...).toPass`) for propagation, never fixed sleeps; elevated timeout (240s).

---

## 7b. Central resources — no hardcoded values, ever (skill 24)

* `config/resources.ts` is the ONLY file allowed to contain literal URLs, org paths, app ids, view ids, or shared test data — each as an env-overridable default. Specs and page objects import `ENV` / `ROUTES` / `TEST_DATA` from it.
* `process.env` reads are forbidden in specs and page objects — only `config/`, `utils/`, and `playwright.config.ts` may read it.
* Locators for registered elements resolve through `docs/analysis/locator-repository.json` via `LocatorRepository`.
* Verification greps that must return zero matches: `grep -rn "https\?://" tests/ pages/ fixtures/` and `grep -rn "process\.env\." tests/ pages/`.

## 7c. Execution reporting (skill 25)

* Every `npx playwright test` run auto-generates the **Cubic HTML report** at `reports/cubic-report/index.html` (history copies per run) via the custom reporter `utils/cubicHtmlReporter.ts` registered in `playwright.config.ts`. Never unregister it.
* Failures carry an F1–F5 classification from `utils/failureClassification.ts` answering: automation failure (F1) vs application defect (F2) vs data (F3) / environment (F4) / ambiguity (F5) — plus the failing step, error location, recommendation, and embedded screenshots.
* Allure results (`allure-results/`, skill 21) are the machine-consumable layer; `npm run report:summary` produces the markdown summary; `npm run report:allure` builds the Allure site.

## 8. Wiring a new page object

1. Create the class in `pages/`, extending the correct base.
2. Register it in the EXISTING fixtures file with the same `test.extend` pattern as its neighbors. Never create a second fixtures file.
3. Import in specs from the fixtures file, never instantiate page objects with `new` inside a spec.

---

## 9. Definition of done — every task

1. `npx tsc --noEmit` → zero errors.
2. Run the touched spec in isolation: `npx playwright test <file>.spec.ts`.
3. Allure metadata present: feature, story, severity, TC id in title (skill 21).
4. Code passes the Clean Code review checklist (skill 23): spec files free of raw locators/waits, page objects in standard section order, naming per the naming table.
5. No hardcoded URLs/credentials/locators — everything through `config/resources.ts`, `.env`, and the locator repository (skills 19/22/24).
6. No modification to unrelated passing tests, fixtures, or configs.
7. If something is genuinely missing or tenant-specific (e.g., a D365 `data-id`), STOP and ask with a precise question — never guess values.

---

## 10. Self-healing boundaries

Healing applies to automation artifacts only (locators, waits, page objects). Never heal by weakening assertions, deleting setup/teardown, bypassing validations, or reclassifying an application defect as flaky. Confidence gates: HIGH/MEDIUM may auto-apply with `count()==1 && visible && enabled` verification; LOW → manual review. Every heal updates `docs/analysis/locator-repository.json` history.

---

## 11. Behavioral rules for agents

* Report a short plan, then execute; don't stall on questions answerable by reading the repo.
* When a user-provided snippet references unknown symbols, treat that as "find it in this repo," not "create it."
* Prefer small, verifiable increments: implement → type-check → run → report.
* Requirements are the source of truth over observed UI behavior; UI observation feeds implementation, not intent.
* Never touch production URLs, never commit secrets, never delete evidence artifacts.
