# 26 - CRM Test Automation — NTLM Authentication (MANDATORY)

> Support skill. Not a pipeline stage.
>
> Consumed by: Automation Implementation Agent, Self-Healing Agent, Clean Code passes, QA Review Agent.
>
> **Applies to: every test case that opens, acts on, or validates anything in the Dynamics 365 CRM.**
> Read this before implementing OR refactoring any CRM test. The CRM sits behind IIS Windows
> Authentication (NTLM). Getting this wrong is the single most repeated failure in this framework.
> This skill exists so it never happens again. The mechanism below is **settled — not up for re-exploration.**

---

# 1. THE ONE RULE

Every D365 CRM page/tab is created from a context configured with **`httpCredentials`** so Chrome
performs the NTLM handshake natively at the TCP-connection level:

```typescript
const crmContext = await browser.newContext({
  viewport: null,                    // maximize rule — manual contexts do NOT inherit config viewport (skill 13)
  httpCredentials: {
    username: ENV.crm.username,      // DOMAIN\username from .env (skill 24)
    password: ENV.crm.password,
    origin:   ENV.crm.origin,        // scope credentials to the CRM origin only
  },
  ignoreHTTPSErrors: true,           // CRM uses a private internal CA
});
const crmTab = await crmContext.newPage();
await maximizeWindow(crmTab);
await crmTab.goto(ROUTES.crm.<entity>, { waitUntil: 'domcontentloaded' });
```

* `waitUntil: 'domcontentloaded'` — never `networkidle`; D365 keeps polling and never idles.
* URLs come ONLY from `ROUTES.crm.*` / `crmEntityListUrl()` in `config/resources.ts` (skill 24).
* After `goto`, use the `BaseCrmPage` readiness methods (`waitForGrid()`, `waitForRecordReady()`), never sleeps.

# 2. WHY (so no agent "simplifies" or "re-solves" it)

* NTLM is a multi-round-trip, **connection-level** challenge/response. D365 on-prem sends
  `Persistent-Auth: true` and sets **no session cookie** — auth is bound to the TCP connection,
  so cookie reuse (`storageState`) cannot work for CRM auth.
* `httpCredentials` at context level lets Chromium's native network stack negotiate NTLM per
  connection. This is the **only viable mechanism for D365** in this framework — verified by
  TC-CROSS-001 (`tests/crm/cross-system/transfer-between-accounts-crm-log.spec.ts`).
* The alternative — intercepting requests with `page.route()` and fulfilling them through the
  Node `httpntlm` package (`setupNtlmAuth` in `tests/helpers/ntlm.ts`) — **was tested against
  D365 and crashes the native module (Windows 0xC0000409)**: D365 fires 100+ parallel
  sub-requests, each forcing a fresh TCP connection + full NTLM handshake.

# 3. FORBIDDEN FOR D365 CRM — all of these failed here; never reintroduce them

* ❌ `setupNtlmAuth()` / `httpntlm` route-interception on a D365 page → native crash `0xC0000409` under D365's request concurrency.
* ❌ `storageState` / saved cookies as the CRM auth mechanism → D365 issues no auth cookie; you get `ERR_INVALID_AUTH_CREDENTIALS`.
* ❌ Filling an NTLM browser dialog with locators → the dialog is not part of the DOM (skill 19).
* ❌ Reusing the Portal's form-login context for CRM tabs → auth strategies differ; create a separate NTLM context (skill 20).
* ❌ `--auth-server-whitelist` Chrome flags or `connectOverCDP` to a logged-in Chrome as an auth workaround — historic dead ends; do not re-explore.
* ❌ Removing `ignoreHTTPSErrors: true` / `origin` scoping from the CRM context during a refactor.
* ❌ Hardcoding CRM credentials or URLs anywhere — `.env` via `ENV.crm.*` and `ROUTES.crm.*` only (skill 24).

**If any of these appears in a CRM test, it is a bug — revert to the Section 1 pattern.**

# 4. `setupNtlmAuth()` — guarded fallback, NOT for D365

`tests/helpers/ntlm.ts` remains in the repo for potential **non-D365 IIS endpoints** with few
sub-resources. It is load-bearing infrastructure (see the guard in skill 23): never delete,
inline, or "clean up" the helper or its `page.route()` interception. If used:

* Call `setupNtlmAuth(page)` BEFORE the first `goto`.
* `ENV.crm.routePattern` must match the full CRM origin (`<origin>/**`) or interception never fires.
* Keep `rejectUnauthorized: false` (private internal CA) and the `DEBUG_NTLM` logging.

# 5. CONFIGURATION THIS DEPENDS ON

* **Credentials** come from `.env` via `ENV.crm.username` / `ENV.crm.password` (`requireEnv` — fails fast when missing).
  Username format is `DOMAIN\username`; `getNtlmCreds()` splits on the backslash.
* **`ENV.crm.origin`** is derived from `CRM_BASE_URL` in `config/resources.ts` — never hand-write it.
* **Passwords rotate.** Corporate/AD credentials expire on a cycle. A 401 or auth prompt from the
  CRM almost always means the password in `.env` is stale — **update `.env`; do not change code.**

# 6. DIAGNOSTIC PLAYBOOK — symptom → cause → fix

Read the actual error before touching code; the fix depends entirely on which symptom it is.

| Symptom | Root cause | Fix |
|---|---|---|
| 401 / IIS auth prompt / login loop | Credentials wrong — usually a **rotated/expired AD password** | Update `CRM_PASSWORD` in `.env`. No code change. |
| `ERR_INVALID_AUTH_CREDENTIALS` in the CRM tab | `httpCredentials` missing on the context, or `origin` doesn't match the CRM origin | Recreate the context per Section 1; verify `ENV.crm.origin` |
| Crash / `0xC0000409` / worker teardown mid-CRM-load | Someone reintroduced `httpntlm` route-interception for D365 | Remove it; use the Section 1 `httpCredentials` pattern |
| `ENOTFOUND` / `ECONNREFUSED` | CRM host unreachable — off corporate network / VPN | Environment issue (F4) — connect to the network. Stop and report; no code change. |
| Certificate errors | Private internal CA not trusted | Keep `ignoreHTTPSErrors: true` on the CRM context |
| Blank/hung page after goto | Waiting on `networkidle`, or asserting before readiness | Use `domcontentloaded` + `BaseCrmPage` readiness methods |
| *(fallback helper only)* no `[NTLM]` logs + auth failure | `ENV.crm.routePattern` never matched | Fix the pattern to `<origin>/**`; enable `DEBUG_NTLM=true` |
| *(fallback helper only)* `ETIMEDOUT` | Per-request NTLM timeout too low / slow network | Raise `NTLM_TIMEOUT_MS`; the helper already retries transient errors once |

# 7. IMPLEMENTATION CHECKLIST — every CRM test must satisfy

- [ ] CRM tab comes from a dedicated context with `httpCredentials` (username, password, origin) — Section 1.
- [ ] No forbidden mechanism (Section 3) is present.
- [ ] CRM credentials read from `.env` via `ENV.crm.*` — never hardcoded.
- [ ] CRM URLs from `ROUTES.crm.*` / `crmEntityListUrl()` — never inline org path/app id/view id.
- [ ] CRM context created with `viewport: null` + `maximizeWindow()` (skill 13).
- [ ] `goto` uses `waitUntil: 'domcontentloaded'`, then `BaseCrmPage` readiness methods.
- [ ] The test asserts a **known CRM element is visible** to prove it actually reached the CRM, not a blank/error page.
- [ ] The CRM context is closed at the end of the test.

# 8. REFERENCE IMPLEMENTATION

`tests/crm/cross-system/transfer-between-accounts-crm-log.spec.ts` (TC-CROSS-001) is the
canonical working CRM + portal test. Mirror its structure for any new CRM test. If in doubt, match it.

> **Bottom line:** CRM auth is already solved. Use context-level `httpCredentials`, keep
> `viewport: null` + `ignoreHTTPSErrors`, read creds from `.env`, and when it breaks use the
> table above — most recurrences are a rotated password or a refactor that touched the auth block.
