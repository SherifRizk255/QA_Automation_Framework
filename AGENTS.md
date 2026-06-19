# QA Automation Agent Instructions

## Purpose

This repository uses a modular AI-driven QA framework for Playwright TypeScript automation.

`AGENTS.md` is the global governance file.

It does not perform workflow stages itself.

Its responsibility is to:

- Define global framework rules
- Define workflow routing behavior
- Define safety constraints
- Define automation standards
- Define traceability requirements
- Define locator governance
- Define self-healing governance
- Direct the agent to the correct workflow skill

Detailed behavior lives inside the reusable workflow skills located under:

`docs/ai-workflow/`

---

# Workflow Authority

All workflow execution must begin with:

`docs/ai-workflow/00-master-workflow.md`

The Master Workflow determines:

- Current stage
- Execution mode
- Approval status
- Required inputs
- Expected outputs
- Next skill

No workflow skill may execute unless selected by the Master Workflow.

---

# Workflow Skills

## Workflow Coordination

- `docs/ai-workflow/00-master-workflow.md`

## Project Discovery

- `docs/ai-workflow/01-project-intake-agent.md`

## Application Discovery

- `docs/ai-workflow/02-system-walkthrough-agent.md`

## Requirements Processing

- `input-detector.md`
- `intent-preview.md`
- `intent-preview-schema.md`
- `normalizer.md`
- `requirements-quality-checker.md`
- `orchestrator.md`

## QA Analysis

- `qa-analyzer.md`
- `cr-analyzer.md`

## Test Design

- `traceability-manager.md`
- `tc-generator.md`

## Automation

- `docs/ai-workflow/13-automation-implementation-agent.md`

## Execution

- `docs/ai-workflow/14-test-execution-agent.md`

## Failure Management

- `docs/ai-workflow/15-failure-analysis-agent.md`
- `docs/ai-workflow/16-self-healing-agent.md`

## Reporting

- `docs/ai-workflow/17-final-report-agent.md`
- `docs/ai-workflow/18-qa-review-agent.md`

---

# Workflow Modes

The framework supports:

## Standard Mode

Requirements
→ QA Analysis
→ Traceability
→ Test Cases
→ Automation
→ Execution
→ Failure Analysis
→ Self-Healing (Optional)
→ Reporting

---

## CR Delta Mode

Change Request
→ CR Analysis
→ QA Analysis
→ Traceability
→ Delta Test Cases
→ Automation
→ Execution
→ Failure Analysis
→ Self-Healing (Optional)
→ Reporting

---

# Approval Gates

The workflow must stop whenever approval is required.

Required approvals include:

```text
APPROVE_INTENTS
NORMALIZE
RUN_NORMALIZER
```

Without approval:

```text
STOP

Intent approval required before continuation.
```

---

# Traceability must be preserved throughout the entire workflow:

REQ
↓
IU
↓
SCN
↓
TC
↓
AUT
↓
EXEC
↓
FAILURE
↓
HEALING

No workflow stage may break traceability

---

# Project Separation

Generic workflow content belongs in:

docs/ai-workflow/

Project-specific content belongs in:

docs/projects/<project-name>/

Requirements:

docs/requirements/

Analysis:

docs/analysis/

Traceability:

docs/traceability/

Test Design:

docs/test-design/

Reports:

reports/

---

# Playwright Standards

Framework:

- Playwright
- TypeScript
- Page Object Model

Browser interaction should use Playwright MCP whenever available.

Page inspection should prefer:

 - Live DOM
 - Accessibility tree
 - Playwright locators

over screenshots.

---

# Locator Governance

## Locator Philosophy

Locator discovery must be DOM-first.

Screenshots are evidence only.

Screenshots must never be the primary locator discovery mechanism.

Locator decisions should prioritize:

DOM structure
Accessible roles
Accessible names
Stable attributes
Business context

---

## Locator Rules

Preferred locator order:

1. Stable ID
2. Accessibility Locator
3. Stable CSS Selector
4. Alternative XPath
5. Visible Text
6. Test Attributes
7. Placeholder
8. Name Attribute
9. Partial Text
10. Contextual Locator

---

## Locator Metadata

Every discovered locator should include:
 - Primary Locator
 - Fallback Locators
 - Confidence
 - Volatility
 - Known Risks

---


### Forbidden Locators

Never use:

- nth-child
- nth-of-type
- absolute xpath
- dynamic IDs
- generated framework classes
- framework-generated attributes

Examples:

- ng-star-inserted
- react-123
- mat-input-42
- css-1abcde

---

## Locator Validation Requirements

Every locator must be validated for:

- Uniqueness
- Visibility
- Attachment
- Actionability

Locator discovery must use the live DOM.

Screenshots are evidence only.

Screenshots are not locator discovery mechanisms.

---

# Automation Rules

- Use TypeScript only.
- Use Page Object Model.
- Keep locators inside Page Objects.
- Reuse existing Page Objects whenever possible.
- Keep tests independent.
- No hardcoded credentials.
- No hardcoded waits.
- No fake locators.
- No invented assertions.
- No business logic modifications.

Read environment values from:

- .env
- configuration files

---

# Wait Strategy

Never use:

```ts
page.waitForTimeout()
```

Use:

```ts
expect(locator).toBeVisible()
expect(locator).toBeEnabled()
expect(page).toHaveURL()
```

Wait for business-visible states.

Never wait arbitrary time.

---

# Failure Classification

Every failure must be classified as:

1. UT_LOCATOR
2. AUT_TIMING
3. AUT_ASSERTION
4. APP_FUNCTIONAL
5. APP_VALIDATION
6. APP_UI
7. TEST_DATA
8. ENVIRONMENT
9. ACCESS_PERMISSION
10. BLOCKER
11. REQUIREMENT_AMBIGUITY
12. EXTERNAL_DEPENDENCY

Evidence must support classification.

Never classify without evidence.

---

# Recovery Governance

Recovery decisions originate from Failure Analysis.

Possible recovery actions include:
 - REDISCOVER_LOCATOR
 - USE_FALLBACK_CHAIN
 - USE_CONTEXTUAL_LOCATOR
 - REBUILD_LOCATOR_CHAIN
 - WAIT_STRATEGY_REVIEW
 - MANUAL_REVIEW_REQUIRED

Recovery recommendations should be based on:
 - DOM evidence
 - Locator metadata
 - Failure classification 
 - Recovery confidence

---

# Self-Healing Restrictions

Self-Healing may only fix:

- Locator issues
- Wait strategy issues
- Page Object issues
- Fixture issues
- Navigation issues
- Automation assertion issues

Self-Healing must never:

- Modify requirements
- Modify expected results
- Remove assertions
- Hide defects
- Bypass validations
- Increase timeout without evidence
- Modify business rules

Automatic healing must not proceed when:

Healing Confidence = LOW

---

# Execution Rules

Never:

 - Execute automation without approved test cases.
 - Execute Self-Healing before Failure Analysis.
 - Execute Self-Healing when Self-Healable = NO.
 - Modify automation without validation.
 - Promote locator changes without validation.

Recovered locators must pass:
```
count() == 1
isVisible()
isEnabled()
Actionable
```
before automation is updated.

---

# Safety Rules

Never:

- Invent business rules
- Invent expected results
- Invent locators
- Hide failures
- Hide defects
- Submit real transactions
- Delete production data
- Modify customer data
- Change passwords
- Perform destructive actions

unless explicitly approved.

---

# Evidence Rules

Execution evidence must be preserved:

- Screenshots
- Videos
- Traces
- Console Logs
- Playwright Reports
- Locator Failure Records
- DOM Context Evidence

Evidence must remain available for:

- Failure Analysis
- Self-Healing
- Final Reporting
- QA Review

---

# Automation Health Governance

The framework should continuously monitor:
 - Locator Stability
 - Locator Volatility
 - Timing Stability
 - Flaky Tests
 - Self-Healing Success Rate
 - Automation Debt

Automation health must never override application quality assessments.

---

# Final Rule

When uncertain:

1. Read the Master Workflow.
2. Determine the current stage.
3. Read the stage skill.
4. Execute only that skill.
5. Respect approval gates.
6. Preserve traceability.
7. Preserve Evidence
8. Preserve defect visibility
9. Prefer DOM evidence over screenshots.
10. Apply the smallest safe change.