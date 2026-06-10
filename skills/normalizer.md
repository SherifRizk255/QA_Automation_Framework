# normalizer.md

> Step 2 of the pipeline. Runs after input-detector.md confirms the type.
> Converts raw artifact content into Intent Units following the schema in intent-unit-schema.md.
> Generic — works for any domain, any project.

---

## Responsibility

Parse the artifact using the mode-specific rules below.
Produce a complete, numbered list of Intent Units.
Do not risk-score, do not generate TCs. That is qa-analyzer.md's job.

---

## Parsing Rules by Mode

### Full Requirements Mode (BRD / FRD)

- Parse section by section using headings as boundaries.
- Extract every numbered or bulleted acceptance criterion as one IU.
- One IU = one testable behavior. Do not merge two behaviors into one IU.
- Capture: actor (explicit or implied), action, expected system response.
- Extract domain rules inline: limits, thresholds, eligibility conditions, error messages, states.
- Flag sections that have a heading but no ACs as ⚠️ MISSING ACs.
- Capture version, date, author metadata if present.

### Story Mode (User Story)

- Extract actor from "As a [role]".
- Extract action from "I want to [action]".
- Extract business value from "So that [outcome]" — useful for risk scoring.
- Extract ACs from Given/When/Then or numbered list below the story.
- If ACs are absent: generate candidate ACs from the story text and mark them as `[INFERRED — confirm before proceeding]`.

### Feature Expansion Mode (Feature List)

- Treat each bullet as one feature name, not a testable behavior.
- For each feature, derive: success condition, failure condition, boundary conditions, validation rules.
- Mark all derived ACs as `[EXPANDED — confirm before proceeding]`.
- Do not generate IUs from feature names alone — only from confirmed ACs.

### Technical Mode (SDD)

- Extract: API endpoints, request/response contracts, service dependencies, data flows, DB schemas, integration points.
- Produce IUs focused on: API contract validation, integration failure handling, data integrity, service boundary behavior.
- Flag UI-level behaviors as lower scope unless the SDD explicitly describes UI.
- For each API endpoint: produce at minimum one IU for the happy path and one for the primary failure path.

### Baseline Mode (Existing TC Sheet)

- Index all existing TCs by ID.
- Map each TC to a behavior it covers.
- Identify gaps: behaviors that exist in the new requirements but are not covered by any existing TC.
- Identify outdated TCs: TCs whose expected behavior no longer matches the current requirements.
- Identify duplicate TCs: multiple TCs testing the exact same behavior.
- Produce IUs only for gaps — not for already-covered behaviors.
- Output a baseline summary before the IU list.

### Extraction Mode (Free Text / Plain Text)

- Scan for behavioral signals:
  - "the system should / must / will"
  - "users can / must be able to"
  - "if [condition] then [outcome]"
  - "validation requires / fails when"
  - "error when / error message"
  - "only when / not allowed when"
- Extract each signal as a candidate IU.
- Output the candidate list and state: "I found [N] testable behaviors — confirm or add anything missing."
- Mark all candidates as `[EXTRACTED — confirm before proceeding]`.

### Visual Inference Mode (Screenshots)

- Identify all visible UI elements:
  - Input fields (label, type, required/optional if visible)
  - Buttons and their labels
  - Dropdowns, checkboxes, toggles, radio buttons
  - Data tables and their columns
  - Modals, drawers, overlays
  - Error messages and validation text
  - Navigation elements, breadcrumbs, step indicators
  - Empty states, loading states, disabled states
- Identify screen state: which step in a flow, error state, success state, restricted access.
- Infer testable behaviors from what is visible.
- For every field with a visible validation message: produce a negative IU.
- For every button: produce a positive IU (click leads to X) and consider a negative IU (click blocked under Y condition).
- Mark all inferred IUs as `[INFERRED FROM VISUAL — confirm business rules]`.
- Never invent business rules not visible on screen.
- Always note: "I cannot determine from this screenshot: [list of unknowns]."

### Merge Mode

- Apply each parsing mode to the relevant portion of the input.
- Tag each IU with its source: `source_type: CR`, `source_type: Visual`, etc.
- Merge domain rules from free text / BRD into IUs whose actor/action was identified from a screenshot.
- Flag conflicts between sources.

---

## Normalization Output

Produce the full IU list in the format defined in `intent-unit-schema.md`.

Then produce the IU Map summary:

```
📋 INTENT UNIT MAP
──────────────────────────────────────────────────────
IU-001 | [actor] [action] [condition summary] | Source: [ref]
IU-002 | ...
──────────────────────────────────────────────────────
Total   : [N]
Flags   : [N] ❓ inferred  ·  [N] ⚠️ missing info  ·  [N] ❌ untestable as written
```

---

## Quality Rules

- Every IU must have a unique ID, an action, and a source reference.
- No IU should duplicate another — if two requirements describe the same behavior, merge them and note both sources.
- If a behavior cannot be made testable as written, mark it `🚫 UNTESTABLE — [reason]` and do not generate an IU for it. Report it instead.
- Do not assign risk scores here — that is qa-analyzer.md's responsibility.
