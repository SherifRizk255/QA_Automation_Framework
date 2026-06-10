# intent-preview.md

> Step 2 of the pipeline.
> Runs immediately after input-detector.md.
>
> Purpose:
> Produce a preliminary map of testable Candidate Intents before formal Intent Unit generation.
>
> This step exists to prevent incorrect interpretation of requirements before they are normalized and analyzed.

---

# Responsibility

Transform the detected artifact into a preliminary list of candidate intents.

These behaviors are not yet Intent Units.

They are hypotheses about what the requirement appears to describe.

The user must have the opportunity to confirm, correct, remove, or add behaviors before normalization proceeds.

This skill never generates test cases.

This skill never performs risk analysis.

This skill never invents business rules.

---

## Mandatory Output Order

The detector must always execute in this exact sequence:

Step 1:
Produce the INPUT DETECTION REPORT.

Step 2:
Produce the PRELIMINARY INTENT CANDIDATES section.

Step 3:
Produce the POTENTIAL BEHAVIORS section.

Step 4:
Produce the AMBIGUITIES, MISSING INFORMATION, and UNKNOWNS sections.

Step 5:
Request confirmation.

Never skip the INPUT DETECTION REPORT.

Never start with Intent Candidates.

Intent Candidates are not allowed to appear until the detection report has been completed.

---

# Input

Consumes:

* Input Detection Report
* Original artifact(s)
* Domain Context (if available)

Supported sources:

* BRD
* FRD
* User Story
* Change Request
* Feature List
* SDD
* Existing Test Case Sheet
* Screenshot
* Free Text
* Mixed Inputs

---

# Core Objective

Answer one question:

"What behaviors appear to exist in this input?"

---

# Behavior Extraction Rules

Each candidate behavior should contain:

```text
Behavior ID
Actor
Action
Expected Outcome
Confidence
Source Reference
```

Do not attempt to determine:

* Risk
* Automation suitability
* Test coverage
* Priority
* Requirement quality

Those belong to later skills.

---

# Extraction Strategy by Input Type

## BRD / FRD

Extract:

* Functional requirements
* Acceptance criteria
* Validation rules
* Workflow steps
* State transitions

Each behavior should correspond to one independently testable capability.

---

## User Story

Extract:

```text
Role
Action
Business Value
```

Convert acceptance criteria into separate behaviors.

Example:

As a customer
I want to pay my credit card
So that I can avoid penalties

Behaviors:

B-001 Pay own credit card
B-002 Validate sufficient balance
B-003 Generate payment confirmation

---

## Change Request

Extract:

### Existing Behavior

### New Behavior

### Changed Validation

### Impacted Capability

Only extract behaviors affected by the CR.

Do not reconstruct the entire system.

---

## Feature List

Treat each feature as a candidate behavior.

If behavior details are missing:

Flag:

```text
⚠ Acceptance criteria not provided
```

Do not invent behavior details.

---

## SDD

Extract:

* APIs
* Integrations
* Data flows
* State changes
* System events

Behaviors should describe technical interactions.

Example:

```text
System sends payment request to Core Banking API
```

---

## Existing Test Cases

Extract:

* Covered behavior
* Validation behavior
* Missing behavior

Purpose:

Identify what already exists before generating new coverage.

---

## Screenshot

Extract visible UI behaviors only.

Examples:

* User enters amount
* User clicks submit
* User selects account
* User views validation message

Never infer hidden business rules.

---

## Free Text

Look for:

* shall
* must
* should
* can
* able to
* if
* when
* then
* validation

Convert each identified behavior into a candidate behavior.

---

# Mixed Input Rules

When multiple sources are provided:

Priority:

1. Change Request
2. BRD / FRD
3. User Story
4. Free Text
5. Screenshot

Each behavior must indicate which source produced it.

Example:

```text
Source:
CR-042
Screenshot-01
```

---

# Confidence Scoring

| Confidence | Meaning                        |
| ---------- | ------------------------------ |
| High       | Explicitly stated              |
| Medium     | Clearly implied                |
| Low        | Likely but not fully supported |

Low confidence behaviors must be flagged.

---

# Coverage Categories Detected

Inputs:
✓ Source Account
✓ Amount
✓ Payment Type
✓ Currency

Validations:
✓ Balance Validation
✓ Hold Amount Validation

Business Actions:
⚠ Payment Execution (implied)

Outputs:
⚠ Confirmation (implied)

Integrations:
❌ Not specified

Permissions:
❌ Not specified

Error Handling:
❌ Not specified

- - -

# Required Output

```text
📋 PRELIMINARY INTENT CANDIDATES
────────────────────────────────────────────

IC-US-001
Actor      : [actor]
Action     : [action]
Outcome    : [expected outcome]
Evidence   : [evidence]
Confidence : High
Source     : [artifact reference]

IC-002
...

────────────────────────────────────────────

Summary

Total Behaviors : [N]

High Confidence : [N]
Medium          : [N]
Low             : [N]

Ambiguities Found:

⚠ [ambiguity]

Missing Information:

❌ [missing item]

Potential Missing Behaviors:

?
[behavior that appears likely but is not explicitly stated]

What I Cannot Determine:

- [item]
- [item]

Confirmation Required:

Do these behaviors accurately represent the requirement?

Reply with:

APPROVED

or provide corrections before normalization proceeds.
```

---

# Absolute Rules

* Never generate test cases.
* Never assign risk.
* Never assign severity.
* Never create automation scripts.
* Never invent business rules.
* Never proceed to normalization without presenting the candidate intent map.
* Every behavior must have a source reference.
* Flag uncertainty explicitly.

