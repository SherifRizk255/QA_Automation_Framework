# 19 - Authentication & Session Manager

> Support skill. Not a pipeline stage.
>
> Consumed by: System Walkthrough Agent, Automation Implementation Agent, Test Execution Agent, Self-Healing Agent.
>
> Purpose: define the ONE correct way to handle authentication for every system type in the framework, so no agent invents its own login strategy.

---

# PURPOSE

Standardize:

* Credential sourcing
* Authentication strategy per system type
* Session reuse via storage state
* NTLM / Windows authentication for Microsoft Dynamics 365 CRM
* Session expiry handling
* Multi-system authentication inside one test run

---

# CREDENTIAL SOURCING RULES

Rule 1 — Credentials come from environment variables only. Never hardcode credentials in page objects, fixtures, or spec files.

Rule 2 — Naming convention:

```
<SYSTEM>_BASE_URL
<SYSTEM>_USERNAME
<SYSTEM>_PASSWORD
```

Examples:

```
PORTAL_BASE_URL / PORTAL_USERNAME / PORTAL_PASSWORD
CRM_BASE_URL / CRM_USERNAME / CRM_PASSWORD
```

Rule 3 — Before any login attempt, validate the required variables exist. If missing, STOP with:

```
🚫 AUTH BLOCKED
Missing environment variable: <name>
```

Never substitute guessed values.

---

# STRATEGY SELECTION

| System Type | Strategy |
|-------------|----------|
| Web portal (form login) | FORM_LOGIN + storage state reuse |
| Microsoft Dynamics 365 CRM (on-prem) | NTLM via httpCredentials |
| Microsoft Dynamics 365 CRM (online) | FORM_LOGIN (Microsoft login) + storage state reuse |
| API layer | Token/header auth defined in the API config, never browser-based |

---

# FORM LOGIN + STORAGE STATE

Login once in a global setup, persist session, reuse it in every test.

Global setup pattern:

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(process.env.PORTAL_BASE_URL!);
  // perform login using the project's existing LoginPage methods
  await page.context().storageState({ path: '.auth/portal-state.json' });
  await browser.close();
}
export default globalSetup;
```

Config consumption:

```typescript
// playwright.config.ts (project entry)
use: { storageState: '.auth/portal-state.json' }
```

Rules:

* Storage state files live in `.auth/` and MUST be gitignored.
* One storage state file per system: `.auth/portal-state.json`, `.auth/crm-state.json`.
* If a test fails with a login page appearing mid-test, classify as SESSION_EXPIRED (see below), not as a locator failure.

---

# NTLM / WINDOWS AUTHENTICATION (D365 ON-PREM)

NTLM cannot be completed through form fill. It must be configured at browser context level:

```typescript
// playwright.config.ts (CRM project entry)
use: {
  httpCredentials: {
    username: process.env.CRM_USERNAME!,
    password: process.env.CRM_PASSWORD!,
  },
  ignoreHTTPSErrors: true,
}
```

Rules:

* Never attempt to fill an NTLM browser dialog with locators — it is not part of the DOM.
* If the domain is required, use `DOMAIN\\username` format in CRM_USERNAME.
* NTLM contexts must not share storage state files with form-login contexts.

---

# SESSION EXPIRY HANDLING

Detection signals:

* Redirect to login URL mid-test
* HTTP 401 responses
* "Session timed out" text on screen

Response protocol:

1. Classify failure as SESSION_EXPIRED (environment class, not automation class).
2. Regenerate storage state via global setup.
3. Re-run the affected test once.
4. If it fails again for the same reason, escalate as ENVIRONMENT blocker — do not self-heal locators.

---

# MULTI-SYSTEM AUTH IN ONE TEST

For cross-system tests (see skill 20):

* Each system keeps its own authentication strategy and its own context settings.
* Portal and CRM sessions must never share a storage state file.
* If both systems are used in one test, the CRM page/tab is created from a context configured with httpCredentials, OR from a context pre-loaded with `.auth/crm-state.json` — never from the Portal's raw context if the auth strategies differ.

---

# ABSOLUTE RULES

* Never hardcode credentials.
* Never commit `.auth/` files.
* Never re-login per test when storage state reuse is available.
* Never classify auth/session failures as locator failures.
* Never let Self-Healing modify authentication configuration.
