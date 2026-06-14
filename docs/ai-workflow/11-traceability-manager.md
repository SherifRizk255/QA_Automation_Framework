# traceability-manager.md

> Runs after:
>
> * Standard Mode:
> * qa-analyzer.md

> * CR Delta Mode:
> * cr-analyzer.md
> * ↓
> * qa-analyzer.md
>
> Purpose:
>
> Build the coverage architecture for test generation.
>
> Produce:
>
> * Coverage Plan
> * Traceability Matrix
> * Regression Matrix
> * Retirement Matrix
> * TC Generation Blueprint
>
> This skill does NOT generate test cases.
>
> tc-generator.md consumes the output of this skill.

---

# INPUT CONTRACT

Consumes:

* Input Detection Report
* Requirements Quality Report
* Intent Unit List
* QA Analysis Report
* QA Handoff Contract
* TC Generator Handoff Contract
* Run Context

in case of CR Delta mode

* CR Analysis Report
* CR Analyzer Handoff

Required:

```text
QA Analysis completed
```

If QA Analysis is missing:

```text
🚫 TRACEABILITY BLOCKED

Reason:
QA Analysis report required.

Cannot determine:

- risk coverage
- blocked IUs
- regression scope
- dependencies

STOP
```

---

# RESPONSIBILITY

Translate QA output into:

1. Coverage obligations
2. Traceability relationships
3. Test generation blueprint
4. Regression requirements
5. Retirement requirements

Do NOT:

* Generate test cases
* Generate automation
* Create new IUs
* Re-score risk

---

# IU ELIGIBILITY CHECK

Before planning coverage:

Classify every IU.

### GENERATE

Eligible for TC generation.

```text
Status:
ACTIVE
```

---

### BLOCKED

Not eligible.

Reasons:

```text
UNTESTABLE
IC_GAP
FULL_FAIL_QUALITY
CRITICAL_AMBIGUITY
```

---

### RETIRED

Removed by CR.

No new tests generated.

---

### REGRESSION ONLY

Existing behavior.

Requires execution only.

No new TC generation.

---

Output:

```text
IU-001 → GENERATE
IU-002 → BLOCKED
IU-003 → REGRESSION ONLY
IU-004 → RETIRED
```

---

# COVERAGE OBLIGATION RULES

Minimum coverage obligations.

| Risk | Positive | Negative | Boundary | Security | Total Minimum |
| ---- | -------- | -------- | -------- | -------- | ------------- |
| P1   | 2        | 3        | 2        | 1        | 8             |
| P2   | 1        | 2        | 1        | Optional | 4             |
| P3   | 1        | 1        | 1        | Optional | 3             |
| P4   | 1        | 1        | Optional | Optional | 2             |

---

# QUALITY MODIFIERS

Coverage may increase when quality issues exist.

| Quality Signal        | Additional Coverage |
| --------------------- | ------------------- |
| Ambiguous Requirement | +1 Negative         |
| Missing Business Rule | +1 Boundary         |
| Multiple Dependencies | +1 Integration      |
| High-Risk Side Effect | +1 Negative         |
| Security Concern      | +1 Security         |

Example:

```text
P2 Base Coverage = 4

Security concern detected
+1 Security

Final Coverage Requirement = 5
```

---

# TEST CATEGORY EXPANSION

Allowed categories:

```text
Positive
Negative
Boundary
Security
Integration
Permission
Data Integrity
Regression
```

Coverage obligations may use any category.

---

# DEPENDENCY COVERAGE RULES

Read dependency map from QA Analyzer.

If:

```text
IU-A depends on IU-B
```

Generate:

```text
Dependency Coverage Required
```

Output:

```text
IU-012

Dependency Coverage:

Requires validation of:

- IU-004 success
- IU-009 success

Failure propagation scenarios required:
- Dependency unavailable
- Dependency returns invalid state
```

---

# REGRESSION PLANNING

Consume:

```text
Regression Scope
```

from:

* QA Analyzer
* CR Analyzer

Values:

```text
FULL
TARGETED
SMOKE_ONLY
```

Output:

```text
REGRESSION MATRIX

IU-021
Scope: FULL

Required Suites:
- Payments
- Limits
- Posting

IU-034
Scope: TARGETED

Required Suites:
- Beneficiary Validation
```

---

# TEST RETIREMENT PLANNING

For DEPRECATED IUs:

Output:

```text
RETIREMENT MATRIX

IU-018

Status:
RETIRED

Reason:
Removed by CR-042

Action:
Archive related TCs

Impact:
Remove from active regression packs
```

---

📊 TRACEABILITY MATRIX
────────────────────────────────────────────────────

IU-001
Status              : GENERATE
Risk                : P1
Automation Priority : HIGH
Source              : CR-042
Derived From        : IC-CR-001

Scenario Inventory
──────────────────────────────────────────────────
SCN-001 | Positive | [business scenario]
SCN-002 | Positive | [alternate business scenario]
SCN-003 | Negative | [validation failure]
SCN-004 | Negative | [missing required data]
SCN-005 | Boundary | [lower boundary]
SCN-006 | Boundary | [upper boundary]
SCN-007 | Security | [unauthorized access]
──────────────────────────────────────────────────

TC Coverage Allocation
──────────────────────────────────────────────────
TC-001 ← SCN-001
TC-002 ← SCN-002
TC-003 ← SCN-003
TC-004 ← SCN-004
TC-005 ← SCN-005
TC-006 ← SCN-006
TC-007 ← SCN-007
──────────────────────────────────────────────────

Planned Coverage
──────────────────────────────────────────────────
Positive : 2
Negative : 2
Boundary : 2
Security : 1
──────────────────────────────────────────────────

Dependencies
──────────────────────────────────────────────────
IU-002
IU-003
──────────────────────────────────────────────────

Regression Scope
──────────────────────────────────────────────────
FULL
──────────────────────────────────────────────────

Coverage Status
──────────────────────────────────────────────────
Ready for TC Generation : YES
Blocked Issues          : NONE
──────────────────────────────────────────────────

──────────────────────────────────────────────────

---

# COVERAGE GAP DETECTION

Report:

```text
⚠ COVERAGE GAP

IU-[N]

Reason:
Requirement quality prevents generation.

Blocking Issue:
[issue]

Action Required:
[resolution]
```

---

# COVERAGE HEAT MAP

Produce summary.

```text
📈 COVERAGE HEAT MAP
────────────────────────────────────────

P1:
Coverage Planned : 100%

P2:
Coverage Planned : 100%

P3:
Coverage Planned : 100%

P4:
Coverage Planned : 100%

Blocked IUs:
[N]

Retired IUs:
[N]

Regression Only:
[N]

Generation Eligible:
[N]

────────────────────────────────────────
```

---

# TC GENERATOR HANDOFF

Mandatory output.

```text
TC_GENERATION_BLUEPRINT
────────────────────────────────────────

generate:

  IU-001
    Risk: P1
    Coverage:
      Positive: 2
      Negative: 3
      Boundary: 2
      Security: 1

  IU-002
    Risk: P2
    Coverage:
      Positive: 1
      Negative: 2
      Boundary: 1

blocked:

  IU-009
    Reason: UNTESTABLE

regression_only:

  IU-021
    Scope: FULL

retired:

  IU-034

dependencies:

  IU-001:
    - IU-002
    - IU-003

environment_requirements:

  IU-001:
    All-Systems

data_classification:

  IU-001:
    PII-Sensitive

────────────────────────────────────────
```

---

# OUTPUT FORMAT

```text
📐 TRACEABILITY REPORT
══════════════════════════════════════════

IU Eligibility

Coverage Plan

Regression Matrix

Retirement Matrix

Traceability Matrix

Coverage Gaps

Coverage Heat Map

══════════════════════════════════════════

TC_GENERATION_BLUEPRINT
```

---

# ABSOLUTE RULES

* Never generate test cases.
* Never generate automation scripts.
* Never generate new Intent Units.
* Never modify risk ratings.
* Every IU must have a traceability path.
* Every blocked IU must include a reason.
* Every retired IU must include CR justification.
* Every regression-only IU must include scope.
* Every coverage obligation must be traceable to risk level and QA analysis.
* TC Generator must be able to execute without re-analyzing requirements.
