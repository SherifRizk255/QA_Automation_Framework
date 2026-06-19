# 15 - Failure Analysis Agent

## Purpose
Analyze Playwright TypeScript test failures using execution metadata, traceability mappings, screenshots, videos, traces, locator information, blocker records, retry information, and requirement context.

This skill determines the most likely root cause of a failure.

This skill does not:
 - Modify automation code
 - Fix locators
 - Self-heal tests
 - Re-run tests
 - Change application behavior

 ---
 
## Required inputs

### Mandatory
 - `reports/failure-analysis-input.md`
 - `reports/execution-metadata.md`
 - `playwright-report/`
 - `test-results/`

### Optional
 - requirements/ 
 - analysis/ 
 - traceability reports 
 - automation coverage report
 - `docs/analysis/locator-repository.json`

---

## Consumes
* From Test Execution Agent
  - Execution Results 
  - Execution Metadata 
  - Failure Analysis 
  - Input Screenshots 
  - Videos 
  - Traces 
  - Retry Information 
  - Blocker Records 
  - Locator Failure Records
  - Locator Repository Metadata
  - Locator Confidence 
  - Locator Volatility 
  - Locator Uniqueness 
  - Locator Score 
  - Locator Match Counts 
  - DOM Context Evidence 
  - Accessible Role Inventory 
  - Locator Fallback Chains 
  - Recovery Metadata

* From Traceability Manager
  - REQ Mapping
  - IU Mapping
  - SCN Mapping
  - TC Allocation
  - Regression Classification

* From QA Analyzer
  - Risk Classification
  - Dependencies
  - Regression Scope
  - Coverage Intent

---

## Responsibility

Determine:
 - What failed 
 - Why it failed 
 - Who owns the failure 
 - Whether it is self-healable 
 - Whether it impacts requirements 
 - Whether it impacts regression scope
 - Recommended recovery strategy
 - Recovery confidence

while preserving:
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
```
traceability.

---


## When to use this skill
Use this skill after test execution produces failures.

---
## Required Outputs
 - `reports/failure-analysis.md`
 - `reports/self-healing-candidates.md`


## Step-by-step behavior
1. Read failure-analysis-input.md.
2. Read execution metadata.
3. Identify failed automation test.
4. Identify associated TC.
5. Identify associated Scenario.
6. Identify associated IU.
7. Identify associated Requirement.
8. Read Playwright error message.
9. Review locator metadata. 
10. Compare locator metadata with repository records.
11. Detect locator drift.
12. Review DOM context evidence. 
13. Review accessible roles and nearby interactive elements. 
14. Review retry information. 
15. Review blocker records. 
16. Review locator failure records. 
17. Review traces. 
18. Review screenshots if required. 
19. Review videos if required. 
20. Compare actual behavior with expected behavior. 
21. Classify root cause. 
22. Assign severity.
23. Assign owner.
24. Determine self-healing eligibility.
25. Assign self-healing confidence.
26. Determine recovery recommendation.
27. Generate failure-analysis.md.
28. Generate self-healing-candidates.md.
29. Generate defect-candidates.md.
30. Hand off eligible failures to Self-Healing Agent.

---

## Failure Classification Model

Every failure must be classified into exactly one primary category.

### AUT_LOCATOR
Locator cannot find target element.

Examples:
```
Element not found
Locator matches zero elements
Locator became stale
```
### AUT_TIMING

Synchronization issue.

Examples:
```
Timeout exceeded
Element not visible yet
Page still loading
```
### AUT_ASSERTION

Automation assertion mismatch.

Examples:
```
Expected text mismatch
Unexpected state assertion
```
### APP_FUNCTIONAL

Business functionality failure.

Examples:
```
Transfer succeeds incorrectly
Business rule ignored
Wrong workflow outcome
```
### APP_VALIDATION

Validation defect.

Examples:
```
Missing validation
Incorrect validation message
Invalid data accepted
```
### APP_UI

User interface issue.

Examples:
```
Broken layout
Hidden controls
Incorrect labels
```
### ENVIRONMENT

Environment instability.

Examples:
```
Environment unavailable
DNS failure
Deployment issue
```
### TEST_DATA

Data-related issue.

Examples:
```
Expired account
Missing test user
Invalid setup data
```
### ACCESS_PERMISSION

Permission or role issue.

Examples:
```
Access denied
Missing role
Unauthorized action
```
### BLOCKER

Execution blocked by business condition.

Examples:
```
Maintenance banner
Forced password reset
Concurrent login warning
OTP expired
```
### REQUIREMENT_AMBIGUITY

Expected behavior unclear.

Examples:
```
Requirement incomplete
Expected result undefined
Conflicting requirements
```
### EXTERNAL_DEPENDENCY

Third-party or integration issue.

Examples:
```
API unavailable
Payment gateway failure
CRM unavailable
```

---

## Locator Failure Subclassification 
When Classification = AUT_LOCATOR 
Assign one of the following subtypes: 
 - AUT_LOCATOR_NOT_FOUND 
 - AUT_LOCATOR_MULTIPLE_MATCHES 
 - AUT_LOCATOR_NOT_VISIBLE
 - AUT_LOCATOR_NOT_ENABLED
 - AUT_LOCATOR_DETACHED
 - AUT_LOCATOR_TIMEOUT
 - AUT_LOCATOR_CONTEXT_CHANGED
 - AUT_LOCATOR_FALLBACK_EXHAUSTED

Examples:
```
Locator resolved zero elements
→ AUT_LOCATOR_NOT_FOUND

Locator resolved multiple elements
→ AUT_LOCATOR_MULTIPLE_MATCHES

Element exists but is hidden
→ AUT_LOCATOR_NOT_VISIBLE
```

---

## Timing Failure Subclassification
When Classification = AUT_TIMING

Assign:
 - AUT_WAIT_STRATEGY
 - AUT_PAGE_LOAD
 - AUT_ASYNC_RENDER
 - AUT_NETWORK_DELAY

Examples:
```
Element appears after framework render
→ AUT_ASYNC_RENDER

API response delayed
→ AUT_NETWORK_DELAY

Missing wait condition
→ AUT_WAIT_STRATEGY
```
---

## Root Cause Analysis Rules

Never classify a failure as an application defect unless evidence supports it.

Never classify a failure as automation-related unless locator, timing, or assertion evidence supports it.

When evidence is insufficient:
then: 

Classification:
UNKNOWN

Status:
Needs Investigation

---

## Failure Evidence Priority 
Analyze evidence in the following order: 
1. Playwright Error Message 
2. Locator Metadata 
3. DOM Context Evidence 
4. Retry Results 
5. Blocker Records 
6. Trace Files 
7. Screenshots 
8. Videos 

Screenshots and videos are considered supporting evidence.

Locator recovery decisions should prioritize DOM and locator metadata whenever available.

---

## Severity Assignment
1. Critical
   - Production blocker
   - Security issue
   - Data corruption
   - System unavailable
2. High
   - Major business flow failure
   - P1 functionality unavailable
3. Medium
   - Partial workflow impact
   - Validation issues
   - UI defects
4. Low
   - Cosmetic issue
   - Minor inconsistency

---

## Ownership Assignment

Possible owners:
 - QA Automation
 - Development
 - DevOps
 - Business Analyst
 - Product Owner
 - Environment Team
 - External Vendor

Example:
```
Owner:
QA Automation

Reason:
Locator drift detected
```
---

## Self-Healing Eligibility

Self-Healable:
YES | NO

### Eligible
 - AUT_LOCATOR_NOT_FOUND 
 - AUT_LOCATOR_MULTIPLE_MATCHES 
 - AUT_LOCATOR_CONTEXT_CHANGED 
 - AUT_LOCATOR_FALLBACK_EXHAUSTED 
 - AUT_WAIT_STRATEGY 
 - AUT_ASYNC_RENDER 
 - Certain AUT_ASSERTION failures

### Conditionally Eligible 
 - AUT_LOCATOR_NOT_VISIBLE 
 - AUT_LOCATOR_NOT_ENABLED

### Not Eligible 
 - APP_FUNCTIONAL 
 - APP_VALIDATION 
 - APP_UI 
 - BLOCKER 
 - ENVIRONMENT 
 - REQUIREMENT_AMBIGUITY 
 - EXTERNAL_DEPENDENCY
 
---

## Recovery Recommendation Model

Every self-healable failure must include a recovery recommendation. 

Allowed values:
 - REDISCOVER_LOCATOR
 - USE_FALLBACK_CHAIN
 - USE_CONTEXTUAL_LOCATOR
 - REBUILD_LOCATOR_CHAIN
 - WAIT_STRATEGY_REVIEW
 - MANUAL_REVIEW_REQUIRED

Examples:
```
Locator text changed
→ REDISCOVER_LOCATOR

Multiple matching elements 
→ USE_CONTEXTUAL_LOCATOR 

All fallbacks failed 
→ REBUILD_LOCATOR_CHAIN 

Timing instability 
→ WAIT_STRATEGY_REVIEW
```
---

## Self-Healing Confidence:
HIGH
MEDIUM
LOW
NONE

Guidelines:

HIGH
Locator alternatives available
DOM context available
Fallback chain exists

MEDIUM
Partial locator evidence available

LOW
Insufficient locator evidence

NONE
Not self-healable


---

## DOM Context Analysis 
When DOM context evidence exists analyze: 
 - Current URL 
 - Target Element 
 - Nearby Interactive Elements 
 - Available Accessible Roles 
 - Visible Text Context 
 - Match Counts 
 - Container Context
 - Available Locator Alternatives

Example: 
```
Target Element: 
Transfer Button 

Primary Locator: 
getByRole('button', { name: 'Transfer' }) 

Available Buttons: 
Transfer Funds 
Schedule Transfer 
Cancel 

Assessment: 
Locator text changed. 

Recovery Candidate: 
Role + Updated Accessible Name
```
---

## Locator Failure Analysis

When locator failures exist:

Analyze:
 - Primary Locator 
 - Fallback Locator Chain 
 - Locator Confidence 
 - Locator Volatility 
 - Locator Uniqueness 
 - Locator Score 
 - Failure Type 
 - Observed Match Count 
 - DOM Context 
 - Available Alternatives

Output:
```
Locator Analysis

Element:
Transfer Button

Primary Locator:
getByRole()

Fallback:
getByLabel()
getByText()

Confidence:
HIGH

Volatility:
LOW

Uniqueness:
UNIQUE

Failure Type: 
AUT_LOCATOR_NOT_FOUND 

Match Count: 
0 

Available Alternatives: 
Transfer Funds 

Assessment: Locator text changed. 

Recovery Recommendation: 
REDISCOVER_LOCATOR
```
---

## Locator Drift Analysis

When locator failures occur:

Compare:

- Failed Locator
- Repository Locator
- Current DOM Evidence

Determine:

Locator Drift:
YES | NO

Drift Type:
- Renamed
- Removed
- Duplicated
- Context Changed

Example:

Repository:
#transferBtn

Current DOM:
#transferFundsBtn

Locator Drift:
YES

Recommendation:
REDISCOVER_LOCATOR

---

## ## Repository Drift Classification

When locator drift is detected classify:

### RENAMED

Element exists.

Locator value changed.

Example:
```
#transferBtn

↓

#transferFundsBtn
```

### REMOVED

Element no longer exists.

### DUPLICATED

Locator resolves multiple elements.

### CONTEXT_CHANGED

Element exists inside different container context.

### ACCESSIBILITY_CHANGED

Accessible Name, Label, or Role changed.


Every drift event must include a recovery recommendation.

---

## Blocker Analysis

Analyze every blocker.
```
Example:

Blocker:
Active Session Warning

Expected:
Known blocker

Handling:
Successful

Classification:
Not a defect

or

Blocker:
Maintenance Banner

Classification:
BLOCKER

Execution Status: 
Blocked
```
---
## Retry Analysis

Analyze retries.

Example:
```
Retries:
1

Outcome:
Passed On Retry

Classification:
Potential timing instability
```
---

## Traceability Preservation

Every failure must retain:
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
FAILURE
```
Example:
```
REQ-001
IU-002
SCN-005
TC-018
AUT-TC018.spec.ts

Failure: 
AUT_LOCATOR
```

---

## CR Mode Rules

When:

Pipeline Mode = CR_DELTA

Identify:

DELTA FAILURE

or

REGRESSION FAILURE

Example:
```
Failure Type:
REGRESSION FAILURE

Impacted By:
CR-042
```
---

## Failure Output Format

FAILURE-001

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

Self-Healable:
YES

Recovery Recommendation:
REDISCOVER_LOCATOR

Self-Healing Confidence:
HIGH

Severity: 
Medium 

Owner: 
QA Automation 

Self-Healable: 
YES 

Evidence: 

Screenshot: 
test-results/screenshots/tc032.png 

Trace: 
test-results/traces/tc032.zip 

Root Cause: 
Transfer button locator no longer resolves.

Recommendation: 
Forward to Self-Healing Agent.


---

## Quality gates
Before completion verify: 
- Every failure has a classification.
- Evidence paths are listed.
- Owner assigned for every failure.
- Severity assigned for every failure.
- Self-Healing Decision Made: YES or NO for every failure.
- Automation issues and application defects are separated.
- Recommendations are actionable.
- Traceability Preserved

## Do-not rules
- Do not modify automation code.
- Do not change locators.
- Do not self-heal failures.
- Do not re-run tests.
- Do not suppress failures.
- Do not hide application defects.
- Do not invent root causes.
- Do not classify without evidence.
- Do not remove traceability.


## Output file locations
- `reports/failure-analysis.md`


## Example prompt to use this skill
“Use the Failure Analysis Agent to analyze the latest failed Playwright execution, classify root causes, determine ownership, identify self-healing candidates, and generate the failure analysis report.”
