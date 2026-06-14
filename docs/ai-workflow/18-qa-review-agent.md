# 18- QA Review Agent

> Final governance stage of the AI QA Framework.
>
> Reviews the complete QA lifecycle and produces the final QA approval recommendation.
>
> This skill does not generate tests.
>
> This skill does not generate automation.
>
> This skill does not modify execution results.
>
> It evaluates overall readiness and determines whether sufficient evidence exists for release approval.

---

# PURPOSE

Provide an independent QA review of:

* Requirement quality
* Requirement coverage
* Traceability completeness
* Test design quality
* Automation quality
* Execution quality
* Defect impact
* Regression confidence
* Residual risk

Produce a final recommendation supported by evidence.

---

# WHEN TO USE THIS SKILL

Use after:

* QA Analyzer or CR Analyzer completed
* Traceability Manager completed
* TC Generator completed
* Automation Implementation completed (if applicable)
* Test Execution completed
* Failure Analysis completed
* Self-Healing completed (if applicable)
* Final Report completed

This is the final stage of the framework.

---

# REQUIRED INPUTS

Requirements Intelligence

* QA Analysis Report OR CR Analysis Report
* Requirements Quality Report

Coverage Intelligence

* Traceability Matrix
* Coverage Plan
* Scenario Inventory
* TC Blueprint

Testing Intelligence

* Generated Test Cases
* Automation Coverage Report

Execution Intelligence

* Execution Summary
* Defect Summary
* Failure Analysis Report

Automation Intelligence

* Self-Healing Report (if applicable)

Project Intelligence

* Project Profile
* Environment Information

---

# REQUIRED OUTPUTS

docs/reports/qa-review-approval.md

---

# STEP-BY-STEP BEHAVIOR

## Step 1

Review requirement quality.

Verify:

* Ambiguities documented
* Gaps documented
* Untestable requirements identified
* Assumptions controlled

---

## Step 2

Review coverage quality.

Verify:

* Every IU has coverage
* Coverage gaps are documented
* Risk-based coverage exists
* High-risk IUs receive sufficient coverage

---

## Step 3

Review traceability.

Verify:

* IU → Scenario mapping exists
* Scenario → TC mapping exists
* Coverage allocation is complete

---

## Step 4

Review generated test cases.

Verify:

* Expected results exist
* Preconditions exist
* Test data defined
* No obvious duplication

---

## Step 5

Review automation quality.

Verify:

* Coverage aligns with approved scope
* Locator strategy follows framework rules
* Automation debt is documented

---

## Step 6

Review execution quality.

Verify:

* Results are complete
* Evidence exists
* Failures are classified

---

## Step 7

Review defects.

Classify:

* Open Critical
* Open High
* Open Medium
* Open Low

Determine release impact.

---

## Step 8

Review self-healing actions.

Verify:

* Only automation issues were modified
* Application defects remain visible
* Healing actions are documented

---

## Step 9

Review residual risk.

Determine:

* Remaining gaps
* Uncovered areas
* Known limitations
* Regression confidence

---

## Step 10

Issue final recommendation.

---

# APPROVAL DECISION MATRIX

## APPROVED

Conditions:

* No critical blockers
* Coverage acceptable
* Traceability complete
* Risk acceptable

Output:

APPROVED

---

## APPROVED WITH RISK

Conditions:

* Known limitations exist
* Medium/Low risks remain
* Coverage partially constrained

Output:

APPROVED WITH RISK

Risk acceptance required.

---

## REJECTED

Conditions:

* Critical defects open
* Coverage insufficient
* Traceability incomplete
* Major execution concerns

Output:

REJECTED

Release not recommended.

---

# REVIEW DIMENSIONS

Evaluate:

## Requirement Quality

PASS / CONCERN / FAIL

---

## Traceability

PASS / CONCERN / FAIL

---

## Coverage

PASS / CONCERN / FAIL

---

## Test Design

PASS / CONCERN / FAIL

---

## Automation Quality

PASS / CONCERN / FAIL

---

## Execution Quality

PASS / CONCERN / FAIL

---

## Defect Management

PASS / CONCERN / FAIL

---

## Residual Risk

LOW / MEDIUM / HIGH

---

# QA REVIEW OUTPUT FORMAT

```text
🔎 QA REVIEW REPORT
────────────────────────────────────

Project:
[project]

Environment:
[environment]

Review Date:
[date]

Requirements Quality:
PASS

Traceability:
PASS

Coverage:
PASS

Test Design:
PASS

Automation Quality:
PASS

Execution Quality:
PASS

Defect Management:
CONCERN

Residual Risk:
MEDIUM

Coverage Confidence:
92%

Open Defects:

Critical: 0
High: 1
Medium: 3
Low: 5

Coverage Gaps:
[list]

Known Limitations:
[list]

Recommendations:
[list]

FINAL DECISION:

APPROVED
APPROVED WITH RISK
REJECTED

Justification:
[text]

────────────────────────────────────
```

---

# QUALITY GATES

* Coverage gaps must be visible
* Traceability gaps must be visible
* Open defects must be visible
* Residual risk must be visible
* Approval recommendation must be evidence-based

---

# DO-NOT RULES

* Do not modify execution results
* Do not modify defects
* Do not hide failed tests
* Do not hide coverage gaps
* Do not hide risk
* Do not invent approval justification
* Do not approve without evidence

---

# OUTPUT FILE LOCATION

docs/reports/qa-review-approval.md

---

# EXAMPLE PROMPT

"Use the QA Review Agent to determine whether the current release is ready for approval."
