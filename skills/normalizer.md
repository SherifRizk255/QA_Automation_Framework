# normalizer.md

> Step 2 of the pipeline.
> Converts detected artifacts into Intent Units (IU) using intent-unit-schema.md.
> Domain-agnostic (CRM, banking, insurance, fintech, etc.)

---

## Responsibility

Transform parsed input into structured Intent Units.

You MUST:
- Extract testable behaviors only
- Respect input-detector mode
- Preserve traceability
- Never assign risk or test cases

You MUST NOT:
- Score risk
- Generate test cases
- Merge unrelated behaviors
- Invent business rules outside inference rules

---

## Core Normalization Principle

> “One IU = one testable behavior with one observable outcome”

If a behavior contains multiple outcomes → split it.

---

# MODE-SPECIFIC RULES

---

## 1. Full Requirements Mode (BRD / FRD)

- Parse by section boundary.
- Each acceptance criterion = 1 IU.
- If no AC exists → create `[INFERRED AC — requires confirmation]`.
- Extract:
  - actor (explicit or implied)
  - action
  - system response
  - conditions
- Preserve section references in `source`.

---

## 2. Story Mode (User Story)

- Extract:
  - actor from “As a”
  - action from “I want”
  - outcome from “So that”
- If ACs exist → normalize directly.
- If ACs missing → generate **Candidate ACs only**
  and tag:

`[INFERRED AC — NOT FINAL]`

---

## 3. Feature Expansion Mode

- Each feature = INPUT ONLY (not behavior)
- Convert into:
  - success behavior
  - failure behavior
  - boundary behavior
- ALL must be tagged:

`[EXPANDED — needs confirmation]`

- Do NOT assume validations not mentioned.

---

## 4. Technical Mode (SDD)

Focus ONLY on:
- APIs
- services
- integrations
- data flows

Generate IUs for:
- happy path API execution
- failure responses (4xx/5xx)
- data integrity checks

Ignore UI unless explicitly stated.

---

## 5. Baseline Mode (Smoke / Existing TCs)

- Map TC → behavior
- Identify:
  - missing coverage
  - outdated behavior
  - duplicates
- ONLY generate IUs for gaps.

---

## 6. Extraction Mode (Free Text)

- Extract only explicit signals:
  - must / should / will
  - validation requires
  - error when
  - users can
- Do NOT infer missing flows.

- Output:
  “X behaviors found — confirm before normalization continues”

---

## 7. Visual Inference Mode (Screenshots)

You may ONLY extract:
- visible UI elements
- visible states
- visible messages

You MAY NOT:
- infer business rules
- infer backend logic

Each IU must include:

`source_type: VISUAL`

Add:

`unknowns:` list of missing business context

---

## 8. Merge Mode (CR + Text + Visual)

Priority order:

1. CR defines scope (what changed)
2. Text defines business rules
3. Visual defines UI structure

Rules:
- CR overrides everything else
- UI never overrides CR
- Conflicts MUST be flagged

---

# ⚠️ CRITICAL RULE: NO IMPLICIT BEHAVIORS

You MUST NOT generate IUs from assumptions.

Allowed:
- explicit behavior
- clearly stated rule
- confirmed AC

NOT allowed:
- "system probably validates"
- "system should likely block"
- "common banking behavior is..."

Instead:
→ mark as:

`[POTENTIAL BEHAVIOR — requires confirmation]`

---

# 🧾 INTENT UNIT VALIDATION GATE

Before outputting IUs:

Check each IU:

✔ Has actor
✔ Has action
✔ Has observable outcome
✔ Has source reference

If ANY missing:
→ mark as `🚫 UNTESTABLE IU`

---

# 📤 OUTPUT FORMAT

## INTENT UNIT LIST

(use intent-unit-schema.md)

---

## IU MAP SUMMARY
📋 INTENT UNIT MAP
──────────────────────────────────────────────────────
IU-001 | actor action outcome | Source: X
IU-002 | ...
──────────────────────────────────────────────────────
Total : N
P1/P2/P3/P4 breakdown (optional if available later)
Flags : inferred / missing / untestable


---

# 🚨 FAILURE HANDLING

If input is ambiguous:

STOP and output:

- missing information
- clarification questions
- do NOT generate IUs