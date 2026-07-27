# 13 - Automation Implementation Agent

## Purpose
Convert approved test cases into maintainable Playwright TypeScript automation that follows framework standards, preserves traceability, supports self-healing locator recovery, and remains aligned with business intent.

This skill generates automation only.

It does not create requirements, scenarios, test cases, or business rules.

---

## When to use this skill
Use this skill only after TC generation is complete.

---

## Inputs

### Mandatory
- Approved Test Cases
- Traceability Matrix
- QA Analysis Report
- IU Catalog
- Locator Inventory
- Locator Repository
- System Map
- Navigation Map
- Page Object Recommendations
- Test Lifecycle Definition
   `docs/test-design/test-lifecycle.md`

### Optional
- Existing Playwright Framework
- Existing Page Objects
- Existing Fixtures
- Existing Utilities
- Existing Test Data
- Existing Automation Coverage Report

---

## Consumes

 * From QA Analyzer
   - Risk
   - Automation Feasibility
   - Dependencies
   - Coverage Intents
   - Regression Scope
 * From Traceability Manager
   - IU
   - Scenario Inventory
   - TC Allocation
   - Coverage Plan
   - Regression Classification
 * From TC Generator
   - TC IDs
   - Steps
   - Expected Results
   - Test Data
   - Tags
 * From System Walkthrough
   - Locator Inventory
   - Locator Repository
   - Locator Confidence
   - Locator Volatility
   - Locator Uniqueness
   - Discovery Source
   - Locator Score
   - Known Risks
   - Navigation Paths
   - Page Object Recommendations
  * From Test Lifecycle
   - Lifecycle Stage
   - Retry Eligibility
   - Self-Healing Scope
   - Setup Requirements
   - Teardown Requirements
   - Environment Dependencies
   - Test Data Dependencies
   - OTP Handling Rules
   - Posting Restrictions
   - Evidence Requirements

---

## Responsibility

 Generate:
 - pages/
 - tests/
 - fixtures/
 - utils/
 - data/
 - setup helpers
 - teardown helpers

while preserving:
 Requirement → IU → Scenario → TC → Automation traceability.

Every automated test must be traceable back to its originating TC.

---

## Required outputs

### Automation Files
 - Page Objects under `pages/`
 - Tests under `tests/`
 - Fixtures under `fixtures/`
 - Utilities under `utils/`
 - Data under `data/`
 - Coverage Report under `docs/test-design/automation-coverage.md`
 - Traceability mapping under `docs/test-design/automation-traceability.md`
 - Locator registery under `docs/test-design/locator-registry.md`

---

## Step-by-Step Behavior

1. Read approved test cases.
2. Read QA Analysis Report.
3. Read Traceability Matrix.
4. Read System Map and Navigation Map.
5. Read Locator Inventory, Locator Confidence, Locator Volatility, Locator Uniqueness, and Locator Metadata.
6. Read existing Playwright framework structure.
7. Read existing Page Objects, Fixtures, Utilities, Shared Components, `pages/components/catalog/component-catalog.ts`, and `pages/components/catalog/README.md`.
8. Determine automation scope and impacted business flows.

    8.1 Read Test Lifecycle definitions.

    8.2 Determine lifecycle stage for every automated test:

     - Setup
     - Execution
     - Verification
     - Cleanup

   8.3 Determine retry eligibility.

   8.4 Determine self-healing eligibility.

   8.5 Determine environment requirements.

   8.6 Determine required setup and teardown actions.

   8.7 Determine evidence collection obligations.

9. Reuse existing Page Objects and cataloged Components where proven equivalent.
10. Classify new behavior as feature-page responsibility or reusable widget mechanics.
11. Create a new Page Object or Component only when no existing owner satisfies the requirement.
12. Select Primary Locators and Fallback Locator Chains from Locator Inventory.
13. Apply contextual locator strategy for non-unique elements.
14. Register every committed locator definition in the Locator Repository. Page Objects and Components retain narrow behavioral ownership and resolve the registered key within their owned scope.
15. Create or update Fixtures, Utilities, Test Data, and Supporting Helpers.
16. Implement Playwright TypeScript tests using feature Page Object methods only.
17. Add business assertions based on approved expected results.
18. Implement waits using business-state validation rules.
19. Capture evidence only when required by the TC, audit requirements, or business process.
20. Validate locator quality and locator chain completeness.
21. Validate traceability mapping:
    REQ → IU → Scenario → TC → Automation.
22. Update automation coverage report.
23. Update automation traceability report.
24. Validate all quality gates before completion.
25. Generate implementation summary and automation handoff artifacts.

---

## Test Lifecycle Automation Rules

Automation must align with test-lifecycle.md.

For every automated test:

Determine:

- Lifecycle Stage
- Retry Eligibility
- Self-Healing Scope
- Setup Requirements
- Teardown Requirements

Generate automation that respects lifecycle boundaries.

### Setup Rules

Required setup actions must be implemented using:

- Fixtures
- Factories
- Test Data Builders
- API Preparation Steps

Never depend on execution order.

Tests must be independently executable.

### Teardown Rules

Required cleanup actions must be implemented using:

- Fixture cleanup
- API cleanup
- Data reset utilities

Cleanup must execute even if test execution fails.

Avoid environment contamination.

### Retry Rules

Read Retry Eligibility from Test Lifecycle.

Allowed:

- Locator instability
- Known environment instability
- Transient infrastructure failures

Not Allowed:

- Business validation failures
- Assertion failures
- Missing requirements
- Product defects

### Lifecycle Self-Healing Scope

Self-healing is permitted only for:

- Locator failures
- Navigation failures
- Dynamic rendering issues

Self-healing is NOT permitted for:

- Business rule failures
- Incorrect calculations
- Authorization failures
- Validation failures
- Functional defects

---

## Automation Architecture Rules

 - Page Object Model Required.
 - Tests consume feature Page Object facades and never reusable UI Components directly.
 - Reusable widget mechanics may reside in cataloged Components behind the feature facade.
 - Tests must not contain:
    page.locator(...)
    page.getByRole(...)
    page.click(...)
    page.fill(...)
   directly.
 - Tests should call:
    loginPage.login()
    transferPage.submitTransfer()
   instead.

---

## Feature Implementation Guardrails

Complete `docs/ai-workflow/templates/feature-implementation-checklist.md` and obtain architecture approval before production implementation.

### Required Architecture

```text
Tests
  → call public feature-page methods only

Feature Page
  → navigation
  → workflow orchestration
  → feature-level Allure steps
  → coordination between components and pure logic

Components
  → own one scoped UI region
  → own UI actions and UI reading
  → return typed actual UI values

Pure Calculators / Utilities
  → own deterministic browser-independent calculations

Locator Repository
  → owns locator definitions, keys, metadata, and ownership
```

| Responsibility | Owner |
|---|---|
| UI locating, reading, or clicking | Component |
| Navigation or multi-component workflow | Feature Page |
| Deterministic business calculation | Pure Calculator / Utility |
| TC ID, title, tags, and test orchestration | Test |
| Locator identity and metadata | Locator Repository |

### Locator Rules

Use private lazy getters:

```typescript
private get amountInput(): Locator {
  return this.repository.locator(
    'PORTAL.FEATURE.AMOUNT.INPUT'
  );
}
```

For scoped locators:

```typescript
private get balance(): Locator {
  return this.repository.locator(
    'PORTAL.FEATURE.ACCOUNT.BALANCE',
    {
      scope: this.activeAccount,
    }
  );
}
```

Require:

- Every locator key exists in `locator-repository.json`.
- Runtime consumers use `repository.locator(...)`.
- Locator getters are private and lazy.
- Constructors store dependencies only.
- Locator ownership metadata matches the Page Object or Component that owns the UI.

Prohibit in committed Page Objects and Components:

- `repository.resolve(...)`.
- Raw `page.locator(...)`.
- Raw `page.getByRole(...)`.
- Raw `page.getByText(...)`.
- Raw `page.getByLabel(...)`.
- Locator initialization in constructors.
- Eager `Locator` fields.
- Returning `Locator` from Component public methods.

### Layer Boundaries

- Tests do not import or call Components directly.
- Components do not import API observers or models for expected-value matching.
- Components do not import calculators.
- Components do not import Allure.
- Expected API values never influence UI selection.
- Page Objects do not contain large deterministic calculations.
- Pure calculations have focused framework tests.
- A UI region with multiple related locators is designed as a Component before regression expansion.

### Mandatory Future-Feature Order

1. Review feature test cases.
2. Identify one representative smoke flow.
3. Produce the feature architecture map.
4. Wait for architecture approval.
5. Register or reuse locator keys and ownership.
6. Implement UI Components.
7. Implement pure calculations only when needed.
8. Implement the thin feature-page facade.
9. Implement and run the representative smoke flow.
10. Review architecture and ownership.
11. Expand regression coverage.

Do not automate the complete regression workbook in one pass.

Do not build a large Feature Page first and extract Components later.

Do not add a new abstraction without checking for an existing owner.

---

## Component-Aware Implementation Workflow

1. Search `pages/components/catalog/component-catalog.ts`.
2. Classify the responsibility as feature behavior or reusable widget mechanics.
3. Reuse or extend a Component only when current DOM and behavior evidence proves equivalence.
4. Keep business rules and item-selection decisions in the feature Page Object.
5. Preserve the feature Page Object's public facade.
6. Register a new Component before using it.
7. Validate the Component, consuming Page Object, fixtures, and affected test discovery.

Implementation boundaries follow skill 23. Locator ownership follows skill 24. Detailed component eligibility, lifecycle, and evidence rules are defined in `pages/components/catalog/README.md`.

---

## Playwright-First Implementation Check

Before adding custom TypeScript control logic:

1. Check whether a direct Playwright locator, action, or web-first assertion already provides the required behavior.
2. Use Playwright auto-waiting, actionability, and web-first assertions before custom waiting or retry logic.
3. Model optional states through explicit optional APIs and readable conditions.
4. Use readable bounded loops for asynchronous, ordering-dependent, multi-decision workflows.
5. Poll only state that cannot be directly observed through a Playwright locator.
6. Keep Locator Repository fallback metadata separate from runtime `locator.or()` behavior.
7. Justify exceptional `try/catch`, polling, `.or()`, or complex regex usage.
8. Preserve functionality, sequencing, diagnostics, return values, and public APIs.

Detailed implementation rules follow skill 23. Cross-system propagation polling follows skill 20.

---

## Locator Strategy

Use Locator Repository first.

If a valid repository locator exists:

- Reuse it.
- Validate uniqueness and actionability.

If no repository locator exists:

- Use Locator Inventory.

If neither provides a valid locator:

- Generate locator candidates.
- Validate candidates.
- Update Locator Repository.

---

## Locator Repository Lookup Rules

Before generating or selecting a locator:

1. Search locator-repository.json.
2. Match using:
   - Screen Name
   - Element Name
   - Business Context
   - Workflow Context (if available)
3. Validate repository locator.
4. Reuse repository locator if validation succeeds.
5. Use Locator Inventory only when:
   - Repository entry does not exist
   - Repository locator fails validation
6. Rediscover locators only when repository and inventory locators are invalid.

If no equivalent repository entry exists, add and validate the missing entry before committing the consuming Page Object or Component. Never insert a competing raw locator into a test, fixture, page, or component.

Repository validation must verify:

- count() == 1
- Visible
- Attached to DOM
- Actionable

Repository reuse is preferred over locator rediscovery.

---

## Locator Priority
1. Stable ID
2. Accessibility Locator
3. Stable CSS Selector
4. Alternative XPath
5. Visible Text
6. Test Attributes
7. Placeholder
8. Name Attribute
9. Partial Text
10. Contextual Locator

---

## Forbidden Locators

Never generate:

 1. absolute xpath
 2. /html/body/div[3]
 3. nth-child
 4. nth-of-type
 5. dynamic ids
 6. mat-input-42
 7. react-123
 8. css-1abcde
 9. ng-star-inserted

### Framework Generated Attributes

Never generate primary locators from:
 1. pc13
 2. pc14
 3. data-p
 4. data-pc-name
 5. data-pc-section
 6. ng-reflect-*
 7. ng-star-inserted
 8. react-*
 9. css-*

These attributes may be used only as discovery evidence and must be treated as HIGH volatility.

---

## Contextual Locator Strategy

When Locator Inventory indicates:
 Uniqueness = CONTEXTUAL
The generated Page Object must include parent business context.

Examples:

 1. Bad:
    ``` 
    getByRole('button', { name: 'Edit' })
    ```
 2. Good:
    ```
    CustomerRow('Ahmed')
    → EditButton

    TransactionCard('TX-123')
    → ApproveButton

    AccountTable
    → Row(AccountNumber)
    → ViewDetails
    ```
Never resolve duplicate elements using positional selectors.
Always prefer business context.

---

## Locator Confidence Rules

Use confidence from Locator Inventory.

 - HIGH: Safe for production automation.
 - MEDIUM: Allowed with fallback locator.
 - LOW: Do not use without explicit warning.

Output:
```
⚠ Locator Risk 

Element: 
 Transfer Button
 
Locator: 
  button:nth-child(5) 

Confidence: 
  LOW
```
---

## Locator Fallback Chain Generation

Locator Repository fallback chains are metadata for validation and governed recovery. They must not be converted automatically into permanent Playwright `locator.or()` chains. Runtime alternatives require documented valid product outcomes and strictness analysis.

Every interactive element must contain:

* Primary Locator
* Fallback Locator 1
* Fallback Locator 2
* Fallback Locator 3

Fallback locators must be selected from Locator Inventory metadata.

Fallback candidates must be:

* Validated
* Unique or Contextual
* Actionable
* Compatible with the current DOM

Locator chains must be synchronized with locator-repository.json.

When a new fallback chain is generated, repository entries must be updated.

---

### Fallback Selection Priority

Fallback locators should be selected using the highest-confidence validated alternatives available.

Preferred order:
 1. ID
 2. ACCESSIBILITY
 3. CSS
 4. ALT_XPATH
 5. TEXT
 6. TESTID
 7. PLACEHOLDER
 8. NAME
 9. PARTIAL_TEXT
 10. CONTEXTUAL


Fallback chains should attempt to preserve priority order.

However, if a lower-priority locator has:

- Higher Confidence
- Lower Volatility
- Better Uniqueness

it may be selected ahead of a higher-priority locator.

Example:

Primary:
ID

Available Fallbacks:

CSS
(Confidence: MEDIUM)

TESTID
(Confidence: HIGH)

Preferred Fallback:
TESTID

Reason:
Higher confidence and lower volatility

---

### Fallback Diversity Rule

Do not generate fallback chains using the same locator strategy repeatedly.

Example:

Bad

```text
Primary:
ID

Fallback 1:
ID

Fallback 2:
ID

Fallback 3:
ID
```

Preferred

```text
Primary:
ID

Fallback 1:
ACCESSIBILITY

Fallback 2:
CSS

Fallback 3:
ALT_XPATH
```

Fallback chains should maximize recovery options.

---

### Fallback Confidence Rule

Fallback chains must preserve confidence order whenever possible.

Example:

```text
HIGH
↓
HIGH
↓
MEDIUM
↓
MEDIUM
```

Avoid:

```text
HIGH
↓
LOW
↓
HIGH
```

unless no higher-confidence alternative exists.

---

### Forbidden Fallback Candidates

Never use:

```text
Absolute XPath

Positional XPath

nth-child

nth-of-type

Framework-generated classes

Dynamic IDs

Runtime-generated attributes

Non-Unique Locators
```

Examples:

```text
/html/body/div[2]/button

button:nth-child(3)

react-123

ng-star-inserted

pc13

pc14
```

---

### Fallback Chain Example

```text
Element:
Transfer Button

Primary Locator:
#transferBtn

Fallback Locator 1:
getByRole('button', { name: 'Transfer' })

Fallback Locator 2:
button.primary-transfer

Fallback Locator 3:
//button[text()='Transfer']

Confidence:
HIGH
HIGH
MEDIUM
MEDIUM
```

---

### Self-Healing Support

Fallback chains must be stored in the Locator Repository and Locator Inventory metadata. Page Objects and Components consume only the registered key.

The Self-Healing Agent must evaluate fallback locators before initiating locator rediscovery.

Locator rediscovery should occur only when:

```text
All fallback locarors fail validation.
```

or

```text
Fallback Chain Exhausted = YES
```


---

## Locator Validation Rules

Every locator candidate must pass:

* Validation 1 — Uniqueness
   - count() === 1

  Reject:
   - count() == 0 
   - count() > 1

* Validation 2 — Visibility
  - locator.isVisible()
  - Required.

* Validation 3 — Enabled State
  - locator.isEnabled()
  - Required for interactive elements.

* Validation 4 — Attachment
  - Element must exist in the DOM.

* Validation 5 — Actionability
  - Element must be: Clickable, Fillable and Selectable depending on action type.

---

## Duplicate Locator Resolution

If a locator matches multiple elements:

 1. Do not fail immediately.
 2. Generate contextual locators using:
    - Parent containers
    - Nearby text
    - Table rows
    - Cards 
    - Dialogs
    - Form sections
    - Business context

Example:

 - Bad: 
 ```
 getByRole('button', { name: 'Edit' })
 ```
 - Good:
 ```
    Customer Row: Ahmed
     → Edit Button
```
Prefer business context over positional selectors.

---

## Wait Strategy

* Never use: 
  - page.waitForTimeout()

* Use:
  - await expect(locator).toBeVisible();
  - await expect(locator).toBeEnabled();
  - await expect(page).toHaveURL();
  - await expect(locator).toContainText();
  
* Wait for business state.
* Never wait for time.

---

## Blocker Handling Rules
Detect known business blockers through visible text, roles, labels, dialogs, banners, or accessible controls.

Examples:

- Active session detected
- OTP expired
- Forced password reset
- Terms and Conditions acceptance
- Maintenance warning
- Security verification prompt
- Concurrent login warning

For blockers requiring user acknowledgement:

1. Capture evidence before interaction.
2. Log blocker details.
3. Capture screenshot when available.
4. Attach evidence to Playwright report when testInfo exists.
5. Continue only if blocker handling is approved by project rules.

Use stable accessible controls such as:

- Proceed
- Continue
- Yes
- Confirm
- OK

Do not hide blockers.

Do not suppress blockers.

Document blocker occurrence through logs, annotations, screenshots, traces, or reports.

Business blockers are considered execution evidence and must remain visible in reporting.

---

## Assertions

Assertions must validate business outcomes.

1. Bad:
```text
expect(true).toBeTruthy();
```

2. Good:
``` text
await expect(successMessage) .toContainText('Transfer completed successfully');
```
---

## Test Data Rules

Never hardcode:
 - Passwords
 - Account Numbers
 - Card Numbers
 - Tokens
 - PII

Use:
 - Environment Variables
 - Fixtures
 - Data Files
 - Factories

only.

---

## Automation Feasibility Rules

Read feasibility from QA Analyzer.

 - HIGH: Automate immediately.
 - MEDIUM: Automate with warning.
 - LOW: Output:
```text
    ⚠ AUTOMATION RISK

    TC: TC-001

    Reason: Unstable dependency

    Recommendation: Manual validation preferred.
```
---

## Coverage Validation

Before generation completes:

Verify every generated test maps to:

IU

Scenario

TC

Output:
```text
TC-001
↓
SCN-001
↓
IU-001
↓
REQ-001
```
Verify every generated test also maps to:
```
Lifecycle Definition
↓
Setup Logic
↓
Execution Logic
↓
Verification Logic
↓
Cleanup Logic
```
---

## Automation Traceability Output

Generate:

📊 AUTOMATION TRACEABILITY
```text
REQ-001
↓
IU-001
↓
SCN-001
↓
TC-001
↓
AUT-LOGIN-001.spec.ts 

Status:
Automated

Lifecycle

Setup:
Fixture: transferBeneficiarySetup

Execution:
AUT-SAIB-1818.spec.ts

Verification:
Projected Balance Assertion

Cleanup:
Beneficiary Cleanup Utility

Retry Eligible:
YES

Self-Healing:
LOCATOR_ONLY
```
---

## CR Mode Rules

When Pipeline Mode:
 CR_DELTA
 ``` text 
Only automate:
 - NEW
 - MODIFIED
behaviors.

Do not regenerate automation for:
 - UNCHANGED behavior.

Updated Automation

 - Output:
   UPDATED
   Replaces: AUT-TC-014 
   Reason: CR-042 modified validation logic.
```
---

## Quality gates
- Every automation test maps to a TC.
- No forbidden locators.
- All selected locators passed validation checks.
- Assertions validate outcomes.
- No credentials are hardcoded.
- No fake locators are introduced.
- No hard-coded waits are used.
- Application defects are not hidden.
- Tests consume feature Page Object facades and do not import Components directly.
- New or reused Components are cataloged and supported by equivalent DOM and behavior evidence.
- Locator definitions remain centralized in the Locator Repository; scoped behavior remains in its narrowest correct Page Object or Component consumer.
- Playwright-native actions and web-first assertions were considered before custom waiting or polling.
- No exception-based normal UI control flow was introduced.
- No permanent runtime `.or()` fallback chain was introduced.
- Asynchronous multi-decision workflows remain readable and bounded.
- TypeScript abstractions improve safety or reuse without hiding Playwright intent.
- Functionality, sequencing, diagnostics, return values, and public APIs remain preserved.

---

## Do-not rules
- Do not invent business rules.
- Do not bypass business validations.
- Do not remove assertions to make tests pass.
- Do not generate tests without clear expected results.
- Do not invent locators.
- Do not hardcode credentials.
- Do not automate blocked or untestable IUs.
- Do not generate automation for deprecated behaviors.
- Do not use screenshots as a locator discovery mechanism.
- Do not use nth-child or absolute XPath selectors.
- Do not ignore locator confidence ratings.

---

## Output file locations
- `pages/`
- `tests/`
- `fixtures/`
- `utils/`
- `data/`
- `docs/test-design/automation-coverage.md`
- `docs/test-design/automation-traceability.md`
- `docs/test-design/locator-registry.md`

---

## Example prompt to use this skill
“Use the Automation Implementation Agent to automate all approved P1 and P2 test cases for the Transfers module while preserving traceability, locator confidence rules, and Playwright TypeScript framework standards.”
