# 16 - Self-Healing Agent

## Purpose
Recover from automation-related failures only.

This skill consumes approved failure analysis results, applies the smallest safe automation fix, validates the fix through re-execution, and documents all changes.

This skill exists to repair automation implementation issues while preserving business intent, requirement traceability, and defect visibility.

This skill does not:
 - Fix application defects
 - Fix business logic defects
 - Modify requirements
 - Change expected business outcomes
 - Hide failures
 - Suppress defects
 - Bypass validations

---

## When to use this skill
Use this skill after failure analysis confirms a failure is an automation script issue.

---

## Required inputs

### Mandatory
 - `reports/failure-analysis.md`
 - `docs/analysis/locator-inventory.md`
 - `playwright-report/`
 - `test-results/`
 - `docs/analysis/locator-repository.json`
 - `docs/test-design/test-lifecycle.md`

### Optional
 - docs/analysis/page-object-recommendations.md 
 - docs/analysis/navigation-map.md 
 - docs/test-design/automation-coverage.md
 - reports/recovery-recommendations.md

If present, use it.

If absent, derive recovery strategy from failure-analysis.md.

---

## Consumes

* From Failure Analysis Agent
  - Classification 
  - Locator Subclassification
  - Severity 
  - Owner 
  - Self-Healable 
  - Self-Healing Confidence
  - Recovery Recommendation
  - DOM Context Analysis
  - Locator Analysis 
  - Evidence
  - From Test Execution Agent
  - DOM Context Evidence
  - Accessible Role Inventory
  - Locator Match Counts

* From System Walkthrough Agent
  - Locator Inventory
  - Locator Confidence
  - Locator Volatility 
  - Locator Uniqueness 
  - Locator Score
  - Fallback Locators
  - Discovery Source
  - Navigation Map
  - Screen Inventory

* From Automation Implementation Agent
  - Page Objects
  - Fixtures
  - Utilities
  - Test Files
  - Locator Metadata

* From Test Lifecycle
  - Setup Requirements
  - Teardown Requirements
  - Retry Eligibility
  - Self-Healing Scope
  - Environment Dependencies
  - Test Data Dependencies
  - Execution Constraints

---

## Required outputs
- Code changes for automation issues only
- Re-run result for affected tests
- `reports/self-healing-log.md`
- `reports/healing-regression-results.md`

---

## Responsibility

Determine:
 - Can the failure be repaired safely?
 - What is the smallest safe repair?
 - Can the repair be validated?
 - Does the repair introduce additional risk?

Preserve:
```
REQ
↓
IU
↓
SCN
↓
TC
↓
AUT
↓
SETUP
↓
EXEC
↓
FAILURE
↓
HEALING
↓
TEARDOWN
```
traceability.

---

## Healing Eligibility Gate

Before any code modification:

Healing Allowed:
YES | NO

Proceed only when:

Self-Healable = YES

and

Classification is one of:
 - AUT_LOCATOR
 - AUT_TIMING
 - AUT_ASSERTION
 - TEST_DATA

---

## Lifecycle Protection Rules

Before applying any fix:

1. Read lifecycle metadata for the affected test.

2. Verify the proposed fix does not alter:
   - Required setup steps
   - Required teardown steps
   - Test data lifecycle
   - Environment lifecycle
   - Execution ownership

3. Self-healing may update:
   - Locators
   - Wait strategies
   - Automation assertions
   - Test data fixtures

4. Self-healing must not:
   - Remove lifecycle-required setup
   - Remove lifecycle-required teardown
   - Bypass prerequisite creation steps
   - Skip cleanup obligations
   - Convert isolated tests into dependent tests

If lifecycle compliance would be broken:

Healing Allowed:
NO

Reason:
Lifecycle violation.

---

## Blocked Healing Categories

Never attempt healing for:
 - APP_FUNCTIONAL
 - APP_VALIDATION
 - APP_UI
 - ENVIRONMENT
 - BLOCKER
 - ACCESS_PERMISSION
 - REQUIREMENT_AMBIGUITY
 - EXTERNAL_DEPENDENCY

Output:

```
Healing Allowed:
NO

Reason:
Application defect.
```
Stop processing.

---

## Allowed Healing Categories

### AUT_LOCATOR

Possible fixes:
 - Locator rediscovery
 - Locator replacement
 - Fallback locator activation
 - Locator Repository update with the owning Page Object or Component consumer preserved

---

### AUT_TIMING

Possible fixes:
 - Web-first assertion improvements
 - State synchronization
 - Navigation stabilization
 - Loading state handling

---

### AUT_ASSERTION

Possible fixes:
- Incorrect automation assertion
- Outdated expected automation state
- Improper verification logic
- Only if requirement behavior remains unchanged.

---

### TEST_DATA

Possible fixes:
- Fixture corrections
- Data generation fixes
- Environment-safe test data refresh
- Lifecycle-approved setup data creation

Restrictions:

- Must respect setup ownership defined in test-lifecycle.md
- Must respect teardown ownership defined in test-lifecycle.md
- Must not create persistent data unless lifecycle explicitly allows it
- Must not depend on data created by another test

---


## Healing Confidence Gate

Before modifying automation:

Healing Confidence:
HIGH
MEDIUM
LOW

Proceed automatically only when:

HIGH
or
MEDIUM

LOW confidence healing requires manual review.

---

## Recovery Strategy Selection 
Recovery strategy must be selected according to failure classification. 
```
AUT_LOCATOR_NOT_FOUND 
→ REDISCOVER_LOCATOR 

AUT_LOCATOR_MULTIPLE_MATCHES 
→ USE_CONTEXTUAL_LOCATOR 

AUT_LOCATOR_CONTEXT_CHANGED 
→ REBUILD_LOCATOR_CHAIN 

AUT_LOCATOR_FALLBACK_EXHAUSTED 
→ REBUILD_LOCATOR_CHAIN 

AUT_WAIT_STRATEGY 
→ WAIT_STRATEGY_REVIEW 

AUT_ASYNC_RENDER 
→ WAIT_STRATEGY_REVIEW
```
---


## Step-by-step behavior

1. Read failure-analysis.md.
2. Read test-lifecycle.md.
3. Verify self-healing eligibility.
4. Verify healing is allowed by lifecycle rules.
5. Verify setup and teardown requirements remain intact.
6. Identify failure classification.
7. Identify recovery strategy.
8. Collect locator metadata and DOM evidence.
9. Identify affected automation asset.
10. Identify the owning Page Object or Component.
11. Generate recovery candidates.
12. Validate recovery candidates.
13. Select safest valid repair.
14. Apply smallest safe fix.
15. Update locator repository if locator changes.
16. Re-run failed test.
17. Verify failure resolved.
18. Run impacted related tests.
19. Assess healing risk.
10. Generate self-healing report.
11. Update automation coverage if required.
12. Record remaining risks.

---

## Component Ownership Protection Rules

Before healing a locator or widget interaction:

1. Trace the failure through the feature Page Object facade to the owning Page Object or Component.
2. Heal the Locator Repository entry and preserve the narrowest existing behavioral consumer.
3. Do not bypass a Component by adding a competing locator to a Page Object or specification.
4. Do not duplicate locators across layers.
5. Preserve optional `find*()` behavior and required `get*()` validation behavior.
6. Preserve the feature Page Object's public facade and business sequencing.

Every committed locator is registered. Locator healing updates the Locator Repository entry while preserving the current narrowest Page Object or Component consumer and its repository key.

---

## Playwright-First Healing Protections

A healing change must not:

* Append permanent `locator.or()` chains to hide an obsolete locator.
* Catch and swallow locator, actionability, or assertion failures.
* Add `expect.poll()`, `toPass()`, or custom polling for state directly observable through a locator assertion.
* Replace dedicated structured DOM access with complex regex parsing.
* Compress separate business, rejection, or recovery reasons into unreadable compound logic.
* Change optional `find*()` behavior into required failure.
* Change required `get*()` behavior into optional skipping.
* Weaken assertions or diagnostics.
* Bypass the feature Page Object facade.

When a locator fails, replace its repository definition after evidence-backed validation while preserving the narrowest behavioral consumer. Repository fallbacks are evaluated independently; they are not accumulated into an unbounded runtime union. Exceptional handling must remain justified and preserve the original behavior.

---

## Locator Recovery Framework

When:

Classification:

  AUT_LOCATOR

Never immediately edit the locator.

Perform locator rediscovery.

---

### Repository Lookup Rules

Before generating new locator candidates:

1. Search locator-repository.json.
2. Locate matching element entry.
3. Validate repository locator.
4. Validate repository fallback chain.
5. Attempt recovery using repository metadata.
6. Initiate locator rediscovery only if:
   - Repository locator fails
   - Fallback chain exhausted
   - Context no longer valid

Repository recovery must be attempted before full rediscovery.

---

### Locator Rediscovery Process

1. Identify failed element.
2. Review locator metadata.
3. Review DOM context evidence.
4. Review accessible roles.
5. Review nearby interactive elements.
6. Generate locator candidates.
7. Score candidates using locator priority hierarchy.
8. Validate candidates.
9. Select highest-scoring valid candidate.
10. Rebuild fallback locator chain.
11. Update the owning Page Object or Component.
12. Re-run affected tests.

---

### Candidate Generation Rules 
Generate candidates using: 
 1. Role + Accessible Name 
 2. Test Attributes 
 3. aria-label 
 4. Label 
 5. Placeholder 
 6. Stable ID 
 7. Name Attribute 
 8. Visible Text 
 9. Stable CSS
 10. XPath

Generate multiple candidates whenever possible. 

Never rely on a single candidate.

---

### Locator Priority Hierarchy

Always attempt locator strategies in this order.

- Priority 1 

  Stable ID

  Examples:
  ```
   HTML
    id="transferBtn"

   Playwright
    page.locator('#transferBtn')

  ```

- Priority 2

  Accessibility Locator

  Example

   ```
   HTML:
    - aria-label="Password"
   Playwright
    - page.getByRole('button', { name: 'Transfer' })
   ```

- Priority 3
   
  Stable CSS Selector

  Examples:
   ```
   CSS:
    - button[id='transferBtn']
    - button.primary-transfer
   
   ```

- Priority 4
  
  Alternative XPath

  Relative XPath built from stable attributes,
  business context,
  or meaningful text.

  Examples:

   ```
   - //button[@id='transferBtn']
   - //input[@placeholder='Enter your password']
   - //button[text()='Transfer']
   - //tr[.//td='Ahmed']//button[text()='Edit']
   ```

- Priority 5
  
  Visible Text

  Example:
    ```
   page.getByText('Transfer')

    ```
  Use only when the text is:
   - Unique
   - Stable
   - Business meaningful


- Priority 6
  
  Test Attributes

  Examples:

   ```
   page.getByTestId('transfer-btn')

   ```

- Priority 7
  
  Placeholder

  Example:
   ```
   page.getByPlaceholder('Enter your password')
   ```

- Priority 8
  
  Name Attribute

  Example:
   ```
   page.locator('[name="customerName"]')

   ```

- Priority 9
  
  Partial Text

  Example:

   ```
   page.getByText(/Transfer/)
   ```

- Priority 10
  
  Contextual Locator

  Example:
   ```
   Contextual Locator
   ```
---

### Forbidden Locator Types

Never use:
 - nth-child
 - nth-of-type
 - absolute xpath
 - framework-generated classes
 - dynamic ids
 - random generated attributes

###

---

### Framework Attribute Rules

Never use framework-generated attributes as recovered locators.

Examples:
 - pc13
 - pc14
 - data-p
 - data-pc-name
 - data-pc-section
 - ng-reflect-*
 - ng-star-inserted
 - react-*
 - css-*

Treat these attributes as HIGH volatility.
---

### Locator Validation Rules

Every locator candidate must pass:

-  Validation 1
```
Uniqueness
count() == 1
```

- Validation 2
```
Visibility
isVisible()
```

- Validation 3
```
Enabled State
isEnabled()
```

- Validation 4
```
Attached To DOM
```

- Validation 5
```
Actionability
```
Must be interactable.

---
### Duplicate Locator Resolution

If multiple elements match:
 - Do not fail immediately.
 - Generate contextual locator.

Use:
 - Parent containers
 - Table rows
 - Dialogs
 - Cards
 - Business context

Example:
```
Instead of:

Edit Button

Use:

Edit Button for Customer Ahmed
```
---

### Fallback Chain Recovery

When Primary Locator fails:

1. Evaluate existing fallback chain.
2. Validate fallback candidates.
3. Select highest-confidence valid fallback.
4. Rebuild locator chain if necessary.
5. Update the owning Page Object or Component.

Document all locator chain modifications.

---

### Repository Synchronization

Whenever locator recovery succeeds:

1. Update locator-repository.json.
2. Preserve historical locator metadata.
3. Record old locator.
4. Record new locator.
5. Update validation timestamp.

Never bypass synchronization by inserting the recovered selector directly into a Page Object or Component. The consumer must continue resolving the same repository key unless an approved semantic rename is required.

Repository updates must occur only after successful test validation.

---
### Repository Statistics Update

After successful healing:

Update:

- Primary Locator
- Fallback Chain
- Last Validated
- Validation Count
- Success Count
- Last Updated By
- Repository Status

If healing fails:

Increment:

- Failure Count

Repository updates are allowed only after successful validation and test execution.

---

## Timing Recovery Framework
### Wait Optimization Rules

When:

Classification:
AUT_TIMING

Allowed:
 - expect(locator).toBeVisible()
 - expect(locator).toBeEnabled()
 - expect(page).toHaveURL()
 - waitForResponse()
 - waitForLoadState()

Forbidden:
 - page.waitForTimeout()

---

## Assertion Recovery Framework

### Assertion Repair Rules

Allowed only when:
 - Requirement behavior unchanged.

Examples:
 - Text changed
 - Label changed
 - Automation expectation outdated

Not allowed:
 - Changing expected business outcomes

---

## Page Object and Component Recovery Framework

### Page Object and Component Repair Rules

Allowed:
 - Locator updates
 - Method improvements
 - Navigation stabilization
 - Synchronization improvements

Not allowed:
- Business logic changes

---


## Healing Risk Assessment

Every fix must include:

Healing Risk:
 - LOW
 - MEDIUM
 - HIGH

### LOW
  - Locator replacement
  - Synchronization improvement
  - Fixture correction

### MEDIUM
 - Page Object refactor
 - Navigation adjustment

### HIGH
 - Large structural automation changes

---

## Regression Verification

After healing:

Verify:

 - Setup executed successfully
 - Teardown executed successfully
 - No orphaned data remains
 - No lifecycle violations introduced

Run:
 - Failed Test

If:
 - PASS

Continue.

Then run:
 - Impacted Tests
 - Related Tests
 - Dependent Tests

Verify:
 - No new failures introduced.

---

## Traceability Preservation

Never modify:

REQ

IU

SCN

TC

Expected Result

Only modify:

 1. Automation Implementation Layer
 2. Traceability must remain intact.

---

## CR Mode Rules

When:

Pipeline Mode = CR_DELTA

Only heal:

 1. Delta automation
 2. Regression automation affected by delta

Do not modify unrelated automation.

---

## Self-Healing Report Format

HEALING-001

REQ:
REQ-001

IU:
IU-004

SCN:
SCN-011

TC:
TC-032

Automation:
AUT-TC032.spec.ts

Classification:
AUT_LOCATOR

Subtype:
AUT_LOCATOR_NOT_FOUND

Recovery Strategy:
LOCATOR_REDISCOVERY


Healing Confidence:
HIGH

Affected Files: 
pages/transfer.page.ts 

Old Locator: 
#transferBtn 

New Locator: 
getByRole('button',{name:'Transfer'}) 

Confidence: 
HIGH 


Re-Run Result: 
PASS 

Regression Verification: 
PASS 

Remaining Risk: 
None

---

## Quality gates
Before completion verify:
 - Healing Eligibility Verified? YES
 - Only automation issues are fixed.
 - Affected tests are re-run.
 - Changes are documented.
 - Real defects remain visible.
 - Related Tests Verified; Required.
 - Traceability Preserved: REQ → IU → SCN → TC  retained.
 - Locator Validation Verified

       All recovered locators satisfy:
       count() == 1
       isVisible()
       isEnabled()
       Actionable
  
 - Self-healing success is determined by one of the following:
     1. Failure count decreases
     2. Failure classification changes from automation issue to non-automation issue
     3. Root cause confidence increases

 - Lifecycle requirements preserved.
 - Setup behavior unchanged unless explicitly approved.
 - Teardown behavior unchanged unless explicitly approved.
 - No lifecycle violations introduced.
 - Owning Page Object or Component identified.
 - No existing Component was bypassed.
 - No duplicate locator was introduced at another layer.
 - Optional and required reader behavior preserved.
 - Feature Page Object facade preserved.
 - No permanent runtime `.or()` fallback chain introduced.
 - No swallowed Playwright failure introduced.
 - No unnecessary polling introduced for locator-observable state.
 - Structured DOM access remains preferred over complex regex parsing.
 - Control flow remains explicit and readable.
---

## Do-not rules
- Do not hide real bugs.
- Do not modify business requirements.
- Do not modify expected results.
- Do not bypass business validations.
- Do not remove assertions to make tests pass.
- Do not suppress failures.
- Do not hide defects.
- Do not weaken test coverage.
- Do not use forbidden locator types.
- Do not break traceability.
- Do not increase timeout without reason.
- Do not use `page.waitForTimeout()`.
- Do not fix application defects in automation.
- Do not remove lifecycle-required setup.
- Do not remove lifecycle-required teardown.
- Do not bypass lifecycle ownership rules.
- Do not create cross-test dependencies.

---

## Output file locations
- `reports/self-healing-log.md`
- `reports/healing-regression-results.md`
- Updated automation files only when justified

---

## Example prompt to use this skill
“Use the self-healing agent to fix the automation issues listed in `reports/failure-analysis.md`.”
