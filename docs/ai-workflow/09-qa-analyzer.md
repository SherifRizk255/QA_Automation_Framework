# qa-analyzer.md

> Pipeline Stage 09A — runs after Orchestrator (Standard Mode).
>
> Applies QA intelligence to Intent Units (IUs).
>
> Performs:
>
> * Risk analysis
> * Requirement gap detection
> * Dependency analysis
> * Domain rule extraction
> * Coverage intent identification
> * Regression impact assessment
>
> Does NOT generate test cases.
>
> Does NOT generate automation.
>
> Does NOT generate traceability matrices.

---

# INPUT CONTRACT

Consumes:

* Input Detection Report
* Approved Intent Preview
* Requirements Quality Report
* Intent Unit List
* Run Context (from orchestrator)
* `docs/test-design/test-lifecycle.md`

Run Context Authority:

master-workflow.md
↓
orchestrator.md
↓
qa-analyzer.md

QA Analyzer must not determine pipeline mode independently.
It consumes the mode selected by orchestrator.

Run Context includes:

* Pipeline Mode
* Domain Context
* System Type
* IU Change Classification

  * NEW
  * MODIFIED
  * DEPRECATED

---

# PIPELINE GUARD

Before analysis begins:

Evaluate Requirements Quality Report.

---

## FULL FAIL

If:

```
Quality Status = FULL_FAIL
```

Output:

```
🚫 QA ANALYSIS BLOCKED

Reason:
Requirements are not testable.

Blocking Issues:
[list issues]

Required Action:
Requirements must be corrected before analysis can continue.
```

STOP.

---

## PARTIAL PASS

If:

```
Quality Status = PARTIAL_PASS
```

Output:

```
⚠ PARTIAL QA ANALYSIS

Blocked IUs:
[list]

Proceeding IUs:
[list]
```

Only analyze non-blocked IUs.

---

## PASS

If:

```
Quality Status = PASS
```

Proceed normally.

---

# RESPONSIBILITY

For every analyzable IU:

Perform:

1. IC → IU consistency validation
2. 7-layer analysis
3. Dependency mapping
4. Lifecycle Dependency Identification

   ```
   Determine:

     - Authentication dependencies
     - Authorization dependencies
     - Test Data dependencies
     - Environment dependencies
     - External service dependencies

   Generate lifecycle candidates for:
     - SUITE_SETUP
     - TC_SETUP
     - TC_TEARDOWN
     - SUITE_TEARDOWN

   Output lifecycle candidates for downstream lifecycle generation and traceability.
    ```
5. Risk scoring
6. Volatility scoring
7. Coverage intent identification
8. Domain rule extraction
9. Regression impact assessment
10. Gap detection
11. Ambiguity detection

---

# IC → IU CONSISTENCY CHECK

Validate traceability.

For each IU:

Check:

* Approved IC exists
* IU maps to approved IC
* IU outcome matches IC outcome
* No scope inflation occurred

---

## Severity Levels

| Flag        | Severity | Action     |
| ----------- | -------- | ---------- |
| IC GAP      | Blocker  | IU blocked |
| IC MISMATCH | High     | Escalate   |
| IU INFLATE  | Medium   | Review     |

---

## Output Format

```
IC Check: OK

IC Check: BLOCKED
🚫 IC GAP
IU-001 has no approved IC.

IC Check: ESCALATE
⚠ IC MISMATCH
IU outcome differs from approved IC.

💡 IU INFLATE
Additional behavior introduced beyond approved scope.
```

---

# IU CHANGE CLASSIFICATION

Provided by orchestrator.

Possible values:

```
NEW
MODIFIED
DEPRECATED
```

---

## NEW

First appearance of behavior.

No regression impact.

---

## MODIFIED

Existing behavior changed.

Determine:

```
Regression Scope:
FULL
TARGETED
SMOKE_ONLY
```

Identify impacted areas.

---

## DEPRECATED

Behavior removed.

Flag:

```
Test Retirement Required
```

---

# 7-LAYER ANALYSIS

Analyze every IU across:

---

## Layer 1 — Business Logic

Evaluate:

* Rule completeness
* Validation completeness
* Acceptance criteria quality

---

## Layer 2 — User Behavior

Evaluate:

* Expected usage
* Misuse scenarios
* User mistakes

---

## Layer 3 — API / Integration

Evaluate:

* External dependencies
* Contracts
* Failure handling

---

## Layer 4 — Data Integrity

Evaluate:

* Create
* Update
* Delete

Consider:

* Rollback
* Consistency
* Auditability

---

## Layer 5 — Automation

Evaluate:

* Stability
* Determinism
* Environment dependency
* CI/CD suitability
* Locator stability
* Test data repeatability

Output:

Automation Feasibility:
HIGH
MEDIUM
LOW

Automation Priority:
HIGH
MEDIUM
LOW

Rules:

HIGH
- Core business flow
- High regression value
- Stable automation candidate

MEDIUM
- Valuable coverage
- Some environment dependency

LOW
- Expensive to automate
- Unstable workflow
- Better suited for manual testing

Reason required.

---

## Layer 6 — Risk & Edge Cases

Evaluate:

* Boundaries
* Concurrency
* Duplicate actions
* Silent failures

---

## Layer 7 — Security / Performance / UX

Evaluate:

* Authorization
* Data exposure
* Injection risks
* Accessibility
* Performance concerns

---

# DEPENDENCY MAPPING

For every IU:

Output:

```
Depends On:
IU-001

Required By:
IU-005
IU-006
```

or

```
Depends On:
None

Required By:
None
```

---

# Risk Scoring

## LIFECYCLE DEPENDENCY IDENTIFICATION

For every IU:

Identify execution dependencies.

Possible dependency categories:

- AUTHENTICATION
- AUTHORIZATION
- TEST_DATA
- ENVIRONMENT_STATE
- EXTERNAL_DEPENDENCY

Determine recommended lifecycle action:

AUTHENTICATION
→ TC_SETUP

AUTHORIZATION
→ TC_SETUP

TEST_DATA
→ TC_SETUP
→ TC_TEARDOWN

ENVIRONMENT_STATE
→ SUITE_SETUP

EXTERNAL_DEPENDENCY
→ SUITE_SETUP

## Lifecycle Candidate Output

Lifecycle Candidates:

TC_SETUP
- Login User

TC_SETUP
- Create Beneficiary

TC_TEARDOWN
- Delete Beneficiary

## Shared Resource Detection

When a dependency is consumed by multiple test cases:

Promote lifecycle action to:

SUITE_SETUP

and

SUITE_TEARDOWN

Example:
```
Shared Customer Account
→ SUITE_SETUP

Shared Test User
→ SUITE_SETUP

Shared Banking Profile
→ SUITE_SETUP
```
## Lifecycle Traceability
Maintain:
```
REQ
↓
IU
↓
DEPENDENCY
↓
LIFECYCLE CANDIDATE
```
mapping.

Lifecycle candidates must retain IU traceability.

---

## Risk Propagation

Rules:

```
Dependency P1
→ current IU minimum P2

Current IU P1
→ downstream IU minimum P2
```

---

## Dependency Cycle Rule

If detected:

```
⚠ DEPENDENCY CYCLE DETECTED

IU-001
↓
IU-002
↓
IU-001

Analysis continues.

Risk elevated to P1.

Architect review recommended.
```

---

# RISK SCORING

Apply Intent Schema rules.

---

## Risk Levels

```
P1
P2
P3
P4
```

---

## Quality Modifiers

Apply in order:

```
Untestable
→ Force P1

Critical Ambiguity + Missing Rule
→ Force P1

Critical Ambiguity
→ Minimum P2

Missing Rule
→ Increase one level

Otherwise
→ Normal scoring
```

---

## Risk Confidence

```
HIGH
MEDIUM
LOW
```

Rules:

HIGH

No major flags.

MEDIUM

One ambiguity or gap.

LOW

Multiple flags.

---

Output:

```
Risk: P1
Confidence: LOW
```

---

# VOLATILITY SCORING

Measures likelihood of future change.

---

## HIGH

* CR changed repeatedly
* Rule unstable
* Frequent revisions

---

## MEDIUM

* Recently modified
* Clarifications ongoing

---

## LOW

* Stable behavior
* Mature requirement

---

Output:

```
Volatility:
HIGH
```

---

# TEST DESIGN PRIORITY

Derived from risk.

| Risk | Priority |
| ---- | -------- |
| P1   | CRITICAL |
| P2   | HIGH     |
| P3   | MEDIUM   |
| P4   | LOW      |

Output:

```
Test Design Priority:
CRITICAL
```

---

# COVERAGE INTENTS

Identify required testing dimensions.

Output only categories.

Do NOT generate scenarios.

Example:

```
Coverage Intents:

✓ Happy Path
✓ Validation
✓ Negative
✓ Boundary
✓ Security
✓ Integration
✓ Regression
```

---

# GAPS AND AMBIGUITIES

Use standard flags.

---

## GAP

```
⚠ GAP

Missing rule.
Missing validation.
Missing condition.
```

---

## AMBIGUOUS

```
❓ AMBIGUOUS

Outcome unclear.
Rule unclear.
Actor unclear.
```

---

## UNTESTABLE

```
🚫 UNTESTABLE

Required information absent.
```

---

## ASSUMPTION

```
💡 ASSUMPTION

Owner:
BA | PO | Dev

Expiry:
Before TC generation.
```

---

## SIDE EFFECT

```
⚡ SIDE EFFECT

External write detected.

Rollback:
Defined | Undefined
```

---

# DOMAIN RULE CONSOLIDATION

Extract rules from all IUs.

---

## Rule Registry Output

```
📐 DOMAIN RULES

RULE-001
Description:
[text]

Applies To:
IU-001
IU-004
```

---

# RULE IMPACT MAP

For every rule:

```
RULE-001

Impacts:
IU-001
IU-002
IU-005

Coverage Criticality:
HIGH
```

---

# RULE CONFLICT DETECTION

If conflicts exist:

```
⚔ RULE CONFLICT

RULE-001 conflicts with RULE-002

Impact:
IU-004
IU-007

Resolution Required:
BA Review
```

Otherwise:

```
No rule conflicts detected.
```

---

# WHAT I CANNOT DETERMINE

Always output.

Format:

```
❌ CANNOT DETERMINE

- Missing threshold
- Missing permission model
- Missing timeout value
```

---

# PER-IU OUTPUT FORMAT

```
IU-001

Type:
MODIFIED

Risk:
P1

Confidence:
HIGH

Volatility:
MEDIUM

Test Design Priority:
CRITICAL

Automation Priority:
HIGH

Layers:
Business     ✅
User         ⚠
API          ✅
Data         ✅
Automation   ✅
Risk         ⚠
Security     ✅

Dependencies:
```
Depends On:
IU-001

Required By:
IU-005

IC Check:
OK
```

Lifecycle Candidates:
```
TC_SETUP:
- Login User

TC_SETUP:
- Create Beneficiary

TC_TEARDOWN:
- Delete Beneficiary
```

Coverage Intents:

✓ Happy Path
✓ Validation
✓ Negative
✓ Boundary
✓ Security
✓ Regression

Flags:
None
```

---

# SUMMARY OUTPUT

```
🔍 QA ANALYSIS REPORT

Quality Gate:
PASS

Analysis Scope:
25 IUs

Blocked:
2 IUs

Risk Distribution:

P1: 5
P2: 10
P3: 8
P4: 2

IC Consistency:

IC Gaps:
1

IC Mismatches:
2

IU Inflation:
1

Flags:

Ambiguous:
4

Gaps:
3

Untestable:
1

Assumptions:
2

Side Effects:
5

Regression:

Modified:
8

Deprecated:
2

Rule Conflicts:
1

Coverage Heat Map:
[generated]

QA Readiness:
READY FOR TC GENERATION

Coverage Confidence:
92%

Automation Readiness:

HIGH : 10
MEDIUM : 8
LOW : 7

Lifecycle Candidates:

SUITE_SETUP:
[n]

TC_SETUP:
[n]

TC_TEARDOWN:
[n]

SUITE_TEARDOWN:
[n]

```
## Output Summary File Location
docs/analysis/qa-analysis-report.md

---

# QA READINESS GATE

Final section.

```
QA READINESS

Ready For TC Generation:
YES | NO

Blocked IUs:
[list]

Reasons:
[list]

Coverage Confidence:
[percentage]

Automation Candidates:
[list IU IDs]

Manual Candidates:
[list IU IDs]

```

---

# Absolute RULES

* Never generate test cases.
* Never generate automation.
* Never invent business rules.
* Never ignore IC consistency failures.
* Never ignore quality gate failures.
* Always map dependencies before scoring risk.
* Always identify regression impact for modified IUs.
* Always expose ambiguity.
* Always expose untestable requirements.
* Always preserve traceability.
* Every risk score must include confidence.
* Every IU must produce coverage intents.
* A blocked IU is preferable to a false assumption.

---

# TC_GENERATOR_HANDOFF
```
Proceed:
IU-001
IU-002

Blocked:
IU-009

Automation Priority:

IU-001: HIGH
IU-002: MEDIUM
IU-003: LOW

Regression Scope:

IU-004: FULL
IU-007: TARGETED

Retire:

IU-010
```