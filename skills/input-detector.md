# Input Detector Skill

> Pipeline Step 1
>
> Mandatory entry point for every workflow.
>
> No QA analysis, gap analysis, test generation, automation generation, risk scoring, or CR analysis may begin until input detection is complete and confirmed.

---

# Purpose

Determine:

* What artifact(s) were provided
* How confident the classification is
* What information is available
* What information is missing
* Which downstream mode should be activated
* Which artifacts will participate in traceability

---

# Core Principle

Never assume.

Every input must first be classified and normalized into a known artifact type before any testing activity begins.

If confidence is below 75%, ask a clarifying question before proceeding.

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

# Artifact Inventory

Create an inventory of every artifact received.

Assign permanent IDs.

Format:

ART-001
ART-002
ART-003

For each artifact capture:

* Artifact ID
* Artifact Type
* Source Name
* Confidence

Example:

ART-001 | BRD | BRD_V5.pdf | 98%
ART-002 | Screenshot | PaymentScreen.png | 100%
ART-003 | CR | CR-042.docx | 96%

These IDs become the root of traceability.

---

# Detection Rules

## Change Request

Signals:

* Change Request
* CR-
* Existing Behavior
* Current Behavior
* New Behavior
* Change Impact
* From X to Y
* Add Validation
* Modify
* Remove
* Enhancement

Detected Type:

Change Request

Mode:

CR Delta Mode

---

## User Story

Signals:

* As a
* I want
* So that
* Given
* When
* Then
* Acceptance Criteria

Detected Type:

User Story

Mode:

Story Mode

---

## BRD / FRD

Signals:

* Scope
* Objective
* Business Rules
* Functional Requirements
* Non-Functional Requirements
* The System Shall
* Must
* Requirement IDs

Detected Type:

BRD/FRD

Mode:

Full Requirements Mode

---

## SDD

Signals:

* Architecture
* Component Diagram
* Sequence Diagram
* Data Flow
* Service
* Endpoint
* API
* Integration
* Queue
* Database

Detected Type:

SDD

Mode:

Technical Mode

---

## Existing Test Case Sheet

Signals:

* TC ID
* Steps
* Expected Result
* Actual Result
* Status
* Pass
* Fail

Detected Type:

Baseline Test Asset

Mode:

Baseline Mode

---

## Feature List

Signals:

* Bullet list of features
* No acceptance criteria
* No validations

Detected Type:

Feature List

Mode:

Feature Expansion Mode

---

## Free Text

Signals:

* System should
* User must
* Validation requires
* If X then Y

Detected Type:

Free Text

Mode:

Extraction Mode

---

## Visual Input

Signals:

* Screenshot only
* UI image
* Mockup
* Screen capture

Detected Type:

Visual Input

Mode:

Visual Inference Mode

---

## Mixed Input

If multiple artifact types are detected simultaneously.

Detected Type:

Mixed

Mode:

Merge Mode

---

# Detection Confidence

Assign confidence.

95-100%
Clear match

75-94%
Strong match

50-74%
Possible match

Below 50%
Ambiguous

Output:

Detection Confidence: 93%

Candidate Types:

1. Change Request (93%)
2. User Story (71%)

Selected Type:

Change Request

---

# Information Sufficiency Check

Evaluate whether enough information exists to proceed.

Levels:

HIGH
MEDIUM
LOW

HIGH

Requirements are sufficiently detailed.

MEDIUM

Proceed but flag assumptions.

LOW

Clarification required.

Output:

Information Sufficiency: LOW

Missing:

* Acceptance Criteria
* Business Rules
* Error Handling Rules

---

# Domain Context Extraction

Extract:

domain_context

Examples:

* Retail Banking
* Corporate Banking
* CRM
* Insurance
* ERP
* E-Commerce

system_type

Examples:

* Web
* Mobile
* API
* CRM
* Desktop
* Hybrid

tech_hints

Examples:

* Dynamics CRM
* Playwright
* React
* Java
* .NET
* Oracle

Never infer domain context without evidence.

---

# CRM Detection Extension

Look specifically for:

* Dynamics
* CRM
* Entity
* Form
* View
* Dashboard
* Lead
* Opportunity
* Case
* Queue
* Workflow
* Business Rule
* Plugin
* Ribbon
* Subgrid
* Lookup Field

If detected:

Domain Context = CRM

Subdomain = Dynamics CRM

---

# SDD Extraction Extension

When SDD is detected extract:

Systems
Interfaces
APIs
Endpoints
Queues
Events
Databases
Authentication Methods
Error Handling
Integration Boundaries

Output:

Integration Points Found:

* CRM → CBS
* Portal → Payment Gateway

Endpoints Found:

* POST /payments
* GET /accounts

---

# Screenshot Analysis Extension

Identify:

Forms
Tabs
Sections
Buttons
Dropdowns
Tables
Modals
Error Messages
Lookup Fields
Subgrids
Ribbon Actions
Business Process Flow Stages

Output visible UI inventory.

Do not infer business rules from screenshots.

Only infer UI structure.

---

# Merge Priority Rule

If multiple artifacts exist:

Priority Order:

1. Change Request
2. BRD / FRD
3. User Story
4. Free Text
5. Screenshot

Rules:

CR defines scope.

Requirements define business rules.

Free text fills gaps.

Screenshots provide UI inventory.

Every downstream IU must retain source references.

---

# Handoff Contract

Pass the following to downstream skills:

detected_type
confidence
artifact_inventory
domain_context
system_type
sections_found
ambiguities
information_sufficiency

Example:

{
"detected_type": "CR",
"confidence": 96,
"domain_context": "Retail Banking",
"system_type": "CRM",
"artifacts": ["ART-001","ART-002"],
"ambiguities": ["Transaction limit missing"],
"information_sufficiency": "MEDIUM"
}

---
## Intent Candidate Creation Rules

Intent Candidates (ICs) represent only behaviors that are explicitly stated in the source artifact.

Create an IC only when the artifact directly describes:

- an actor
- an action
- an intended outcome
- a business rule
- a validation rule
- a stated requirement
- an acceptance criterion

Do NOT create Intent Candidates from:

- implied UI steps
- assumed workflow actions
- common industry practices
- inferred validations
- inferred business rules
- inferred integrations
- inferred success messages
- inferred confirmations
- inferred notifications

If a behavior is not explicitly stated, place it in:

Potential Behaviors

and mark it as:

Status : Requires Confirmation

The detector's responsibility is extraction, not interpretation.

---
## Traceability ID Rules

Every extracted Intent Candidate must receive a stable identifier.

Source Types:

US  = User Story
BRD = Business Requirements Document
FRD = Functional Requirements Document
CR  = Change Request
SDD = System Design Document
FL  = Feature List
FT  = Free Text
VIS = Visual Input
TC  = Existing Test Cases

Format:

IC-[SOURCE]-[NUMBER]

Examples:

IC-US-001
IC-BRD-001
IC-CR-001
IC-SDD-001
IC-FL-001
IC-VIS-001

---

### Intent Candidate Structure

IC-[SOURCE]-[NUMBER]

Actor:
[actor]

Action:
[action]

Outcome:
[explicitly stated outcome only]

Evidence:

Confidence:
High | Medium | Low

Source:
[artifact reference]

Notes:
[ambiguity if any]

---

### Explicit Behavior Rule

Create Intent Candidates only from statements explicitly present in the source.

Example:

Requirement:
"System validates sufficient balance before payment execution."

Valid IC:

IC-001
Actor: System
Action: Validate available balance
Outcome: Validation performed before payment execution

Invalid IC:

System rejects payment
System shows error message
System blocks transaction

These are assumptions and must not become Intent Candidates.

---

## Potential Behaviors

Potential Behaviors are hypotheses.

They are NOT requirements.

They are NOT Intent Candidates.

They exist to identify likely missing requirements that should be confirmed.

Format:

PB-[NUMBER]

Hypothesis :
Reason :
Evidence :
Status : Requires Confirmation

--- 
## Evidence Requirement

Every Intent Candidate must contain the exact evidence that produced it.

Format:

Evidence : "[exact text]"

or

Evidence : Section 4.2 AC-3

or

Evidence : Screenshot element [Amount Field]

The evidence must be traceable to the source artifact.

No Intent Candidate may exist without evidence.

---

📊 READINESS ASSESSMENT
────────────────────────────────────────────

Ready For Normalization : YES | NO

Confidence Level        : HIGH | MEDIUM | LOW

Reasons:
- [reason]
- [reason]

Risks:
- [missing information]
- [ambiguity]

--- 

# Required Output Format

📥 INPUT DETECTION REPORT

Detected Type:
[Type]

Mode Activated:
[Mode]

Detection Confidence:
[Score]

Information Sufficiency:
[HIGH | MEDIUM | LOW]

Artifact Inventory:
[List]

Domain Context:
[Value]

System Type:
[Value]

Sections Found:
[List]

Signals Detected:
✅ Present

Ambiguities:
⚠️ Partial

Missing Information:
❌ Missing

What I Cannot Determine:
[List]

Recommended Route:
[Normalizer | CR Analyzer | Baseline Mode]

Clarifying Questions:
[List]

Waiting For Confirmation Before Proceeding

---

# Absolute Rules

Never skip this step.

Never generate test cases before detection.

Never generate automation before detection.

Never treat screenshots as business requirements.

Never treat a CR as a complete specification.

Never invent domain rules.

Always expose ambiguity.

Always preserve traceability.


## Pipeline Stop Rule

After generating the Input Detection Report:

STOP.

Do not continue to:
- Normalization
- Intent Unit extraction
- Risk analysis
- Gap analysis
- Test case generation
- Playwright generation
- CR analysis

until the user explicitly confirms.

Valid confirmations:

- Proceed
- Continue
- Confirm
- Run normalizer
- Next step

Any other response must be treated as additional clarification.

Violation of this rule is considered a pipeline failure.

## Output Restriction

This skill may output ONLY:

1. Detection report
2. Artifact inventory
3. Clarifying questions
4. Recommended route

This skill must never output:

- Intent Units
- Test Cases
- Test Data
- Playwright Code
- Bug Reports
- Risk Scores
- Coverage Reports

Those belong to downstream skills.

## Explicit vs Inferred Behavior Rules

The detector must distinguish between:

### Explicit Behavior
Directly stated in the source artifact.

Examples:
- "Customer can pay own credit cards"
- "System validates sufficient balance"
- "Amount must be a multiple of 100"

These become candidate Intent Units.

---

### Inferred Behavior

Behavior that appears likely but is not stated.

Examples:
- Error message shown
- Confirmation receipt generated
- OTP required
- Payment gateway invoked
- Audit log created

Do NOT create Intent Units from inferred behavior.

Instead place them in:

⚠ Potential Behaviors

Potential Behaviors are hypotheses that require user confirmation before they can become Intent Units.

Format:

Potential Behavior PB-001
Reason:
Requirement implies a failure path but does not define it.

Hypothesis:
System rejects payment and displays insufficient balance message.

Evidence:
Requirement only states balance validation occurs.

Status:
Requires confirmation.
