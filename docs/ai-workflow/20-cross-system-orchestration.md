# 20 - Cross-System Orchestration

> Support skill. Not a pipeline stage.
>
> Consumed by: Automation Implementation Agent, Test Execution Agent, Failure Analysis Agent.
>
> Purpose: define the ONE correct pattern for tests that span two or more systems in a single scenario (e.g., perform a transfer in the Internet Banking Portal, then validate the resulting log record in Dynamics 365 CRM).

---

# WHEN THIS SKILL APPLIES

* A business action in System A must be verified in System B.
* Examples:
  * Portal transfer → CRM Between My Accounts Transfer Log
  * Portal service request → CRM Service Request entity
  * Portal profile change → CRM contact record update

---

# CORE PATTERN — TABS, NOT CONTEXTS (when auth allows)

If both systems can share one browser context (same auth strategy or CRM already authenticated via storage state):

```typescript
const crmPage = await page.context().newPage(); // new TAB, session shared
await crmPage.goto(CRM_ENTITY_LIST_URL);
```

If auth strategies differ (e.g., Portal form login vs CRM NTLM), create a second context:

```typescript
const crmContext = await browser.newContext({
  httpCredentials: { username: process.env.CRM_USERNAME!, password: process.env.CRM_PASSWORD! },
  ignoreHTTPSErrors: true,
});
const crmPage = await crmContext.newPage();
```

Decision rule: consult skill 19 (Authentication & Session Manager). Never mix auth strategies inside one context.

---

# DATA CORRELATION RULES

The single most common cross-system failure is validating the WRONG record. Prevent it:

Rule 1 — Capture correlation keys at the source. Before leaving System A, capture every value needed to identify the record in System B: amount, reference number, account numbers, timestamp.

Rule 2 — Prefer unique keys over positional selection. If System A gives a reference/transaction number, search for it in System B. Selecting "the latest row" (`[aria-label="Select row 2"]`) is acceptable ONLY when:

* The environment is dedicated to this run (no parallel users), AND
* The test asserts at least two captured values (e.g., amount AND transfer type) on the selected record to confirm it is the right one.

Rule 3 — Account for propagation delay. System B may take seconds to reflect System A's action. Use polling with a hard ceiling:

```typescript
await expect(async () => {
  await crmPage.reload();
  await expect(latestRowAmountCell).toHaveText(expectedAmount);
}).toPass({ timeout: 60_000, intervals: [5_000] });
```

Never use fixed `waitForTimeout` for propagation.

---

# STRUCTURE RULES

* One spec file per cross-system scenario, named `<action>-<sourceSystem>-<targetSystem>.spec.ts` (e.g., `transfer-between-accounts-crm-log.spec.ts`).
* The spec composes existing page objects from BOTH systems. It never re-implements login, navigation, or grid handling that already exists.
* Correlation values are held in local constants/variables inside the test — never in globals or files.
* Timeout budget: cross-system tests get an elevated `test.setTimeout` (recommended 240_000) because they include two systems plus propagation waits.

---

# FAILURE CLASSIFICATION FOR CROSS-SYSTEM TESTS

| Symptom | Classification |
|---------|---------------|
| Action succeeded in A, record never appears in B within ceiling | INTEGRATION defect candidate (not automation) |
| Record appears in B with wrong values | APPLICATION defect candidate |
| Record appears but selectors fail to read fields | AUTOMATION (self-healable) |
| Tab/context creation fails | AUTOMATION (framework) |
| B login/auth fails | ENVIRONMENT — route to skill 19 protocol |

Failure Analysis Agent must record WHICH SYSTEM the failure occurred in as a mandatory field.

---

# ABSOLUTE RULES

* Never assert in System B without capturing correlation keys in System A first.
* Never use fixed sleeps for cross-system propagation.
* Never close the System A tab before all System B validations complete (evidence may be needed).
* Never allow Self-Healing to "fix" an integration failure by weakening assertions.
