# cr-analyzer.md

> Activated only in CR Delta Mode.
>
> Runs after:
>
> * input-detector.md
> * intent-preview.md
> * requirements-quality-checker.md
> * normalizer.md
> * orchestrator.md
>
> Purpose:
> Analyze normalized Change Request Intent Units and determine:
>
> * delta scope
> * impacted functionality
> * regression requirements
> * test retirement requirements
> * downstream QA scope
>
> This skill does NOT create Intent Units.
>
> Intent Units already exist and are provided by normalizer.md.

---

# INPUT CONTRACT

Consumes:

* Input Detection Report
* Approved Intent Preview
* Requirements Quality Report
* Intent Unit List
* Orchestrator Run Context

Run Context Authority:

master-workflow.md
↓
orchestrator.md

Required:

Pipeline Mode = CR Delta

If Pipeline Mode ≠ CR Delta:

STOP

Output:

CR Analyzer is only valid in CR Delta Mode.

Required:

```text
Pipeline Mode = CR Delta
```

If pipeline mode is not CR Delta:

```text
CR Analyzer skipped.
Reason:
Not a Change Request workflow.
```

STOP.

---

# RESPONSIBILITY

Analyze the change.

Determine:

* What changed
* What was added
* What was removed
* Which existing behaviors are impacted
* Which tests require update
* Which tests require retirement
* Which areas require regression

Do NOT:

* Generate test cases
* Generate automation
* Generate new Intent Units
* Re-normalize requirements

---

# DELTA CLASSIFICATION

Every IU must be classified.

Possible values:

```text
NEW
MODIFIED
DEPRECATED
UNCHANGED
```

Definitions:

### NEW

Behavior did not previously exist.

Requires:

```text
New test coverage
```

---

### MODIFIED

Existing behavior changed.

Requires:

```text
Regression analysis
Update existing tests
Potential new tests
```

---

### DEPRECATED

Behavior removed.

Requires:

```text
Test retirement analysis
Traceability update
```

---

### UNCHANGED

Behavior exists but remains unaffected.

Requires:

```text
No new coverage
May participate in regression
```

---

# DELTA EXTRACTION

Produce:

```text
🔁 DELTA SUMMARY
────────────────────────────────────────────

CR Reference:
[CR identifier]

Changed Behaviors:
[N]

Added Behaviors:
[N]

Removed Behaviors:
[N]

Unaffected Behaviors:
[N]

Affected Areas:
- [area]
- [area]

Affected Systems:
- [system]
- [system]

Affected Integrations:
- [integration]
- [integration]

────────────────────────────────────────────
```

---

# IMPACT ANALYSIS

For every MODIFIED or DEPRECATED IU:

Determine:

```text
Business Impact
Technical Impact
Integration Impact
Data Impact
Security Impact
```

Output:

```text
IU-[N]

Classification:
MODIFIED

Impact:

Business:
[impact]

Technical:
[impact]

Data:
[impact]

Integration:
[impact]

Security:
[impact]
```

---

# REGRESSION ANALYSIS

For every MODIFIED IU determine:

## Regression Scope

Values:

```text
FULL
TARGETED
SMOKE_ONLY
```

---

### FULL

Use when:

* Core business rule changed
* Financial logic changed
* Authentication changed
* Authorization changed
* Data integrity changed
* API contract changed

---

### TARGETED

Use when:

* Validation changed
* UI behavior changed
* Local workflow changed

---

### SMOKE_ONLY

Use when:

* Label changes
* Cosmetic changes
* Non-functional wording changes

---

Output:

```text
IU-[N]

Regression Scope:
FULL

Reason:
Payment validation rule changed.
```

---

# BLAST RADIUS ANALYSIS

Identify dependent areas.

Output:

```text
💥 BLAST RADIUS
────────────────────────────────────────────

IU-[N]

Directly Impacted:

- Payment Submission
- Balance Validation

Indirectly Impacted:

- Payment History
- Notifications

Shared Dependencies:

- Core Banking API
- Transaction Service

Risk Level:
HIGH

────────────────────────────────────────────
```

---

# TEST RETIREMENT ANALYSIS

For DEPRECATED IUs:

Determine:

```text
Should existing tests be retired?
```

Output:

```text
🗑 TEST RETIREMENT

IU-[N]

Reason:
Behavior removed by CR.

Action:
Retire associated test cases.

Retirement Risk:
LOW
```

---

# TRACEABILITY IMPACT

Determine required traceability updates.

Output:

```text
TRACEABILITY IMPACT

IU-[N]

Action:
SUPERSEDE

Replaced By:
IU-[N]

Reason:
Validation rule updated.
```

Actions:

```text
SUPERSEDE
RETAIN
RETIRE
UPDATE
```

---

# CR RISK ESCALATION RULES

Automatically elevate blast radius to HIGH when CR affects:

* Authentication
* Authorization
* Payments
* Transfers
* Account balances
* Financial calculations
* Customer data
* Data integrity
* Security controls
* Regulatory reporting

Output:

```text
⚠ HIGH-RISK CR DETECTED

Reason:
Financial transaction processing modified.

Mandatory Regression:
FULL
```

---

# CONFLICT DETECTION

Check for contradictions between:

* Existing IU
* Modified IU

Output:

```text
⚔ CR CONFLICT

Existing IU:
IU-021

Modified IU:
IU-145

Conflict:
Maximum amount differs.

Required Action:
Business confirmation required.
```

---

# QA ANALYZER HANDOFF

Produce structured handoff.

```text
CR_ANALYZER_HANDOFF
────────────────────────────────────────────

new_ius:
- IU-[N]

modified_ius:
- IU-[N]

deprecated_ius:
- IU-[N]

unchanged_ius:
- IU-[N]

regression_required:
- IU-[N] | FULL
- IU-[N] | TARGETED

test_retirement_required:
- IU-[N]

high_risk_cr:
YES | NO

blast_radius:
NARROW
MODERATE
WIDE

conflicts:
- IU-[N] vs IU-[N]

affected_integrations:
- [integration]

affected_modules:
- [module]

────────────────────────────────────────────
```

---

# OUTPUT FORMAT

```text
🔁 CR ANALYSIS REPORT
══════════════════════════════════════════

Delta Summary
[summary]

Impact Analysis
[details]

Regression Analysis
[details]

Blast Radius
[details]

Test Retirement
[details]

Traceability Impact
[details]

Conflicts
[details]

══════════════════════════════════════════

CR_ANALYZER_HANDOFF
[handoff block]
```

---

# ABSOLUTE RULES

* Never generate Intent Units.
* Never generate test cases.
* Never generate automation.
* Never ignore deprecated behaviors.
* Always determine regression scope.
* Always determine blast radius.
* Always determine traceability impact.
* Always produce QA_ANALYZER handoff.
* Every decision must reference an IU.
* Every classification must be traceable back to the originating CR.
