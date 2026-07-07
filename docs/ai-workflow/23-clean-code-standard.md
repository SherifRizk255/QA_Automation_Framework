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

# FILE STRUCTURE

## Spec files (`tests/`)

A spec file contains ONLY:

1. Imports
2. Test data constants (top of file, UPPER_SNAKE_CASE)
3. `test.describe` blocks
4. Allure metadata + business steps calling page-object methods

A spec file NEVER contains:

* Raw locators (`page.locator(...)`, `getByRole(...)`)
* Waits, timeouts on elements, retry logic
* `try/catch`
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
* Every public action/assertion wrapped in `allure.step` with a business-facing sentence (skill 21).
* Helpers and raw locators are `private`. Nothing leaks `Locator` objects to spec files.

---

# NAMING

| Thing | Convention | Good | Bad |
|-------|-----------|------|-----|
| Class | PascalCase noun | `ServiceRequestsPage` | `SRPage`, `Handler` |
| Action method | verb + object | `openFirstRecord()` | `record()`, `doIt()`, `handle()` |
| Assertion method | `assert` + expected state | `assertStatusReasonIsSubmitted()` | `checkStatus()`, `verify()` |
| Navigation method | `navigateTo` / `switchTo` + target | `switchToServiceRequests()` | `goThere()` |
| Getter for value | `get` + noun | `getSelectedFromAccount()` | `fromAcc()` |
| Boolean | `is/has` + state | `isGridLoaded()` | `gridOk()` |
| Constant | UPPER_SNAKE_CASE | `TRANSFER_AMOUNT` | `amt`, `x` |
| Test data variable | camelCase, full words | `fromAccount` | `frm`, `a1` |

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

# LOCATOR RULES

Priority order (highest first):

1. `getByRole` / `getByLabel` (user-facing, self-documenting)
2. `getByText` with anchored regex (`/^REQ-/`)
3. `[data-id="..."]` / test-id attributes (D365 standard)
4. `[aria-label="..."]`
5. CSS — last resort, never positional (`div:nth-child(3)` is forbidden)

Additional rules:

* Chain from a scoped root (`this.recordForm().getByLabel(...)`), never from bare `page` when a scope exists — prevents strict-mode collisions.
* Every locator that exists in `docs/analysis/locator-repository.json` must be used from there conceptually — same primary, same fallbacks. Never invent a competing locator for a registered element.
* Repeated locators become private getters. Two usages = extract.

---

# WAITS AND TIMEOUTS

* Never `waitForTimeout()` (fixed sleep). Use `waitFor({ state })`, `expect(...).toPass()`, or the base-page readiness methods.
* Timeouts as named framework constants or explicit `timeout:` options with a numeric-separator literal (`60_000`), never magic `60000` scattered around.
* Respect the D365 budget: grids up to 120s, records 30–60s — slow waits there are correct, not code smell.

---

# COMMENTS

* Comments explain WHY, never WHAT. `// Row 1 is the header; row 2 is the first data row` — good. `// click the button` — delete it.
* Business-rule comments are mandatory where the code encodes a rule: `// To-account must differ from From-account and share its currency, else D365 clears the selection`.
* No commented-out code. Delete it; git remembers.
* No TODO without an owner and reason: `// TODO(mrizk): replace with data-id once dev adds it — CR-042`.

---

# FORMATTING & TYPES

* TypeScript strict mode assumptions: no `any`, no `!` non-null assertions except env vars validated at startup, explicit return types on public methods.
* One statement per line. No clever one-liners that need re-reading.
* Import order: Playwright → framework base/pages → fixtures → third-party (allure) → node built-ins.
* Prettier/ESLint config of the repo is law. Never hand-format against it.

---

# SELF-HEALING CODE HYGIENE

When the Self-Healing Agent edits code it must ALSO obey this skill:

* A healed locator replaces the old one in the same private getter — it does not add a second competing locator inline.
* Healing never introduces `waitForTimeout`, `try/catch` swallowing, or weakened assertions to force green.
* Healed files must still pass the review checklist below.

---

# REVIEW CHECKLIST (gate for every generated/edited file)

1. Spec reads as a business scenario — zero raw locators, zero waits.
2. Page object sections in the standard order with dividers.
3. Every public method named per the naming table and allure-stepped.
4. No magic numbers, no abbreviations, no dead code, no commented-out code.
5. Locators follow the priority order and are scoped.
6. `npx tsc --noEmit` passes.
7. A colleague could tell what the file does from names alone.

Fail any item → fix before handing off. Code that works but fails this checklist is NOT done.
