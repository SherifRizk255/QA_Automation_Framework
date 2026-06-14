# 02 - System Walkthrough Agent

## Purpose
Use the system URL and controlled browser inspection to safely explore a live application, understand screens, workflows, UI behavior, permissions, and automation feasibility.

This skill creates the implementation knowledge base used later by:

- Playwright Generator
- Failure Analysis Agent
- Self-Healing Agent

This skill is discovery-focused only.

It does not generate Intent Units, test cases, automation code, or business requirements.

---

## When to use this skill

Use this skill:

- After Project Intake
- Before automation development
- When navigation paths are unknown
- When locators need discovery
- When UI behavior must be documented
- When validating automation readiness of an application
- When troubleshooting unstable automation

---

# Pipeline Integration

This skill does NOT create Intent Units.

Requirements remain the source of truth.

This skill provides implementation evidence for:

- Playwright Generator
- Failure Analysis Agent
- Self-Healing Agent

Outputs from this skill may support:

- UI Intent Units
- Validation Intent Units
- Permission Intent Units

Observed application behavior must never override documented requirements.

---

## Required Inputs

- Project Profile
- Environment Configuration
- System URL
- Approved credential strategy (if login required)
- Scope of modules/screens to inspect
- Known blockers
- Safe handling rules
- Environment restrictions

---

## Required outputs
- `docs/analysis/system-map.md`
- `docs/analysis/navigation-map.md`
- `docs/analysis/screen-inventory.md`
- `docs/analysis/locator-inventory.md`
- `docs/analysis/blocker-inventory.md`
- `docs/analysis/page-object-recommendations.md`
- `docs/analysis/ui-behavior-inventory.md`
- `docs/analysis/workflow-observations.md`
- `docs/analysis/automation-readiness-report.md`

---

## Step-by-Step Behavior

### Phase 1 — Environment Validation

1. Read Project Profile.
2. Read Environment Notes.
3. Validate target URL.
4. Identify environment restrictions.
5. Confirm safe exploration scope.

---

### Phase 2 — Application Access

6. Open application URL.
7. Login only if:
   - approved
   - credentials are available
   - login is required for discovery

8. Record login observations.

Capture:

- Login page URL
- Authentication method
- MFA presence
- Session timeout indicators
- Error messages
- Role-dependent navigation

---

### Phase 3 — Screen Discovery

9. Walk through visible, non-destructive screens.
10. Record navigation routes.
11. Record menu hierarchy.
12. Record page transitions.
13. Record breadcrumbs.
14. Capture screenshots.

For each screen record:

```text
Screen Name
URL / Route
Purpose
Navigation Path
Visible Components
Visible Actions
Required Permissions
Observed Risks
Recommended Page Object
```

---

### Phase 4 — Control Inventory

For each screen identify:

- Buttons
- Links
- Inputs
- Text Areas
- Dropdowns
- Checkboxes
- Radio Buttons
- Tables
- Tabs
- Accordions
- Modals
- Search Fields
- Upload Controls
- Date Pickers

Capture:

```text
Control Name
Control Type
Purpose
Visible State
Enabled State
Dependencies
```

---

### Phase 5 — Locator Discovery

For every interactive element identify:

### Preferred Locators

Priority order:

```text
1. Role + Accessible Name
2. Test Attributes (data-testid, data-test, data-cy, data-qa)
3. aria-label
4. label
5. placeholder
6. stable id
7. name
8. text
9. css
10. xpath

Prefer semantic Playwright locators whenever possible.

Examples:

getByRole('button', { name: 'Login' })

getByLabel('Password')

getByPlaceholder('Enter username')

getByText('Submit')

```

For every locator record:

```For every locator record:

Element
Primary Locator
Fallback Locator 1
Fallback Locator 2

Discovery Source
Uniqueness
Confidence
Volatility
Locator Score
Reason
Known Risks
Automation Notes
```

---

## Locator Confidence Model

### HIGH

Locator uses:

- data-testid
- aria-label
- stable id

Automation Risk:

```text
LOW
```

---

### MEDIUM

Locator uses:

- name
- role
- stable CSS attributes

Automation Risk:

```text
MEDIUM
```

---

### LOW

Locator uses:

- xpath
- position-based selector
- generated CSS classes
- dynamic IDs

Automation Risk:

```text
HIGH
```

Must be flagged for future improvement.

---
## Locator Discovery Standards

For every interactive element:

1. Discover all possible locator candidates.
2. Identify the locator source.
3. Evaluate locator stability.
4. Evaluate locator uniqueness.
5. Assign confidence level.
6. Assign volatility level.
7. Select a preferred locator.
8. Store fallback locators.
9. Record automation risks.
10. Include locator metadata in the inventory.

The goal of discovery is not merely to find a working locator, but to identify the most stable locator for long-term automation maintenance.

---

## Locator Priority Hierarchy

Preferred locator strategies must be evaluated in the following order:

| Priority | Locator Type | Score |
|-----------|-------------|--------|
| 1 | Role + Accessible Name | 100 |
| 2 | Test Attributes (`data-testid`, `data-test`, `data-cy`, `data-qa`) | 98 |
| 3 | Label-Based | 95 |
| 4 | Placeholder-Based | 90 |
| 5 | Stable ID | 85 |
| 6 | Name Attribute | 80 |
| 7 | Visible Text | 75 |
| 8 | Partial Text | 70 |
| 9 | Stable CSS Selector | 50 |
| 10 | XPath | 20 |

Prefer semantic locators whenever possible.

---

## Framework Attribute Handling

* Framework-generated attributes must be considered unstable.

   Examples:
   pc13
   pc14
   data-p=""
   data-pc-name
   data-pc-section
   ng-reflect-*
   ng-star-inserted
   react-*
   css-*


* Rules:

 1- Do not use framework-generated attributes as Primary Locators.

 2- These attributes may be documented only as discovery evidence.

 3- Framework-generated attributes must be classified as HIGH volatility.

## Forbidden Locator Patterns

The following locator types must be flagged as unstable:

- Absolute XPath
- Positional XPath
- nth-child selectors
- nth-of-type selectors
- Framework-generated classes
- Dynamic IDs
- Randomized attributes

Examples:

```text
/html/body/div[2]/div[4]

button:nth-child(3)

.mat-input-42

.react-123

.ng-star-inserted

.css-1x7ab3
```

These locators may be documented only as a last-resort fallback.

---

## Locator Confidence Classification

### HIGH

Characteristics:

- Role + Accessible Name
- Test Attributes
- Labels
- aria-label
- Stable semantic identifiers

Automation Risk:

```text
LOW
```

### MEDIUM

Characteristics:

- Stable IDs
- Name attributes
- Visible text

Automation Risk:

```text
MEDIUM
```

### LOW

Characteristics:

- CSS selectors
- XPath
- Dynamic attributes
- Generated framework identifiers

Automation Risk:

```text
HIGH
```

Must be flagged for future improvement.

---

## Locator Volatility Classification

### LOW VOLATILITY

Expected to remain stable across releases.

Examples:

- getByRole()
- getByLabel()
- getByTestId()
- aria-label

### MEDIUM VOLATILITY

May change when screens are redesigned.

Examples:

- Stable IDs
- Name attributes
- Visible text
- Placeholder Text

### HIGH VOLATILITY

Likely to break after UI changes.

Examples:

- CSS selectors
- XPath selectors
- Framework-generated classes
- Dynamic IDs
- Generated Attributes

---

## Locator Uniqueness Classification

Every locator must be classified for uniqueness.

### UNIQUE: 

Locator identifies exactly one element without additional context.

Examples:

 - getByRole('button', { name: 'Login' })
 - [data-testid='submit-btn']

### CONTEXTUAL
Locator requires parent context to become unique.

Examples:

 - Edit Button inside Customer Row
 - Delete Button inside Account Table
 - Approve Button inside Transaction Card

Contextual locators are acceptable but must document the required context.

### NON-UNIQUE
Locator matches multiple elements and cannot reliably identify a target element.

Examples:
 - getByText('Edit')
 - button
 - Non-unique locators must not be selected as Primary Locators.

---

## Locator Metadata Model

Every discovered interactive element must be documented using the following structure:

```text
Element Name

Primary Locator

Fallback Locator 1

Fallback Locator 2

Discovery Source 
 ROLE | LABEL | PLACEHOLDER | TESTID | ID | NAME | TEXT | CSS | XPATH 
 
Uniqueness 
 UNIQUE | CONTEXTUAL | NON-UNIQUE

Confidence
  HIGH | MEDIUM | LOW

Volatility
  LOW | MEDIUM | HIGH

Locator Score

Known Risks

Automation Notes
```

Example:

```text
Element Name:
Login Button

Primary Locator:
getByRole('button', { name: 'Login' })

Fallback Locator 1:
[data-testid='login-btn']

Fallback Locator 2:
#loginButton

Discovery Source: ROLE 
Uniqueness: UNIQUE
Confidence: HIGH
Volatility: LOW
Locator Score: 100
Known Risks: None

Automation Notes:
Preferred locator suitable for long-term Playwright automation.
```

---

## Locator Inventory Quality Gate

Every locator recorded in locator-inventory.md must include:

- Primary locator
- At least one fallback locator (when available)
- Discovery Source
- Uniqueness classification
- Confidence classification
- Volatility classification
- Locator score
- Automation risk assessment

Locator inventory is considered incomplete if any interactive element is missing these attributes.

---

### Phase 6 — UI Behavior Discovery

Record observable UI behaviors.

Capture:

- Required fields
- Disabled states
- Hidden controls
- Dynamic enablement
- Conditional visibility
- Validation messages
- Error banners
- Success notifications
- Confirmation dialogs
- Loading indicators
- Session timeout behavior
- Empty state behavior

For each behavior record:

```text
Behavior
Trigger
Observed Result
Automation Impact
```

---

### Phase 7 — Workflow Observation

Document observable workflows.

Example:

```text
Login
→ Dashboard
→ Transfer
→ Review
→ Confirmation
```

Capture:

### Workflow Name

### Entry Conditions

### Exit Conditions

### Required Permissions

### Required Data

### Dependencies

### Failure Points

### Automation Complexity

---

### Phase 8 — Permission Observation

Record visible permission boundaries.

Examples:

```text
Transfer visible only to Retail User

Admin menu visible only to Admin Role

Approval screen visible only to Supervisor
```

Record:

```text
Feature
Required Role
Observed Restriction
Confidence
```

---

### Phase 9 — Automation Readiness Assessment

Evaluate automation feasibility.

For each page determine:

```text
Page Name
Automation Readiness
Locator Stability
Workflow Complexity
External Dependency Risk
Recommended Priority
```

Readiness Values:

```text
HIGH
MEDIUM
LOW
```

---

### Phase 10 — Page Object Recommendations

Recommend:

```text
Page Object Name
Responsibilities
Contained Components
Shared Components
Reusable Methods
```

Example:

```text
TransferPage

Methods:
- enterAmount()
- selectBeneficiary()
- continueTransfer()
```

---

### Phase 11 — Blocker Inventory

Document:

```text
Blocker
Impact
Severity
Workaround
Automation Impact
```

Examples:

- CAPTCHA
- MFA
- Third-party redirects
- Session timeout
- Browser restrictions

---

## Quality Gates

### Screen Coverage

Every discovered screen must contain:

- Screen Name
- Route
- Navigation Path
- Purpose
- Controls
- Permissions
- Screenshot
- Recommended Page Object

---

### Locator Coverage

Every interactive element must contain:

- Primary Locator
- Fallback Locator
- Confidence
- Instability Risk

---

### Workflow Coverage

Every discovered workflow must contain:

- Entry Conditions
- Exit Conditions
- Dependencies
- Failure Points

---

### Documentation Coverage

All required outputs must be generated.

---

## Safety Rules

### Allowed

- Navigation
- Viewing records
- Searching
- Read-only inspection
- Opening screens

---

### Requires Explicit Approval

- Form submission
- Create operations
- Update operations
- Approval actions
- Workflow completion

---

### Forbidden

- Delete operations
- Password changes
- Financial transactions
- Customer data modification
- Profile changes
- Irreversible actions

---

## Do-Not Rules

- Do not create test cases.
- Do not create automation scripts.
- Do not create Intent Units.
- Do not override requirements with observed behavior.
- Do not use LOW confidence locators without documenting risk.
- Do not execute destructive actions.
- Do not expose credentials.
- Do not store secrets.

---

## Output File Locations

### Analysis

```text
docs/analysis/system-map.md
docs/analysis/navigation-map.md
docs/analysis/screen-inventory.md
docs/analysis/locator-inventory.md
docs/analysis/blocker-inventory.md
docs/analysis/page-object-recommendations.md
docs/analysis/ui-behavior-inventory.md
docs/analysis/workflow-observations.md
docs/analysis/automation-readiness-report.md
```

### Evidence

```text
reports/system-walkthrough/
```

---

## Playwright Handoff Contract

Append this structured block at the end of execution.

```text
PLAYWRIGHT_HANDOFF
────────────────────────────────────────────

Pages:
  - [Page Names]

Stable Locators:
  - [Locator]
  - [Locator]

Risky Locators:
  - [Locator]
  - [Locator]

Observed Validations:
  - [Validation]

Observed Permissions:
  - [Permission]

Observed Workflows:
  - [Workflow]

Automation Risks:
  - [Risk]

Recommended Page Objects:
  - [Page Object]

Artifacts:
  - locator-inventory.md
  - ui-behavior-inventory.md
  - workflow-observations.md
  - automation-readiness-report.md

────────────────────────────────────────────
```

---

## Output file locations
- `docs/analysis/system-map.md`
- `docs/analysis/navigation-map.md`
- `docs/analysis/screen-inventory.md`
- `docs/analysis/locator-inventory.md`
- `docs/analysis/blocker-inventory.md`
- `docs/analysis/page-object-recommendations.md`
- `reports/system-walkthrough/`

## Example prompt to use this skill
“Use the System Walkthrough Agent to inspect the application, document navigation paths, discover stable Playwright locators, identify workflow dependencies, and generate the Playwright handoff package.”
