# intent-preview.md

> Pipeline Step 2
>
> Runs only after Input Detector approval.
>
> Purpose:
>
> Produce a preliminary map of Candidate Intents (ICs) before formal Intent Unit generation.
>
> This step exists to prevent incorrect interpretation of requirements before normalization begins.

---

# Responsibility

Transform the approved artifact into a preliminary list of Candidate Intents.

Candidate Intents are NOT Intent Units.

Candidate Intents are the explicit behaviors detected in the source artifact.

Potential Behaviors are hypotheses about missing requirements and must be confirmed before normalization.

This skill:

* Does not generate Intent Units
* Does not generate test cases
* Does not perform risk analysis
* Does not perform coverage analysis
* Does not generate automation scripts
* Does not invent business rules

---

# Pipeline Gate

This skill may execute ONLY after:

APPROVE_DETECTION

has been received.

If approval has not been received:

STOP.

Request approval.

---

# Input Contract

Consumes:

* Input Detection Report
* Artifact Inventory
* Domain Context
* Original Artifact

Produced by:

input-detector.md

This skill must trust the detector output.

This skill must never reclassify the artifact.

---

# Core Objective

Answer one question:

"What explicit behaviors exist in this artifact?"

---

# Intent Candidate Rules

Intent Candidates represent ONLY explicit behaviors found in the source.

Create an IC only when the source explicitly describes:

* actor
* action
* outcome
* business rule
* validation rule
* requirement
* acceptance criterion
* state transition

---

# Never Create ICs From

* implied UI steps
* assumed workflows
* common industry practices
* inferred validations
* inferred integrations
* inferred notifications
* inferred confirmations
* inferred error handling
* inferred audit logging
* inferred security controls

Those belong in Potential Behaviors.

---

# Traceability ID Rules

Format:

IC-[SOURCE]-[NUMBER]

Examples:

IC-US-001
IC-BRD-001
IC-FRD-001
IC-CR-001
IC-SDD-001
IC-FL-001
IC-VIS-001
IC-TC-001

Source Codes:

US   = User Story
BRD  = Business Requirements Document
FRD  = Functional Requirements Document
CR   = Change Request
SDD  = System Design Document
FL   = Feature List
FT   = Free Text
VIS  = Visual Input
TC   = Existing Test Cases

---

# Intent Candidate Structure

IC-[SOURCE]-[NUMBER]

Actor:
[actor]

Action:
[action]

Outcome:
[explicitly stated outcome only]

Evidence:
[exact source reference]

Confidence:
High | Medium

Source:
[artifact reference]

Notes:
[ambiguity if applicable]

---

# Confidence Rules

High

Behavior is explicitly stated.

Medium

Behavior is partially stated but still directly supported by source wording.

Low confidence ICs are not allowed.

Low confidence items must be moved to Potential Behaviors.

---

# Evidence Requirement

Every IC must contain traceable evidence.

Examples:

Evidence:
"The system shall validate sufficient balance"

Evidence:
Section 4.2 AC-3

Evidence:
Screenshot element [Amount Field]

No IC may exist without evidence.

---

# Potential Behaviors

Potential Behaviors are hypotheses.

They are NOT requirements.

They are NOT Intent Candidates.

They exist to expose likely missing requirements.

Format:

PB-[NUMBER]

Hypothesis:
[behavior]

Reason:
[why it appears likely]

Evidence:
[source reference]

Status:
Requires Confirmation

---

# Extraction Strategy By Input Type

## BRD / FRD

Extract:

* functional requirements
* acceptance criteria
* validations
* workflows
* state transitions

One IC = one independently testable behavior.

---

## User Story

Extract:

* role
* action
* business value

Convert each acceptance criterion into a separate IC.

If acceptance criteria are missing:

Create ICs only from explicit story content.

Place missing expected behaviors in Potential Behaviors.

---

## Change Request

Extract only:

* changed behavior
* new behavior
* removed behavior
* modified validation
* impacted capability

Do not reconstruct the entire feature.

Scope is limited to the CR.

---

## Feature List

Treat each feature as a candidate behavior.

If details are missing:

Flag:

⚠ Acceptance Criteria Not Provided

Do not invent behavior details.

---

## SDD

Extract:

* APIs
* integrations
* service interactions
* events
* state transitions

Behaviors should describe technical interactions.

---

## Existing Test Cases

Extract:

* covered behaviors
* validated behaviors
* apparent gaps

Purpose:

Establish existing coverage before normalization.

---

## Screenshot

Extract only visible UI behaviors.

Examples:

* User enters amount
* User selects account
* User clicks submit
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

Convert explicit behaviors into ICs.

---

## Mixed Inputs

Priority:

1. Change Request
2. BRD / FRD
3. User Story
4. Free Text
5. Screenshot

Each IC must identify its source.

---

# Preview Output Contract

This skill may output ONLY:

1. Intent Candidates
2. Potential Behaviors
3. Ambiguities
4. Missing Information
5. Unknowns
6. Intent Summary
7. Approval Request

This skill must NEVER output:

* Intent Units
* Risk Scores
* Coverage Analysis
* Gap Analysis
* Test Cases
* Automation Code
* Bug Reports
* Traceability Matrix

Those belong to downstream skills.

---

# Required Output Format

📋 PRELIMINARY INTENT CANDIDATES

────────────────────────────────────────────

IC-BRD-001

Actor:
[actor]

Action:
[action]

Outcome:
[outcome]

Evidence:
[evidence]

Confidence:
High

Source:
[source]

---

IC-BRD-002

...

────────────────────────────────────────────

Summary

Total Intent Candidates:
[N]

High Confidence:
[N]

Medium Confidence:
[N]

---

Potential Behaviors

PB-001

Hypothesis:
[hypothesis]

Reason:
[reason]

Evidence:
[evidence]

Status:
Requires Confirmation

---

Ambiguities Found:

⚠ [ambiguity]

---

Missing Information:

❌ [missing item]

---

What I Cannot Determine:

* [item]
* [item]

---

Confirmation Required

APPROVE_INTENTS
MODIFY_INTENTS
ADD_INTENTS

No normalization may occur yet.

Normalization requires:

RUN_NORMALIZER

---

# Pipeline Gate

After generating the Intent Preview:

STOP.

Do not execute:

* normalizer.md
* qa-analyzer.md
* traceability-manager.md
* tc-generator.md
* reporter.md

until the user explicitly approves:

APPROVE_INTENTS

Any other response is clarification input.

---

# Absolute Rules

* Never generate Intent Units.
* Never generate test cases.
* Never assign risk.
* Never assign severity.
* Never generate automation.
* Never invent business rules.
* Every IC must contain evidence.
* Every IC must contain a source.
* Flag uncertainty explicitly.
* Preserve traceability.
