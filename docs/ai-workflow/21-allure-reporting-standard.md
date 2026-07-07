# 21 - Allure Reporting Standard

> Support skill. Not a pipeline stage.
>
> Consumed by: Automation Implementation Agent, Test Execution Agent, Final Report Agent.
>
> Purpose: the framework's automation uses allure-playwright. This skill defines the mandatory metadata and step conventions so reports are consistent, stakeholder-readable, and machine-consumable by the Final Report Agent.

---

# INSTALLATION STATE (verified 2026-07-07)

`allure-playwright` v3 IS installed and registered in `playwright.config.ts`
(`['allure-playwright', { resultsDir: 'allure-results' }]`). The v3 import is:

```typescript
import * as allure from 'allure-js-commons';
```

The metadata calls are async in v3 — always `await` them. `allure-results/` and
`allure-report/` are gitignored. Report generation: `npm run report:allure`
(requires the Allure CLI; bundle it for air-gapped environments).

The Cubic HTML report (skill 25) is generated on every run independently of
Allure — Allure is the machine-consumable layer for the Final Report Agent;
the Cubic report is the stakeholder layer. Both consume the same TC-id title contract below.

---

# MANDATORY TEST METADATA

Every generated test MUST declare, in this order, at the top of the test body:

```typescript
await allure.feature('<Business Feature>');      // e.g. 'Service Request', 'Between My Accounts Transfer'
await allure.story('<Sub-flow>');                // e.g. 'Service Request Grid'
await allure.severity('<severity>');             // blocker | critical | normal | minor | trivial
```

Severity mapping from QA Analyzer risk:

| Risk | Severity |
|------|----------|
| P1 / HIGH | critical |
| P2 / MEDIUM | normal |
| P3 / LOW | minor |
| Release-blocking flows (login, money movement) | blocker |

---

# STEP CONVENTIONS

Rule 1 — Every page-object action and assertion is wrapped in `allure.step` with a human-readable, business-facing sentence:

```typescript
await allure.step('Open first service request record from request code cell', async () => { ... });
```

Rule 2 — Step names describe INTENT, not mechanics. Good: "Assert Status Reason is Submitted". Bad: "click div".

Rule 3 — Steps live in page objects, not in spec files. Spec files read as a business scenario built from named steps.

Rule 4 — Traceability: the test title must carry the TC id: `TC-CRM-004 | <business description>`. This is how the Final Report Agent joins execution results back to the traceability matrix.

---

# EVIDENCE RULES

* Screenshots: on failure automatically (config-level `screenshot: 'only-on-failure'`).
* Traces: `trace: 'retain-on-failure'`.
* Videos: `video: 'retain-on-failure'`.
* For cross-system tests, attach a screenshot of the System B record after validation, even on pass:

```typescript
await allure.attachment('crm-log-record', await crmPage.screenshot(), 'image/png');
```

---

# REPORT GENERATION COMMANDS

```
npx playwright test                       # produces allure-results/
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

Air-gapped environments: `allure generate` requires no network. Bundle the Allure CLI in the offline deployment package.

---

# FINAL REPORT AGENT CONSUMPTION

The Final Report Agent parses allure-results JSON for:

* Test title → TC id → IU id (via traceability matrix)
* Status, duration, retries
* Failed step name → failure location for Failure Analysis
* Severity distribution → release-readiness summary

Therefore: metadata omissions are treated as automation defects. A generated test missing feature/story/severity fails the Automation Implementation Agent's own quality gate.

---

# ABSOLUTE RULES

* Never generate a test without feature, story, severity, and TC id in the title.
* Never write allure.step wrappers with vague names.
* Never disable failure screenshots/traces to "speed up" runs.
