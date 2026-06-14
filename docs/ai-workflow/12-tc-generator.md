# tc-generator.md

> Runs after traceability-manager.md produces the plan.
> Generates detailed test cases for every planned TC.
> Generic — no framework assumptions, no domain hardcoding.

---

## Responsibility

Generate detailed, business-driven test cases based on the traceability plan.
Every TC must be traceable to an IU. Every TC must be independently executable.
In CR mode: generate delta TCs only.

---

## Scenario Ownership Rule

Scenario creation belongs to traceability-manager.md.

TC Generator consumes approved Scenario Inventory entries and TC Coverage Allocation.

Do not invent new scenarios unless:
- A coverage gap is detected
- Traceability Manager explicitly requests additional coverage

Every generated TC must map to exactly one Scenario ID.

---

## INPUT CONTRACT

CConsumes:

- Traceability Plan
- Traceability Matrix
- TC Blueprint
- TC Generator Handoff Contract
- Run Context

The handoff contract is authoritative.

The generator must never independently determine:

- which IUs are in scope
- which IUs are blocked
- regression scope
- retirement scope

Those decisions belong to upstream skills.

---

## PIPELINE GUARD

Read TC_GENERATOR_HANDOFF first.

IF proceed list is empty:

🚫 TC GENERATION BLOCKED

Reason:
No approved IUs available for generation.

STOP.

Never generate TCs for:

- blocked IUs
- IC GAP IUs
- UNTESTABLE IUs
- unresolved rule-conflict IUs

Only generate TCs for:

proceed:
  IU-[N]

---


## TC Format

Every test case uses this structure:

| Field | Content |
|---|---|
| TC ID | TC-[NNN] |
| Scenario ID | SCN-[NNN] |
| IU | IU-[NNN] |
| Title | [Action] + [Context] + [Expected Outcome] — concise, business-readable |
| Type | Positive / Negative / Boundary / Security / Integration / Performance |
| Priority | P1 / P2 / P3 / P4 |
| Preconditions | State of system, data, session, and permissions required before execution |
| Steps | Numbered, specific, action-oriented. What the tester does. |
| Test Data | Specific values — not placeholders. Derive from requirements. |
| Expected Result | Exact observable outcome. Measurable. |
| Automate | Yes / No / Partial |
| Tags | See tagging taxonomy below |
| Source IC | IC-[N] |
| Confidence | High / Medium / Low |
| Risk Basis | QA Analyzer Risk Decision |

---

## Test Data Rules

Do not write generic placeholders like `amount = 100` or `username = testuser`.

Derive test data from the IU's domain rules and boundary conditions:

- Numeric field with stated max → test at: max-1, max, max+1, 0, negative, null, non-numeric
- Numeric field with stated min → test at: min-1, min, min+1
- Text field with max length → test at: max-1 chars, max chars, max+1 chars, empty, whitespace only, special characters
- Dropdown/enum → test each valid value, no selection, value outside valid set
- Date field → test: valid date, past date (if restricted), future date (if restricted), invalid format, null
- Sensitive values (credentials, PII, card numbers, account numbers) → reference as `[ENV: VAR_NAME]` only — never as real values

If boundary values are not stated in the requirements, note: `[BVA: limit not specified — using assumption: [value]. Confirm before execution.]`

---

## Scenario Coverage Checklist

For every IU, ensure you have considered (not all will apply — document why those skipped):

**Positive scenarios**
- [ ] Happy path with minimum valid data
- [ ] Happy path with maximum valid data
- [ ] Happy path with optional fields populated
- [ ] Happy path with optional fields absent

**Negative scenarios**
- [ ] Missing required field(s)
- [ ] Invalid data type or format
- [ ] Value outside valid range
- [ ] Duplicate record (if uniqueness required)
- [ ] Attempting action without required permission
- [ ] Attempting action in wrong system state

**Boundary scenarios**
- [ ] At lower boundary
- [ ] Just below lower boundary
- [ ] At upper boundary
- [ ] Just above upper boundary
- [ ] Null / empty / zero

**Security / Auth scenarios (P1 IUs only by default)**
- [ ] Unauthenticated access attempt
- [ ] Insufficient role/permission
- [ ] Session expired mid-operation
- [ ] Concurrent session conflict (if applicable)
- [ ] Injection in text input (SQL, XSS, script tag)

**Integration scenarios (when IU involves external service)**
- [ ] Downstream service unavailable / timeout
- [ ] Downstream service returns unexpected response
- [ ] Network interruption mid-transaction

---

## DEPENDENCY AWARENESS

Read IU dependency map from qa-analyzer.

When generating TCs:

Do not duplicate coverage already provided by dependency TCs.

Example:

IU-005 depends on IU-002.

If IU-002 already validates authentication:

Do not recreate authentication TCs under IU-005.

Instead:

Reference dependency coverage.

This prevents TC explosion.

---

## RULE CONFLICT HANDLING

If TC_GENERATOR_HANDOFF contains:

rule_conflicts_unresolved

Then:

Block affected IUs.

Output:

🚫 TC GENERATION BLOCKED

IU:
Conflicting Rules:
Reason:

Do not generate speculative test cases.

---

## DATA SENSITIVITY ENFORCEMENT

Read data_sensitivity classification from handoff.

PII-Sensitive

Never expose:

- account numbers
- card numbers
- national IDs
- customer names
- mobile numbers

Use:

[ENV: VARIABLE]

Masked

Use masked values.

Synthetic

Use generated test values.

---

## ENVIRONMENT ENFORCEMENT

Read environment_requirements from handoff.

Sandbox:
  Generate standalone TCs.

CBS-Connected:
  Include CBS dependency in Preconditions.

CMS-Connected:
  Include CMS dependency in Preconditions.

All-Systems:
  Include all integration prerequisites.

Never assume unavailable systems.

---

## ASSUMPTION ESCALATION

If an IU contains unresolved assumptions:

Generate:

⚠ ASSUMPTION PRESENT

Owner:
Expiry:
Impact:

TC may be generated only if:

- assumption is non-blocking
- QA analyzer did not block the IU

Otherwise:

Move IU to blocked list.

---

## TC Output Format

```markdown
| TC-001 | IU-001 | Valid fund transfer completes successfully within daily limit | Positive | P1 |
|---|---|---|---|---|
| Preconditions | User authenticated with Transfer role. Beneficiary pre-registered. Balance > transfer amount. Within daily limit. |
| Steps | 1. Navigate to Transfer screen. 2. Enter valid amount (within limit). 3. Select pre-registered beneficiary. 4. Confirm transfer. |
| Test Data | Amount: [IU-001 limit-1]. Beneficiary: [ENV: TEST_BENEFICIARY_ID]. Account: [ENV: TEST_ACCOUNT]. |
| Expected Result | Transaction processes successfully. Reference number displayed. Balance decreases by transfer amount. Transaction appears in history. |
| Automate | Yes |
| Tags | @positive @P1 @payment @smoke |
```

---

## Tagging Taxonomy

Apply all relevant tags to every TC:

**Scope**: `@smoke` `@regression` `@sanity`
**Priority**: `@P1` `@P2` `@P3` `@P4`
**Type**: `@positive` `@negative` `@boundary` `@security` `@integration` `@performance`
**Layer**: `@ui` `@api` `@db` `@auth`
**Source**: `@cr` `@brd` `@frd` `@story` `@feature` `@visual` `@freetext`
**Domain**: inject from context — e.g. `@payment` `@transfer` `@crm` `@onboarding` `@reporting`

---

## CR MODE RULES

CR mode is controlled exclusively by orchestrator.md and TC_GENERATOR_HANDOFF.

Generate test cases only for:

- NEW IUs
- MODIFIED IUs

Do not generate new TCs for:

- regression-only IUs
- unchanged IUs
- retired IUs

For MODIFIED IUs:

Include:

UPDATED — replaces TC-[N] per CR-[ID]

For DEPRECATED IUs:

Do not generate TCs.

Generate retirement notice only:

🗑 RETIREMENT REQUIRED

IU:
TC:
Reason:
CR Reference:

---

## Absolute Rules

- Every TC must be independently executable — no hidden dependency on another TC's execution.
- Never combine two behaviors in one TC.
- Never hardcode sensitive values — always reference environment variables or fixtures.
- Never generate a TC for an IU flagged as `🚫 UNTESTABLE` — report it instead.
- If a TC cannot be fully specified due to missing requirement detail, generate what is possible and flag: `⚠️ INCOMPLETE TC — requires: [what is missing]
`
- Never generate TCs for:
  * Blocked IUs
  * IC GAP IUs
  * Untestable IUs
  * IUs excluded by the TC Generator Handoff Contract

---

## TC GENERATION SUMMARY

📋 TC GENERATION REPORT
────────────────────────────────────────

Generated:
  TC-[N]

Blocked:
  IU-[N] — reason

Retirement Required:
  TC-[N]

Regression Referenced:
  IU-[N]

Coverage Produced:
  Positive : [N]
  Negative : [N]
  Boundary : [N]
  Security : [N]
  Integration : [N]

Open Assumptions:
  [N]

Open Rule Conflicts:
  [N]

Ready For:
  playwright-generator.md
