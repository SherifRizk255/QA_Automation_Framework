# 00 - Master Workflow

> Master coordinator for the AI QA Framework.
>
> Defines workflow order, routing rules, approval gates, execution constraints, and artifact flow.
>
> This skill never performs analysis itself.
>
> It only determines:
>
> * Which skill runs next
> * Which artifacts are required
> * Which outputs are expected
> * Whether execution may continue

---

# PURPOSE

Provide a reusable end-to-end QA workflow for:

* Requirements Engineering
* Change Request Analysis
* Test Design
* Traceability
* Manual Test Generation
* Playwright Automation
* Test Execution
* Failure Analysis
* Self-Healing
* Reporting
* QA Sign-Off

Applicable to:

* Banking
* CRM
* ERP
* Healthcare
* E-Commerce
* Government Systems
* Enterprise Applications
* Any future domain

---

# WORKFLOW MODES

The framework supports two execution modes.

---

## STANDARD MODE

Used when the source contains:

* BRD
* FRD
* User Stories
* Features
* SDD
* Business Rules
* Screenshots
* Free-Text Requirements
* Test Cases sheet
* Mixed Requirement Sources


Pipeline:

Project Intake
↓

(Optional)
System Walkthrough
↓

Input Detection
↓
Intent Preview
↓
Approval Gate
↓
Normalizer
↓
Requirements Quality Checker
↓
Intent Preview Schema
↓
Orchestrator
↓
QA Analyzer
↓
Traceability Manager
↓
TC Generator
↓
Automation Implementation Agent (Optional)
↓
Test Execution Agent
↓
Failure Analysis Agent
↓
Self-Healing Agent (Optional)
↓
Final Report Agent
↓
QA Review Agent

---

## CR DELTA MODE

Used when source contains:

* Change Requests
* Enhancements
* Production Fix Requests
* Maintenance Requests
* Mixed Requirement + CR Inputs

Pipeline:

Project Intake
↓

(Optional)
System Walkthrough
↓

Input Detection
↓
Intent Preview
↓
Approval Gate
↓
Normalizer
↓
Requirements Quality Checker
↓
Intent Preview Schema
↓
Orchestrator
↓
CR Analyzer
↓
Traceability Manager
↓
TC Generator
↓
Automation Implementation Agent
↓
Test Execution Agent
↓
Failure Analysis Agent
↓
Self-Healing Agent (Optional)
↓
Final Report Agent
↓
QA Review Agent

---

# APPROVAL GATES

Intent approval is mandatory.

Accepted values:

APPROVE_INTENTS

NORMALIZE

RUN_NORMALIZER

Without approval:

STOP

Output:

Intent approval required before pipeline continuation.

---

# STAGE RESPONSIBILITIES

## Stage 01 — Project Intake

Purpose:

* Initialize project context
* Register modules
* Register environments
* Register roles
* Register data ownership

Output:

* Project Profile
* Environment Notes
* Modules Inventory

---

## Stage 02 — System Walkthrough (Optional)

Purpose:

* Explore live application
* Build navigation map
* Build screen inventory
* Discover stable locators
* Build locator inventory

Output:

* System Map
* Navigation Map
* Screen Inventory
* Locator Inventory
* Locator Repository
* Blocker Inventory
* Page Object Recommendations

---

## Stage 03 — Input Detection

Purpose:

* Detect artifact types
* Extract Intent Candidates
* Detect domain
* Detect actors
* Detect actions
* Detect permissions
* Detect business rules

Output:

* Detection Report
* Intent Candidate Map

---

## Stage 04 — Intent Preview

Purpose:

* Present extracted Intent Candidates
* Present detected behavior model
* Await user approval

Output:

* Approved Intent Map

---

## Stage 05 — Normalizer

Purpose:

* Convert approved Intent Candidates into Intent Units
* Create canonical behavior model

Output:

* Intent Unit List
* Intent Unit Map

---

## Stage 06 — Requirements Quality Checker

Purpose:

* Detect ambiguity
* Detect incompleteness
* Detect missing business rules
* Detect untestable requirements

Output:

* Requirements Quality Report

Status:

PASS

PARTIAL_PASS

FULL_FAIL

---

## Stage 07 — Intent Unit Schema

Purpose:

* Validate normalized Intent Units
* Validate structure consistency
* Validate IU completeness
* Validate traceability integrity

Output:

* Intent Schema Validation Report

---

## Stage 08 — Orchestrator

Purpose:

* Select execution mode
* Build run context
* Route downstream skills

Output:

* Run Context

---

## Stage 09A — QA Analyzer

Purpose:

* Risk scoring
* Dependency mapping
* Gap analysis
* Coverage intent identification
* Domain rule extraction
* Regression assessment

Output:

* QA Analysis Report

---

## Stage 09B — CR Analyzer

Purpose:

* Extract CR delta
* Determine impact
* Determine regression scope
* Identify retired behavior
* Identify superseded behavior

Output:

* CR Analysis Report

---

## Stage 10 — Traceability Manager

Purpose:

* Build canonical traceability matrix
* Build scenario inventory
* Allocate TC coverage
* Build TC blueprint

Output:

* Traceability Matrix
* Coverage Plan
* Scenario Inventory
* TC Blueprint
* Test Lifecycle Report

---

## Stage 11 — TC Generator

Purpose:

* Generate detailed manual test cases

Output:

* Manual Test Case Set

---

## Stage 12 — Automation Implementation Agent

Purpose:

* Convert approved test cases into Playwright TypeScript automation

Output:

* Page Objects
* Fixtures
* Utilities
* Automated Test Suite
* Automation Coverage Report

---

## Stage 12.5 — Execution Readiness Gate

Purpose:

* Validate:
 1. Automation generated successfully
 2. Locator inventory exists
 3. Traceability complete
 4. Required environment available
 5. Test data available
 6. Test Lifecycle Report exists
 7. Setup requirements satisfied
 8. Teardown requirements defined
 9. Test isolation requirements satisfied

Output:

 * Execution Readiness Report

Status:

* READY
BLOCKED

---

## Stage 13 — Test Execution Agent

Purpose:

* Execute Playwright suites
* Collect evidence

Output:

* Execution Results
* Screenshots
* Videos
* Traces
* Raw Execution Report

---

## Stage 14 — Failure Analysis Agent

Purpose:

* Analyze failures
* Determine root cause
* Classify failures

Output:

* Failure Analysis Report
* Recovery Recommendations
* Defect Candidates
* Self-Healing Candidates

---

## Stage 14.5 — Recovery Decision Gate

Purpose:

 * Determine:
  1. Self-Healable
  2. Healing Confidence
  3. Recovery Strategy

Output:
* Recovery Decision

Values:
* AUTO_HEAL

MANUAL_REVIEW
* DEFECT_ESCALATION

---

## Stage 15 — Self-Healing Agent

Purpose:

* Repair automation failures only

Never modify:

* Requirements
* Business Logic
* Test Design

Output:

* Self-Healing Report
* Updated Automation Artifacts
* Healing Validation Results
* Regression Verification Results

---

## Stage 16 — Final Report Agent

Purpose:

* Consolidate execution results
* Consolidate defect findings
* Consolidate automation findings

Output:

* Execution Summary
* Defect Summary
* Automation Health Summary
* Coverage Summary
* QA Summary

---

## Stage 17 — QA Review Agent

Purpose:

* Review overall QA readiness
* Review coverage quality
* Review execution quality
* Provide approval recommendation

Output:

* QA Sign-Off Report

---

# EXECUTION RULES

Rule 1

Never skip Requirements Quality Checker.

---

Rule 2

Never run Normalizer without Intent Approval.

---

Rule 3

Never run Intent Preview Schema before Requirements Quality Checker.

---

Rule 4

Never run QA Analyzer or CR Analyzer before Orchestrator.

---

Rule 5

Never run Traceability Manager without Analyzer output.

---

Rule 6

Never run TC Generator without Traceability Matrix.

---

Rule 7

Never run Automation Implementation without approved test cases.

---

Rule 8

Never run Test Execution Agent without:

- Test Lifecycle Report
- Setup requirements
- Teardown requirements

Execution lifecycle must be defined before execution begins.

---

Rule 9

Never execute Self-Healing before Failure Analysis.

---

Rule 10

CR Analyzer must run whenever CR Delta Mode is selected.

---

Rule 11

Never run Self-Healing when:

Self-Healable = NO

---

Rule 12

Never apply automatic healing when:

Healing Confidence = LOW

---

Rule 13

Every locator recovery must pass:

count() == 1
isVisible()
isEnabled()
Actionable

before automation is updated.

---

Rule 14

Self-Healing must not:

- Remove lifecycle-required setup
- Remove lifecycle-required teardown
- Introduce cross-test dependencies
- Violate test isolation rules

---

Rule 15

Recovery recommendations must originate from Failure Analysis.

---

# STORAGE MODEL

Framework Skills:
```
docs/ai-workflow/
```
Project Artifacts:
```
docs/projects/<project-name>/
```
Requirements:
```
docs/requirements/
```
Analysis:
```
docs/analysis/
```
Traceability:
```
docs/traceability/
```
Test Design:
```
docs/test-design/
```

Artifacts:
- traceability-matrix.md
- tc-blueprint.md
- test-lifecycle.md
- automation-coverage.md
- automation-traceability.md

Automation:
```
tests/
pages/
fixtures/
utils/
```
Execution Results:
```
reports/
test-results/
playwright-report/
```
Final Reports:
```
docs/reports/
```
---

# Artifact Flow

System Walkthrough
↓
Locator Inventory

Traceability Manager
↓
TC Blueprint
↓
Test Lifecycle Report

Automation Implementation
↓
Lifecycle-Aware Automation

Execution
↓
Lifecycle Execution Results

Failure Analysis
↓
Lifecycle Impact Assessment

Self-Healing
↓
Lifecycle Validation

Final Report
↓
Lifecycle Compliance Summary


---

# MASTER WORKFLOW OUTPUT

Before any stage executes:

⚙️ MASTER WORKFLOW CONTEXT
────────────────────────────────────────

Mode:
[Standard | CR Delta]

Current Stage:
[stage]

Previous Stage Complete:
[Yes | No]

Approval Status:
[Approved | Pending]

Lifecycle Status:
[Available | Missing]

Lifecycle Compliance:
[Pass | Fail | N/A]

Next Skill:
[skill name]

Expected Output:
[artifact]

────────────────────────────────────────

Only then may the selected skill execute.
