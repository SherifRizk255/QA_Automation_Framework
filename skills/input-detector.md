# input-detector.md

> Step 1 of the pipeline. Runs before anything else.
> Identifies what artifact type was provided and activates the correct downstream mode.
> Generic — works for any domain, any project.

---

## Responsibility

Classify the input. Surface what is present, what is missing, and what is ambiguous.
Do not generate test cases. Do not analyze requirements. Just detect and report.

---

## Detection Rules

Examine everything provided — text, files, images, tables, metadata — and match against:

| Signal present in input | Detected type | Mode |
|---|---|---|
| "Change Request" / "CR-" / "from X to Y" / "current behavior" + "new behavior" / "impacted modules" | Change Request | CR Delta Mode |
| "As a [role], I want … So that" / Given-When-Then / Acceptance Criteria in Gherkin | User Story | Story Mode |
| Numbered ACs / "shall" / "must" / "the system will" / formal sections: Scope, Objective, Functional Requirements | BRD / FRD | Full Requirements Mode |
| "SDD" / architecture diagrams / API contracts / sequence diagrams / service names / data flows | System Design Document | Technical Mode |
| Columns: TC ID / Steps / Expected Result / Pass/Fail / Status | Existing TC or smoke test sheet | Baseline Mode |
| Bulleted or numbered feature names with no ACs attached | Feature List | Feature Expansion Mode |
| Plain prose describing behaviors without formal structure | Free Text | Extraction Mode |
| One or more images or screenshots with no or minimal text | Visual Input | Visual Inference Mode |
| Multiple types combined in one input | Mixed | Merge Mode |

---

## Domain Context Extraction

If the user provides domain context (industry, system type, client type), capture it:

```
domain_context : [e.g. retail banking, corporate portal, CRM, insurance, e-commerce, healthcare]
system_type    : [web app, mobile, API, hybrid, desktop]
tech_hints     : [any tech stack signals from the input]
```

Domain context is passed downstream to qa-analyzer.md and tc-generator.md.
If no domain context is given, note it as unknown — do not assume.

---

## Required Output Block

After examining the input, produce this block. Do not skip any field.

```
📥 INPUT DETECTION REPORT
──────────────────────────────────────────────────────
Detected type    : [type]
Mode activated   : [mode]
Domain context   : [extracted or "not specified"]
System type      : [extracted or "not specified"]

Sections / areas found:
  - [section or feature name] → [brief description]
  - ...

Signals detected:
  ✅ [what was clearly present]
  ⚠️ [what was partially present or ambiguous]
  ❌ [what was expected but missing]

What I cannot determine from this input:
  - [item] — [why it matters for testing]

Clarifying questions (answer before I proceed):
  1. [most important question — or "none needed"]
  2. [optional second question]
──────────────────────────────────────────────────────
Waiting for confirmation or answers before proceeding.
```

---

## Mode Routing Instructions

After producing the report and receiving confirmation:

- **CR Delta Mode** → hand off to `cr-analyzer.md` first, then standard pipeline
- **Full Requirements Mode** → hand off to `normalizer.md`
- **Story Mode** → hand off to `normalizer.md` with story parsing rules active
- **Feature Expansion Mode** → hand off to `normalizer.md` with expansion rules active
- **Technical Mode** → hand off to `normalizer.md` with SDD parsing rules active
- **Baseline Mode** → hand off to `normalizer.md` with baseline diffing rules active
- **Extraction Mode** → hand off to `normalizer.md` with signal extraction rules active
- **Visual Inference Mode** → hand off to `normalizer.md` with visual inference rules active
- **Merge Mode** → apply Merge Priority Rule: CR scope > free text business rules > visual UI inventory

---

## Merge Priority Rule

When multiple input types are combined:
1. CR (if present) defines the scope boundary — only changed areas are in scope
2. Free text or BRD fills in business rules and validation details
3. Screenshots provide UI element inventory — fields, buttons, states visible on screen
4. Each IU produced must be tagged with which source it came from

---

## Absolute Rules

- Never skip this step. No test generation begins without a completed detection report.
- Never assume a CR is a full requirements document.
- Never treat a screenshot as a source of business rules — only as a source of UI structure.
- Never invent domain context that was not provided.
- If the input type is genuinely unclear after analysis, say so and ask one targeted question.
