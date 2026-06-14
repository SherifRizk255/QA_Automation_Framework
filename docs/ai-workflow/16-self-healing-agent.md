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
EXEC
↓
FAILURE
↓
HEALING
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
 - Page Object locator update

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
2. Verify self-healing eligibility.
3. Identify failure classification.
4. Identify recovery strategy.
5. Collect locator metadata and DOM evidence.
6. Identify affected automation asset.
7. Identify affected Page Object.
8. Generate recovery candidates.
9. Validate recovery candidates.
10. Select safest valid repair.
11. Apply smallest safe fix.
12. Re-run failed test.
13. Verify failure resolved.
14. Run impacted related tests.
15. Assess healing risk.
16. Generate self-healing report.
17. Update automation coverage if required.
18. Record remaining risks.

---

## Locator Recovery Framework

When:

Classification:

  AUT_LOCATOR

Never immediately edit the locator.

Perform locator rediscovery.

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
11. Update Page Object.
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
  ```
   Role + Accessible Name
  ```

- Priority 2
   ```
   Test Attribures
   ```

- Priority 3
   ```
   aria-label
   ```

- Priority 4
  ```
   Label
  ```

- Priority 5
   ```
   Placeholder
   ```

- Priority 6
  ```
   Stable ID
  ```

- Priority 7
   ```
   Name Attribute
   ```

- Priority 8
  ```
   Visible Text
  ```

- Priority 9
  ```
  Stable CSS
  ```

- Priority 10
  ```
   XPath
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
5. Update Page Object.

Document all locator chain modifications.

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

## Page Object Recovery Framework

### Page Object Repair Rules

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

---

## Output file locations
- `reports/self-healing-log.md`
- `reports/healing-regression-results.md`
- Updated automation files only when justified

---

## Example prompt to use this skill
“Use the self-healing agent to fix the automation issues listed in `reports/failure-analysis.md`.”
