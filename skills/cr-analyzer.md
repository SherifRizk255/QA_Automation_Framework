# cr-analyzer.md

> Activated only in CR Delta Mode (routed by orchestrator.md).
> Analyzes a Change Request to extract the delta, determine impact, and define regression scope.
> Generic — works for any domain, any system.

---

## Responsibility

A CR is not a full requirements document. It is a delta — a description of what changed.
This skill's job is to understand that delta precisely before any IUs are created.

Do not treat a CR like a BRD. Do not generate full suite TCs.
Produce delta IUs only. Define the regression boundary. Flag what is retired.

---

## Step 1: Extract the Delta

Read the CR and extract exactly:

```
🔁 CR DELTA EXTRACTION
──────────────────────────────────────────────────────
CR reference     : [CR ID or title]
CR date          : [if present]
Requested by     : [if present]

CHANGED (behavior modified):
  - [component/field/rule] : was [old behavior] → now [new behavior]

ADDED (new behavior):
  - [component/field/rule/flow] : [what was added]

REMOVED (deprecated):
  - [component/field/rule/flow] : [what was removed or disabled]

AFFECTED MODULES:
  - [module / screen / API / DB table / service]
──────────────────────────────────────────────────────
```

If the CR does not clearly state what changed, flag it immediately:
```
⚠️ CR INCOMPLETE: [what information is missing from the CR]
Do not proceed until confirmed.
```

---

## Step 2: Impact Analysis

For every changed/added/removed item, determine:

| Item | Existing TCs affected | Action required |
|---|---|---|
| [changed item] | TC-[N], TC-[N] | Update expected result |
| [added item] | none | New TCs required |
| [removed item] | TC-[N] | Retire |

Produce:

```
📊 IMPACT ANALYSIS
──────────────────────────────────────────────────────
TCs to RETIRE   : [list TC IDs — behavior no longer valid]
TCs to UPDATE   : [list TC IDs — steps or expected result must change]
TCs UNAFFECTED  : [list TC IDs — still valid, include in regression]
New IUs needed  : [N] — for added/changed behavior
──────────────────────────────────────────────────────
```

If no existing TC list is provided, note: "No existing TC baseline provided — cannot determine retire/update list. Will generate delta TCs only."

---

## Step 3: Regression Scope

Define the blast radius of this CR:

```
🔍 REGRESSION SCOPE
──────────────────────────────────────────────────────
DIRECT RE-TEST (changed behavior — must run):
  - [TC ID or IU] : [reason]

REGRESSION RISK (not changed, but shares dependency):
  - [TC ID or IU] : [why it's at risk — shared API / DB table / session / component]

SAFE TO SKIP (completely unrelated):
  - [module/area] : [why]
──────────────────────────────────────────────────────
Regression blast radius: [Narrow / Moderate / Wide]
Justification: [1-2 sentences]
```

---

## Step 4: Produce Delta IUs

Hand off to normalizer.md to produce IUs, but with CR-specific rules:

- IUs are produced only for CHANGED and ADDED behaviors.
- Each delta IU must reference the CR: `source: CR-[ID], [section]`.
- Each delta IU must note any existing IU it supersedes: `supersedes: IU-[N]`.
- REMOVED behaviors do not get new IUs — they get a RETIRED flag on existing IUs.

---

## CR-Specific Flags

```
🔁 SUPERSEDED: IU-[N] — replaced by delta IU-[N] from CR-[ID]
🗑️  RETIRED: IU-[N] — behavior removed in CR-[ID], TC-[N] should be archived
⚠️  REGRESSION RISK: IU-[N] — not changed but shares [component] with CR delta
```

---

## Absolute Rules

- Never generate a full test suite from a CR. Delta TCs only.
- Never retire a TC or IU without stating the CR reference and reason.
- Never assume a CR is complete — always flag missing "from/to" information.
- If a CR touches authentication, payments, data integrity, or security — escalate blast radius to Wide regardless of stated scope.
- Always ask: "what does this change break that the CR author did not think to mention?"
