# Input Detector Skill

> Pipeline Step 1
>
> Mandatory entry point for every workflow.
>
> No normalization, QA analysis, gap analysis, traceability mapping, test generation, automation generation, risk scoring, or CR analysis may begin until input detection is complete and approved.

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

Every input must first be classified into a known artifact type before any testing activity begins.

If confidence is below 75%, ask a clarifying question before proceeding.

---

# Required outputs
docs/analysis/input-detection-report.md

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

95–100%
Clear Match

75–94%
Strong Match

50–74%
Possible Match

Below 50%
Ambiguous

Output Example:

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

Proceed with ambiguity warnings.

LOW

Clarification required before continuing.

Output Example:

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

* Systems
* Interfaces
* APIs
* Endpoints
* Queues
* Events
* Databases
* Authentication Methods
* Error Handling
* Integration Boundaries

Example:

Integration Points Found:

* CRM → CBS
* Portal → Payment Gateway

Endpoints Found:

* POST /payments
* GET /accounts

---

# Screenshot Analysis Extension

Identify:

* Forms
* Tabs
* Sections
* Buttons
* Dropdowns
* Tables
* Modals
* Error Messages
* Lookup Fields
* Subgrids
* Ribbon Actions
* Business Process Flow Stages

Output visible UI inventory.

Never infer business rules from screenshots.

Only identify UI structure.

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

* CR defines scope
* Requirements define business rules
* Free text fills context gaps
* Screenshots provide UI inventory
* Every downstream artifact must retain source references

---

# Readiness Assessment

Evaluate whether the artifact is suitable for Intent Preview.

Output:

📊 READINESS ASSESSMENT
────────────────────────────────────────────

Ready For Intent Preview : YES | NO

Confidence Level : HIGH | MEDIUM | LOW

Reasons:

* [reason]
* [reason]

Risks:

* [missing information]
* [ambiguity]

---

# Handoff Contract

Pass the following to Intent Preview:

* detected_type
* mode
* confidence
* artifact_inventory
* domain_context
* system_type
* sections_found
* ambiguities
* information_sufficiency

---

# Detection Output Contract

The detector may output ONLY:

1. Input Detection Report
2. Artifact Inventory
3. Readiness Assessment
4. Clarifying Questions
5. Recommended Route

The detector must NEVER output:

* Intent Candidates
* Potential Behaviors
* Intent Units
* Risk Scores
* Test Cases
* Test Data
* Automation Code
* Coverage Reports
* Gap Analysis
* Bug Reports

These belong to downstream skills.

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

Tech Hints:
[List]

Sections Found:
[List]

Signals Detected:
✅ Present

Ambiguities:
⚠ Partial

Missing Information:
❌ Missing

What I Cannot Determine:
[List]

Recommended Route:
Intent Preview

Clarifying Questions:
[List]

---

📊 READINESS ASSESSMENT

Ready For Intent Preview:
YES | NO

Confidence Level:
HIGH | MEDIUM | LOW

Reasons:
[List]

Risks:
[List]

---

Waiting For Approval

Reply exactly:

APPROVE_DETECTION

to continue to Intent Preview.

---

# Pipeline Gate (Mandatory)

After producing the Input Detection Report:

STOP.

Do not execute:

* intent-preview.md
* normalizer.md
* cr-analyzer.md
* qa-analyzer.md
* traceability-manager.md
* tc-generator.md
* reporter.md

until the user explicitly replies:

APPROVE_DETECTION

Any other response must be treated as clarification input.

Failure to wait for approval is a pipeline violation.

---

# Absolute Rules

* Never skip this step.
* Never generate behaviors.
* Never generate Intent Candidates.
* Never generate Intent Units.
* Never generate test cases.
* Never generate automation code.
* Never assign risk scores.
* Never invent domain rules.
* Never treat screenshots as business requirements.
* Never treat a CR as a complete specification.
* Always expose ambiguity.
* Always preserve traceability.

---
# Output File Location
docs/analysis/input-detection-report.md