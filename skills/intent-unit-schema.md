# Intent Unit Schema — Canonical QA Contract

> Every skill in this system reads from and writes to Intent Units (IUs).
> Intent Units are the universal intermediate representation used to normalize all requirement sources into independently testable behaviors.
>
> This schema is the single source of truth for the QA pipeline.

---

# What is an Intent Unit?

An Intent Unit (IU) is the smallest independently testable behavior extracted from an input artifact.

Regardless of whether the source is:

* BRD
* FRD
* Change Request (CR)
* User Story
* Feature List
* SDD
* Existing Test Cases
* Free Text
* Screenshot
* URL Exploration

the behavior must ultimately be represented as one or more Intent Units.

---
## Relationship to Intent Candidates

Intent Units are generated only after:

1. Input detection
2. Intent Candidate extraction
3. User confirmation
4. Normalization

Intent Candidates (ICs) are temporary structures produced by input-detector.md.

Intent Units (IUs) are the canonical testability contract consumed by all downstream skills.

---

# Intent Unit Structure

```text
IU-[SOURCE]-[NUMBER]
──────────────────────────────────────────

id            : unique IU identifier

actor         : who performs the action
action        : what is performed
condition     : under what circumstances
outcome        : expected result

iu_type       : Functional
              | Validation
              | Security
              | Permission
              | API
              | Integration
              | BusinessRule
              | Reporting
              | UI

source        : original location reference

source_type   : BRD
              | FRD
              | CR
              | UserStory
              | FeatureList
              | SDD
              | SmokeSheet
              | FreeText
              | Visual
              | URL

parent_ref    : AC / Requirement / Story / CR identifier

status        : New
              | Existing
              | Modified
              | Deprecated

confidence    : High
              | Medium
              | Low

domain_rules  : extracted constraints
              validations
              limits
              permissions
              business states

risk          : P1
              | P2
              | P3
              | P4

automate      : Yes
              | Partial
              | No

notes         : assumptions
              ambiguities
              missing information
              analyst observations

──────────────────────────────────────────
```

---

# IU Type Definitions

## Functional

Primary business behavior.

Examples:

* Create transfer
* Add beneficiary
* Create CRM case

---

## Validation

Input and business validation rules.

Examples:

* Amount cannot exceed limit
* Required fields
* Invalid format handling

---

## Security

Authentication, authorization, compliance, fraud controls.

Examples:

* Unauthorized access blocked
* Session timeout
* Permission restrictions

---

## Permission

Role-specific access behavior.

Examples:

* CSR may edit customer profile
* Supervisor may approve requests

---

## API

Service contract behavior.

Examples:

* API request validation
* Response structure
* Status code handling

---

## Integration

Interactions between systems.

Examples:

* CRM → Core Banking
* CRM → Middleware
* Portal → API Gateway

---

## BusinessRule

Policy-driven behavior.

Examples:

* Daily transfer limit
* Eligibility rules
* STP qualification

---

## Reporting

Reports, dashboards, exports, statements.

Examples:

* Generate statement
* Export CSV

---

## UI

Pure presentation behavior.

Examples:

* Tooltip visibility
* Button enablement
* Grid sorting

---

# Risk Classification Rules

Apply the highest applicable level.

| Level       | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| P1 Critical | Authentication, authorization, payments, financial impact, compliance, data loss, security |
| P2 High     | Core journeys, major validations, critical integrations, workflow transitions              |
| P3 Medium   | Secondary flows, reporting, admin functions, edge behavior                                 |
| P4 Low      | Cosmetic, informational, rarely-used features                                              |

---

# Automation Recommendation Rules

| Value   | Meaning                                                   |
| ------- | --------------------------------------------------------- |
| Yes     | Stable, deterministic, repeatable                         |
| Partial | Core automation possible, manual verification required    |
| No      | Exploratory, subjective, visual-only, one-time validation |

---

# Confidence Rules

## High

Behavior explicitly stated.

Example:

"Amount must not exceed 100,000 EGP."

---

## Medium

Behavior inferred from surrounding context.

Example:

Transfer flow implies balance validation.

---

## Low

Behavior partially specified or ambiguous.

Example:

"The system should validate transfers."

No validation details provided.

Low confidence IUs should be flagged for clarification.

---

# Status Rules

## New

Behavior introduced for the first time.

---

## Existing

Behavior already exists and remains unchanged.

---

## Modified

Existing behavior changed by CR or enhancement.

---

## Deprecated

Behavior removed, replaced, or retired.

---

# Traceability Requirements

Every IU must maintain traceability back to its origin.

Required chain:

Requirement
↓
Intent Unit
↓
Test Case
↓
Automation Script
↓
Execution Result

Example:

BRD-4.2-AC3
↓
IU-BRD-003
↓
TC-045
↓
PW-045
↓
Execution Run #17

---

# Example Intent Unit

```text
IU-CR-001

actor         : authenticated customer
action        : submit transfer amount
condition     : transfer amount entered
outcome        : amount must be a multiple of 100

iu_type       : Validation

source        : CR-042 Section 2
source_type   : CR

parent_ref    : CR-042

status        : Modified

confidence    : High

domain_rules  :
- Amount multiple of 100
- Existing validation replaced

risk          : P2

automate      : Yes

notes         :
Regression scope includes existing transfer validation suite
```

---

# Standard IU Map Output

```text
📋 INTENT UNIT MAP
────────────────────────────────────────────

IU-CR-001 | Validation | Authenticated user submits transfer amount | Risk: P2

IU-BRD-004 | Security | Unauthenticated user accesses protected page | Risk: P1

IU-US-002 | Functional | Customer adds beneficiary | Risk: P2

────────────────────────────────────────────

Total IUs : 3

P1 : 1
P2 : 2
P3 : 0
P4 : 0

High Confidence   : 3
Medium Confidence : 0
Low Confidence    : 0

Flagged :
0 ambiguous
0 untestable
0 missing information
```
