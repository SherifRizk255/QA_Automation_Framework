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
- System Map
- Navigation Map
- Page Object Recommendations
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
   - Locator Confidence
   - Locator Volatility
   - Locator Uniqueness
   - Discovery Source
   - Locator Score
   - Known Risks
   - Navigation Paths
   - Page Object Recommendations

---

## Responsibility

 Generate:
  - pages/
  - tests/
  - fixtures/
  - utils/
  - data/

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
7. Read existing Page Objects, Fixtures, Utilities, and Shared Components.
8. Determine automation scope and impacted business flows.
9. Reuse existing Page Objects where possible.
10. Create new Page Objects only when required.
11. Define Page Object responsibilities and reusable methods.
12. Select Primary Locators and Fallback Locator Chains from Locator Inventory.
13. Apply contextual locator strategy for non-unique elements.
14. Store all locators exclusively inside Page Objects.
15. Create or update Fixtures, Utilities, Test Data, and Supporting Helpers.
16. Implement Playwright TypeScript tests using Page Object methods only.
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

## Automation Architecture Rules

 - Page Object Model Required
 - All UI interactions must reside in Page Objects.
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

## Locator Strategy

Use Locator Inventory first.
Never invent locators.

---

## Locator Priority
1. Role + Accessible Name
2. Test Attributes (data-testid, data-test, data-cy, data-qa)
3. aria-label
4. Label
5. Placeholder
6. Stable ID
7. Name Attribute
8. Visible Text
9. Partial Text
10. Stable CSS
11. XPath

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

Every interactive element must contain:
 - Primary Locator
 - Fallback Locator 1
 - Fallback Locator 2
 - Fallback Locator 3

Fallback locators must be selected from Locator Inventory metadata.

Prefer:
 - Role
 - Label
 - Placeholder
 - Stable ID
 - Name
 - Text

Avoid:
 - CSS
 - XPath

unless no alternative exists.

Fallback chains must preserve locator confidence order.

Store fallback chains in Page Objects to support Self-Healing Agent recovery.

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
