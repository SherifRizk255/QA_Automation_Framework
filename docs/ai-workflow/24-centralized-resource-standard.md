# 24 - Centralized Resource Standard (No Hardcoded Locators / URLs / Data)

> Support skill. Not a pipeline stage.
>
> Consumed by: Automation Implementation Agent (13), Self-Healing Agent (16), System Walkthrough Agent (02), Test Execution Agent (14), QA Review Agent (18), Clean Code Standard (23).
>
> Purpose: every element locator, URL, route, environment value, and shared test-data value lives in exactly ONE central resource, and every new test file consumes it from there. No spec file or page object ever contains a hardcoded URL, host, org path, app id, view id, credential, or inline locator for a registered element.

---

# THE TWO RESOURCE LAYERS

The framework has exactly two central resources. Nothing else may hold shared values.

| Resource | Holds | Consumed via |
|---|---|---|
| `config/resources.ts` | URLs, routes, org paths, app ids, view ids, env values, credentials access, shared test data, reporting identity | `import { ENV, ROUTES, TEST_DATA, PROJECT, REPORTING } from '<rel-path>/config/resources'` |
| `docs/analysis/locator-repository.json` | Every element locator: primary + fallback chain + confidence + healing history | `LocatorRepository` class in `utils/locatorRepository.ts` (exposed to CRM pages through `BaseCrmPage.repository`) |

Rules:

* `config/resources.ts` is the ONLY file in the codebase allowed to contain a literal URL or tenant-specific value — and each literal there is a committed default, overridable by an `.env` variable (skill 22).
* Credentials are NEVER literals anywhere — `.env` only. `ENV.portal.username` / `ENV.crm.password` read them lazily and STOP with `🚫 AUTH BLOCKED — Missing environment variable: <name>` when absent (skill 19).
* Locator definitions in page objects or reusable components are allowed ONLY for elements not yet registered in the repository; once an element is registered, the repository entry is authoritative and competing inline locators are forbidden (skill 23).

---

# LOCATOR CONSUMER OWNERSHIP

The Locator Repository owns registered locator definitions, fallback metadata, confidence, and healing history. The consuming automation class owns the scope in which a locator is resolved.

Use the narrowest correct consumer:

* Unregistered reusable widget locator → reusable component.
* Unregistered feature-specific or selected-display locator → feature page object.
* Test specification → never owns a locator.

Healing updates the registered repository entry or the current narrowest owner. It must not create a duplicate locator at another layer.

---

# INPUT → PROCESS → OUTPUT

## Input
A new or edited spec file, page object, fixture, or helper.

## Process — before writing any value, answer in order:

1. **Is it a URL, route, org path, app id, view id?** → Use `ROUTES.*` or the builders `crmEntityListUrl()` / `portalHashRoute()`. If the route doesn't exist yet, ADD it to `config/resources.ts` (new constant + env override), then consume it.
2. **Is it a credential or environment value?** → Use `ENV.*`. Never `process.env.X` directly in specs or page objects — the resource file is the single accessor.
3. **Is it shared test data (amounts, expected users, seeded values)?** → Use `TEST_DATA.*`, adding an env-overridable entry if missing. Purely local one-test data may stay a spec-level `UPPER_SNAKE_CASE` constant (skill 23).
4. **Is it an element locator?** → Check `docs/analysis/locator-repository.json` for an existing `SCREEN.ELEMENT_NAME` entry first. Exists → resolve through `LocatorRepository` from the owning page or component. Doesn't exist → either register it (preferred for stable, reused elements) or define it once in the narrowest correct private owner per the skill 23 priority order.

## Output
Code in which:

* `grep -rn "https\?://" tests/ pages/ fixtures/` returns ZERO matches.
* `grep -rn "process\.env\." tests/ pages/` returns ZERO matches (only `config/`, `utils/`, `playwright.config.ts` may read `process.env`).
* Every registered element resolves through the locator repository.

---

# ADDING A NEW VALUE TO `config/resources.ts`

1. Choose the section: `PROJECT` | `ENV` | `ROUTES` | `TEST_DATA` | `REPORTING`.
2. Add the committed default via the `env('VAR_NAME', 'default')` helper — never a bare literal — so every value stays overridable per project/environment.
3. Document the variable in `.env.example` (commented if the default suffices).
4. Consume it by import. Never copy the value out into another file.

New CRM entity list page? Compose it — do not inline:

```typescript
myEntity: crmEntityListUrl({
  orgPath: CRM_ORG_PATH_UAT,
  entityName: 'cis_myentity',
  viewId: CRM_VIEW_ID_MY_ENTITY,   // omit to use the entity's default view
}),
```

---

# FALLBACK BEHAVIOR

* Missing optional env var → committed default applies silently.
* Missing mandatory credential → lazy STOP at first use with the exact variable name; agents must surface that message verbatim, not guess values.
* `TARGET_ENV=PROD` → the module THROWS at load. Never weaken this guard (skill 22).
* Locator id not found in the repository → `LocatorRepository` throws `Locator repository entry not found: <id>`; classify as F1, fix the id or register the element — never paper over with an inline locator.

---

# SELF-HEALING INTERACTION (skill 16)

* Healing a registered locator updates the repository entry (primary/fallbacks/history) — never the consuming page object.
* Healing an unregistered locator updates its current narrowest Page Object or Component owner.
* Healing must NEVER "fix" a failure by inlining a URL or bypassing the resource file.

---

# REVIEW GATE (added to skill 23's checklist)

1. Zero literal URLs/hosts/app ids/view ids outside `config/resources.ts`.
2. Zero `process.env` reads outside `config/`, `utils/`, `playwright.config.ts`.
3. New values added with env override + `.env.example` documentation.
4. Registered elements resolved through the locator repository only.

Fail any item → fix before handing off.

---

# ABSOLUTE RULES

* Never hardcode a URL, host, org path, app id, view id, credential, or registered locator outside the two central resources.
* Never create a second resource/constants file — extend `config/resources.ts`.
* Never read `process.env` directly in a spec or page object.
* Never commit real credentials — defaults in `config/resources.ts` may include non-secret tenant routing values only.
