# 23 - Clean Code Standard

> Support skill. Not a pipeline stage.
>
> Consumed by: Automation Implementation Agent, Self-Healing Agent, QA Review Agent.
>
> Purpose: define what clean, structured, readable code means in THIS framework, so every generated or healed file looks like it was written by one careful engineer — not stitched together by different agents.

---

# THE ONE-SENTENCE RULE

A new QA engineer must be able to open any spec file and read the business scenario top-to-bottom without opening a single page object.

Everything below serves that sentence.

---

# LOCATORS — ONE VERIFIED SELECTOR PER ELEMENT

This is the core rule of the framework:

1. **One locator per element, verified against the live DOM.** Before committing to a selector, run the portal/CRM, open the screen, and confirm the selector matches exactly the intended element (count == 1 for unique elements). Screenshots, ARIA snapshots, and count-probes are the verification tools.
2. **No `.or()` fallback chains.** Defensive chains hide the real locator, mask strict-mode collisions, and silently compensate for wrong "primary" selectors (this happened here: a wrongly-healed dialog role was invisible for months because a chain covered it). If a passing test breaks after removing a chain, the committed selector was wrong — re-verify on the live DOM and fix the selector; never restore the chain.
   - Exception: at most ONE `.or()` is allowed when an element genuinely cannot be verified yet (e.g. a flow with no active spec on a locked environment). It must carry a one-line comment saying why and when it will be resolved. Chains of three or more are banned everywhere.
3. **No raw selector strings in page objects or specs.** Every CSS/attribute selector lives in `docs/analysis/locator-repository.json` and is resolved through `utils/locatorRepository.ts`:
   ```typescript
   private get confirmButton(): Locator {
     return this.repository.locator('TRANSFER.BMA_CONFIRM_BUTTON');
   }
   ```
   Semantic user-facing locators (`getByRole`/`getByLabel`/`getByText` with a business-meaningful name) may stay in page objects as private getters — they are self-documenting. Registered elements must always resolve through the repository; never invent a competing locator for a registered element (skill 24 is authoritative for the resource layers).
4. **URLs, routes, env values, shared test data: ONLY from `config/resources.ts`** (skill 24). `process.env` reads are forbidden in specs and page objects.
5. Element ids in the repository are `SCREEN.ELEMENT_NAME` uppercase, self-describing. A reviewer must understand the element from the id alone.

Selector priority when discovering a new element (highest first):

1. `getByRole` / `getByLabel` — but VERIFY the accessible name on the live DOM first. This portal exposes i18n keys as aria-labels and explicit `role="menuitem"` on nav anchors, so role/name guesses routinely match zero elements.
2. `getByText` with anchored regex (`/^REQ-/`)
3. `[data-id="..."]` / test-id attributes (D365 standard)
4. Stable app-specific classes (`span.bma-account-number`) / `[aria-label]` / attribute selectors (`a[href="#/transfers"]`)
5. Generic CSS — last resort, never positional (`div:nth-child(3)` is forbidden)

Additional rules:

* Chain from a scoped root (`dialog.getByRole('button', { name: 'Proceed' })`), never from bare `page` when a scope exists — prevents strict-mode collisions.
* Repeated locators become private getters. Two usages = extract.
* Every verified locator updates the repository entry's `lastVerifiedDate` / verification counters; every replaced locator is recorded in `originalLocatorHistory` with the reason.

---

# PARSING — NAMED HELPERS, NEVER INLINE REGEX

* No cryptic inline regex or parsing in page objects or specs. Anything like `text.match(/\b0\d{9,}\b/)?.[0] ?? ''` must be a named, documented helper in `utils/textParsers.ts`:
  ```typescript
  /** Returns the first full account number (leading zero, 10+ digits) in the text, or null if none. */
  export function extractAccountNumber(text: string): string | null { ... }
  ```
  Call sites then read like plain English: `extractAccountNumber(fromAccountText) ?? fromAccountText`.
* Shared assertion patterns (masked account, currency code, balance-with-currency) are exported named constants in `utils/textParsers.ts`, each with a one-line comment and an example.
* `page.evaluate(...)` DOM-walking is a last resort. If the data can be read from a stable element, read it directly with a locator (`div.bma-account-info` holds the whole account card text — no ancestor traversal needed). When traversal is truly necessary, it lives in ONE named private helper with a doc comment explaining why direct reads are impossible.
* Pure text helpers go in `utils/` (shared); page-specific DOM-read helpers stay private in their page object — `utils/` never contains page-specific logic (GUIDELINES §3).

---

# FILE STRUCTURE

## Spec files (`tests/`)

A spec file contains ONLY:

1. Imports
2. Test data constants (top of file, UPPER_SNAKE_CASE, sourced from `config/resources.ts`)
3. One `test.afterEach` registering `captureFailureEvidenceOnFailure` (utils/failureHandler.ts) when the suite captures failure evidence
4. `test.describe` blocks
5. Allure metadata + business steps calling page-object methods

A spec file NEVER contains:

* Raw locators (`page.locator(...)`, `getByRole(...)`)
* Waits, timeouts on elements, retry logic
* `try/catch` — failure evidence is the afterEach hook's job
* Conditional logic (`if/else`) on UI state
* Loops over UI elements

If a spec needs any of these — that logic belongs in a page object.

## Page objects (`pages/`)

Fixed section order, marked with the framework's section dividers:

```typescript
export class ServiceRequestsPage extends BaseCrmPage {

  constructor(page: Page) { super(page); }

  // ─── Locators (private getters) ─────────────────────────
  // ─── Navigation ──────────────────────────────────────────
  // ─── Actions ─────────────────────────────────────────────
  // ─── Assertions ──────────────────────────────────────────
  // ─── Helpers (private) ───────────────────────────────────
}
```

Rules:

* One class per screen/area. If a class serves two screens, split it.
* Public methods = things a test would say in a business sentence. Private methods = mechanics.
* Helpers and raw locators are `private`. Nothing leaks `Locator` objects to spec files.
* CRM pages extend `pages/crm/BaseCrmPage.ts` and reuse its readiness/grid/area-switch methods — never re-implement them.

---

# NAMING

| Thing | Convention | Good | Bad |
|-------|-----------|------|-----|
| Class | PascalCase noun | `ServiceRequestsPage` | `SRPage`, `Handler` |
| Action method | verb + object | `openFirstRecord()` | `record()`, `doIt()`, `handle()` |
| Assertion method | `assert`/`expect` + expected state | `assertStatusReasonIsSubmitted()` | `checkStatus()`, `verify()` |
| Navigation method | `navigateTo` / `switchTo` + target | `switchToServiceRequests()` | `goThere()` |
| Getter for value | `get`/`read` + noun | `getSelectedFromAccountText()` | `fromAcc()` |
| Boolean | `is/has` + state | `isGridLoaded()` | `gridOk()` |
| Constant | UPPER_SNAKE_CASE | `TRANSFER_AMOUNT` | `amt`, `x` |
| Parsing helper | verb + what it returns | `extractCurrencyCode()` | `parse2()` |
| Repository element id | `SCREEN.ELEMENT_NAME` | `TRANSFER.BMA_CONFIRM_BUTTON` | `BTN1` |

Never abbreviate. `requestCode`, not `reqCd`. The autocomplete pays for the letters.

---

# METHOD RULES

* One method = one intention. `openFirstRecord()` opens a record. It does not also assert fields — that is a second method the spec calls next.
* Composite methods are allowed only as thin sequences of other public methods (like `assertFirstRecordFields()` calling three assertions) — no new logic inside.
* Max ~25 lines per method body. Longer means it is hiding a helper.
* No boolean parameters that change behavior (`open(true)`). Make two named methods.
* Parameters over hardcoding: `enterAmount(amount)`, never `enterSeventySeven()`. But defaults that reflect business rules are fine.
* Return values: actions return `Promise<void>`; getters return typed values; nothing returns `any`.

---

# WAITS AND TIMEOUTS

* Trust auto-waiting. Playwright waits for actionability on actions and retries `expect` assertions — most call sites need NO explicit wait and NO timeout option.
* Never `waitForTimeout()` (fixed sleep). Use `waitFor({ state })`, `expect(...).toPass()`, or the base-page readiness methods.
* The default assertion timeout lives ONCE in `playwright.config.ts` (`expect.timeout`). Do not sprinkle `{ timeout: 30_000 }` across assertions — a per-call override is allowed only for a genuinely slow, known operation and must carry a one-line justifying comment (e.g. transfer posting takes up to a minute on UAT; D365 grids up to 120s).
* Respect the D365 budget: grids up to 120s, records 30–60s — slow waits there are correct, not code smell.
* Prefer `waitFor({ state: 'attached' })` over visibility waits for elements that animate in from off-viewport (documented pattern: picker dialogs slide in from the top).
* Deliberately SHORT timeouts (500ms–10s) in dual-outcome/negative assertions are intentional — keep them, with the comment explaining the business rule.

---

# TRY/CATCH AND RECOVERY PATHS

* Never wrap assertions or actions in `try/catch` to swallow or re-log errors — `expect` already throws a clear error and the afterEach evidence hook does the reporting.
* `try/catch` / `.catch(...)` is allowed ONLY for a real, recoverable alternative path, and each one carries a comment naming what is being recovered from. Approved patterns in this framework:
  - the active-session dialog that may legitimately not appear (`waitFor().then/catch` probe),
  - one-shot reload when the portal serves a blank shell on first load,
  - best-effort loading-spinner waits where the spinner may never appear,
  - dual-outcome business assertions (Confirm disabled OR error message shown).
* Failure evidence in specs: one `test.afterEach` calling `captureFailureEvidenceOnFailure` — never per-test try/catch.

---

# COMMENTS

* Comments explain WHY (intent, business rule, verified DOM fact), never WHAT. `// Row 1 is the header; row 2 is the first data row` — good. `// click the button` — delete it.
* Business-rule comments are mandatory where the code encodes a rule: `// To-account must differ from From-account and share its currency, else the flow dead-ends by design`.
* Workaround-apology comments die with the workaround: once the selector is fixed properly, delete the paragraph explaining the old strict-mode collision. Verified DOM facts that justify a non-obvious choice (e.g. "nav anchors carry explicit role=menuitem, so getByRole('link') cannot match") belong in the locator repository's `discoverySource`, with at most a one-liner at the code site.
* No commented-out code. Delete it; git remembers.
* No TODO without an owner and reason: `// TODO(mrizk): replace with data-id once dev adds it — CR-042`.

---

# FORMATTING & TYPES

* TypeScript strict mode assumptions: no `any`, no `!` non-null assertions except env vars validated at startup, explicit return types on public methods.
* Numeric literals with separators: `60_000`, never `60000`.
* One statement per line. No clever one-liners that need re-reading.
* Import order: Playwright → framework config/resources → base/pages → fixtures → utils → third-party (allure) → node built-ins.
* Prettier/ESLint config of the repo is law. Never hand-format against it.

---

# SELF-HEALING CODE HYGIENE

When the Self-Healing Agent edits code it must ALSO obey this skill:

* A healed locator replaces the old one in the SAME repository entry (primary swap + `originalLocatorHistory` + `healingMetadata`) — it never adds a second competing locator inline and never re-introduces an `.or()` chain.
* Healing requires live verification (`count()==1 && visible`) before the swap; a heal that was never live-verified is a guess, and guesses get chains removed from under them (see PORTAL.LOGIN.ACTIVE_SESSION_DIALOG history: a wrong role heal hid behind a fallback chain for months).
* Healing never introduces `waitForTimeout`, `try/catch` swallowing, or weakened assertions to force green.
* Healed files must still pass the review checklist below.

---

# REVIEW CHECKLIST (gate for every generated/edited file)

1. Spec reads as a business scenario — zero raw locators, zero waits, zero try/catch.
2. Every element has exactly ONE locator; any single `.or()` has a justifying comment; no 3+ chains anywhere.
3. CSS/attribute selectors come from `docs/analysis/locator-repository.json`; URLs/test data from `config/resources.ts`.
4. Every regex/parsing expression is a named, documented helper (`utils/textParsers.ts`); `page.evaluate` only where a direct locator read is impossible, as one named helper.
5. No timeout overrides without a justifying comment; defaults come from `playwright.config.ts`.
6. Page object sections in the standard order with dividers; every public method named per the naming table and allure-stepped (skill 21).
7. No magic numbers, no abbreviations, no dead code, no commented-out code, no workaround-apology comments.
8. `npx tsc --noEmit` passes.
9. A colleague could tell what the file does from names alone.

Fail any item → fix before handing off. Code that works but fails this checklist is NOT done.
