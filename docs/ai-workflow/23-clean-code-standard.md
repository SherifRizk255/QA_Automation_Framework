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

If a spec needs any of these, expose the behavior through its feature page-object facade. The page may delegate reusable widget mechanics to a cataloged component, but the specification must not consume that component directly.

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
* Helpers are `private`, and Locator objects never leak to spec files. Committed locator definitions belong in `docs/analysis/locator-repository.json`; page objects resolve them by key.

## Reusable UI components (`pages/components/`)

The supported dependency direction is:

```text
Tests
  ↓
Feature Page Objects
  ↓
Reusable UI Components
  ↓
Playwright Locators / Locator Repository
```

Rules:

* Tests consume feature page-object facades and never import, instantiate, or directly consume reusable UI components.
* Feature page objects own feature navigation, business rules, workflow orchestration, feature assertions, evidence capture, and page-state transitions.
* Reusable components own scoped root/child behavior, reusable widget interactions, normalized component values, and component-level assertions. Their committed locator definitions are resolved from the Locator Repository.
* Collection components own opening, count, ordering, indexed item access, and generic collection validation. Item components own item fields, text, actions, and item-level validation. The feature page decides which item satisfies a business rule.
* Optional `find*()` readers return `undefined` when candidate data may be absent. Required `get*()` readers fail when required data is missing, hidden, or empty. Do not use `try/catch` as candidate-selection control flow.
* Components search beneath their supplied root whenever that scope exists.
* Feature facade methods may remain when they provide business naming, stable API compatibility, feature sequencing, or evidence capture, even when they delegate to a component.
* Live component instances belong to the active Playwright `Page`; never retain them in global singletons.
* Shared reuse requires proven equivalent DOM structure and behavior. Visual similarity alone is insufficient.

Detailed eligibility, lifecycle, evidence, runtime, and catalog rules are defined in `pages/components/catalog/README.md`.

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
* Approximately 25 lines is a review signal, not a hard limit. A readable ordered business workflow may legitimately exceed it. Extract only when the resulting method boundaries improve intention, ownership, reuse, or maintainability.
* No boolean parameters that change behavior (`open(true)`). Make two named methods.
* Parameters over hardcoding: `enterAmount(amount)`, never `enterSeventySeven()`. But defaults that reflect business rules are fine.
* Return values: actions return `Promise<void>`; getters return typed values; nothing returns `any`.

---

# PLAYWRIGHT-FIRST READABLE IMPLEMENTATION

Playwright is the primary implementation mechanism for browser behavior. TypeScript supplies strict contracts and readable orchestration; it must not replace built-in Playwright behavior with unnecessary control logic.

## Playwright-native behavior

* Prefer Playwright locators, web-first assertions, actionability checks, and auto-waiting before custom TypeScript waiting or retry logic.
* Use required-state assertions such as `toBeVisible()`, `toBeEnabled()`, `toHaveText()`, `toHaveValue()`, and `toHaveURL()` when the state is part of the expected behavior.
* Playwright actions already wait for applicable actionability conditions. Do not add `toBeVisible()` or `toBeEnabled()` mechanically before every click. Retain the assertion when visibility or enabled state is a business requirement or materially improves failure diagnostics.
* Use `isVisible()`, `isEnabled()`, or an optional `find*()` API only when the application state is genuinely optional or candidate-based.
* Required application behavior must fail through a web-first assertion or normal Playwright error propagation.
* Do not create click, fill, assertion, waiting, or retry wrappers that merely rename a direct Playwright operation without adding reusable meaning.

## Readable control flow

* Prefer separate `if` statements when they represent different rejection, recovery, or business reasons.
* Keep optional branches explicit and close to the affected Playwright action.
* Do not combine independent business decisions solely to reduce line count.
* Optimize for clear intent, diagnostics, reviewability, and safe extension, not for the fewest lines.
* Preserve the order in which the user and application perform actions.

Example:

```typescript
if (!destinationAccountNumber) {
  continue;
}

if (destinationAccountNumber === fromAccountNumber) {
  continue;
}

if (!destinationCurrency) {
  continue;
}

if (destinationCurrency !== fromCurrency) {
  continue;
}
```

## Exception handling

Do not use `try/catch` as normal UI control flow.

It must not determine:

* Whether an element exists.
* Whether an optional field is present.
* Whether a candidate row is valid.
* Whether a popup appeared.
* Whether a locator succeeded.
* Whether a button is visible or enabled.

Use optional readers, locator-state queries, and readable conditions instead:

```typescript
const accountNumber = await row.findAccountNumber();

if (!accountNumber) {
  continue;
}
```

`try/catch` is acceptable only when it adds meaningful diagnostic context while preserving the original cause, performs required cleanup before rethrowing, handles a genuine external-system boundary, or translates a low-level failure into a documented framework-specific error.

Never silently swallow an error. Never replace a useful Playwright error with a vague message.

## Polling

* Do not use `expect.poll()`, `toPass()`, or a custom polling loop when a Playwright locator assertion can directly observe the required DOM state.
* Polling is acceptable for state outside direct Playwright DOM observation, including API, database, file-system, message-queue, or cross-system propagation state.
* A justified polling implementation must document the external state being observed and use a bounded timeout.
* Cross-system propagation polling follows skill 20.
* Never replace polling with a fixed `waitForTimeout()`.

Prefer:

```typescript
await expect(this.statusLabel).toHaveText('Completed');
```

over polling `innerText()` for the same locator-observable state.

## Locator alternatives

* Do not use `locator.or()` as the default fallback-selector strategy.
* Prefer one stable locator for one semantic element.
* For genuinely different documented product outcomes, use separate named locators and the simplest readable synchronization strategy that preserves Playwright strictness and diagnostics.
* `locator.or()` is acceptable when waiting for one of multiple documented valid outcomes is necessary and simultaneous matches have been considered.
* Do not add `.first()` merely to hide strict-mode ambiguity.
* Do not replace one unclear `.or()` chain with repeated unbounded `isVisible()` probing.
* Locator Repository fallback metadata is not a runtime `locator.or()` chain. Repository alternatives are validated independently and activated through the governed recovery process.
* Self-healing replaces an obsolete locator in its owner instead of appending permanent `.or()` chains.

## Ternary operators

A ternary is allowed only for a small, immediately readable value selection:

```typescript
const expectedStatus =
  isApproved
    ? 'Approved'
    : 'Rejected';
```

Do not use ternaries for Playwright actions, awaited expressions, multi-step decisions, business workflow branching, or nested conditions. Use an explicit `if` statement when either branch performs work or requires explanation.

## Regular expressions

* Use regex only when a required value is embedded in mixed text and no stable dedicated DOM field exists.
* Prefer a dedicated child locator and direct text or value reading when the DOM exposes the value separately.
* A regex must be small, narrowly scoped, readable, and responsible for one clear value or format.
* Avoid deeply nested groups, complex lookarounds, multi-value parsing, and dynamic escaping when direct string or DOM operations preserve behavior.
* A small token regex remains acceptable when one structured text element contains multiple values, such as currency and balance.
* Regex failure must produce clear diagnostics.
* Do not replace a structured locator with regex parsing merely to reduce locator declarations.

## Loops and array methods

Use array methods when the complete intention remains simple and immediately readable:

```typescript
const sourceAccountIsListed =
  toOptions.some((option) =>
    option.includes(sourceAccountNumber)
  );
```

Use a `for` or `while` loop when logic contains asynchronous UI operations, multiple decisions, candidate skipping, early return, ordering-dependent selection, diagnostic collection, or business-rule branching.

Do not replace a readable business loop with a complex combination of `map`, `filter`, `reduce`, `find`, or `Promise.all`. A `while` loop must have a clear, bounded termination condition. `Promise.all` remains appropriate when required to avoid missing a Playwright event or when independent operations are intentionally concurrent.

Do not create custom retry loops for behavior already handled by Playwright.

## TypeScript usage

Use ordinary, explicit TypeScript.

TypeScript should provide strict typing, explicit method contracts, safe return values, refactoring safety, and readable orchestration.

Avoid unnecessary complex generics, conditional types, overloaded methods with unrelated meanings, dynamic property access, reflection-style code, broad type assertions, non-null assertions that hide uncertainty, generic utilities that obscure Playwright intent, and abstractions created only to remove a few readable lines.

Extract a helper when it represents a meaningful intention, improves naming around non-trivial mechanics, removes meaningful mechanical duplication, has more than one real caller, or clarifies ownership.

A helper with one caller is valid when it names and isolates genuinely complex mechanics. Do not extract a single-use helper solely to reduce method length.

## Functional preservation

A readability refactor must preserve:

* Feature behavior.
* Locator scope and strictness.
* Action order.
* Loading and synchronization order.
* Assertions and coverage.
* Error diagnostics.
* Return values.
* Public page-object facade.
* Optional versus required reader semantics.
* Evidence and reporting behavior.

Simplification must not weaken assertions, make required behavior optional, hide an application defect, or change the selected business item.

---

# LOCATOR RULES

Priority order (highest first):

1. `getByRole` / `getByLabel` (user-facing, self-documenting)
2. `getByText` with anchored regex (`/^REQ-/`)
3. `[data-id="..."]` / test-id attributes (D365 standard)
4. `[aria-label="..."]`
5. CSS — last resort, never positional (`div:nth-child(3)` is forbidden)

Additional rules:

* Chain from the narrowest available root (`this.recordForm().getByLabel(...)` or a component's `root`), never from bare `page` when a scope exists — prevents strict-mode collisions.
* Every stable locator used by committed automation must exist in `docs/analysis/locator-repository.json` and be resolved through `LocatorRepository` (CRM pages get it via `BaseCrmPage.repository`). Raw locator definitions are discovery-only and must not remain in tests, fixtures, pages, or components. Skill 24 is authoritative for the resource layers.
* URLs, routes, env values, shared test data: ONLY from `config/resources.ts` (skill 24). `process.env` reads are forbidden in specs and page objects.
* Locator definitions live in the Locator Repository. Shared widget mechanics belong to reusable components; feature-specific and selected-display behavior belongs to feature page objects; each consumer resolves named keys within its narrowest correct scope.
* Repeated locators remain private to their owner. Promote behavior to a shared component only when reusable DOM and interaction evidence exists.

---

# WAITS AND TIMEOUTS

* Never use `waitForTimeout()` as synchronization. Prefer a direct Playwright action or web-first locator assertion. Use `expect.poll()` or `toPass()` only when the required state cannot be directly observed through a locator and the polling reason is documented. Cross-system propagation polling follows skill 20.
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

* A healed locator replaces the old repository definition while its component or page-object consumer retains the same key — it does not add a competing raw locator at another layer.
* Healing never introduces `waitForTimeout`, `try/catch` swallowing, or weakened assertions to force green.
* Healed files must still pass the review checklist below.

---

# REVIEW CHECKLIST (gate for every generated/edited file)

1. Spec reads as a business scenario — zero raw locators, zero waits.
2. Page object sections in the standard order with dividers.
3. Every public method named per the naming table and allure-stepped.
4. No magic numbers, no abbreviations, no dead code, no commented-out code.
5. Locators follow the priority order, are registered, resolve by repository key, and use the narrowest correct scope.
6. `npx tsc --noEmit` passes.
7. A colleague could tell what the file does from names alone.
8. Playwright-native actions, actionability, and web-first assertions are used before custom waiting or polling.
9. No `try/catch` is used for normal UI-state or candidate-selection control flow.
10. Every `.or()` has a documented valid-outcome reason and strictness review; no `.or()` is used as a permanent stale-selector chain.
11. No nested or action-performing ternary is present.
12. Regex is used only where structured DOM access is unavailable or mixed text genuinely requires parsing.
13. Asynchronous multi-decision workflows use readable, bounded loops and explicit conditions.
14. TypeScript abstractions improve safety, naming, or reuse without hiding Playwright intent.
15. Behavior, ordering, assertions, diagnostics, return values, and public APIs remain preserved.

Fail any item → fix before handing off. Code that works but fails this checklist is NOT done.
