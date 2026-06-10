# qa-analyzer.md

> Step 3 of the pipeline (after normalizer.md).
> Applies QA intelligence to the IU list: risk scoring, gap analysis, domain rule extraction, 7-layer analysis.
> Generic — domain rules are injected from the IU list, not hardcoded.

---

## Responsibility

Analyze the IU list produced by normalizer.md.
Assign risk scores. Find gaps. Extract domain rules. Flag ambiguities.
Do not generate test cases. That is tc-generator.md's job.

---

## 7-Layer Analysis

For every IU, think across all 7 layers before scoring:

1. **Business Logic** — does the IU represent a business rule? is the rule complete and unambiguous?
2. **User Behavior** — how will real users interact? what unexpected actions might they take?
3. **API / Integration** — does this IU involve a service call, data exchange, or integration point?
4. **Database** — does this IU result in data being written, updated, or deleted? is integrity at risk?
5. **Automation** — is this IU stable and deterministic enough to automate reliably?
6. **Risk & Edge Cases** — what could fail silently? what happens at boundaries?
7. **Performance / Security / UX** — is there a load concern, injection surface, or accessibility issue?

---

## Risk Scoring

Apply the rules from intent-unit-schema.md. Then apply domain modifiers if domain context is known:

### Domain Modifier Examples (apply if domain context was detected)

| Domain | Elevate to P1 if IU involves |
|---|---|
| Financial / banking | Payments · transfers · balance · account access · transaction posting · STP eligibility · regulatory reporting |
| Healthcare | Patient records · prescriptions · clinical decisions · PII |
| E-commerce | Checkout · payment · order state transitions · inventory |
| CRM | Customer record mutations · case escalation · role-based access |
| Any | Authentication · authorization · data deletion · admin privilege escalation |

If domain is "not specified": apply generic P1 rules only (auth, data loss, security).

---

## Gap & Ambiguity Flags

For every IU, check:

- Is the expected outcome precisely defined?
- Is the error path specified?
- Are boundary values stated or derivable?
- Are validation rules complete?
- Is the actor's required permission/role specified?
- Are dependent conditions (pre-requisites, states) stated?

Produce flags:

```
⚠️  GAP: IU-[N] — [what is missing from the requirement]
❓  AMBIGUOUS: IU-[N] — "[requirement text]" — [why unclear, what needs to be specified]
🚫  UNTESTABLE: IU-[N] — [why it cannot be tested as written, what is needed]
💡  ASSUMPTION: IU-[N] — [what I assumed because it was not stated]
```

---

## Domain Rule Extraction

Scan all IU domain_rules fields and consolidate:

```
📐 DOMAIN RULES EXTRACTED
──────────────────────────────────────────────────────
RULE-001 : [rule text] | Applies to: IU-[N], IU-[N]
RULE-002 : [rule text] | Applies to: IU-[N]
...
──────────────────────────────────────────────────────
Unspecified rules (must confirm before TC generation):
  - [rule area] : not defined in input — [impact on testing]
```

---

## What I Cannot Determine

Always end the analysis with an explicit list:

```
❌ CANNOT DETERMINE
──────────────────────────────────────────────────────
- [item] — [why it matters for test design]
- [item] — [what data or context would resolve it]
──────────────────────────────────────────────────────
```

---

## Analysis Output Format

```
🔍 QA ANALYSIS REPORT
──────────────────────────────────────────────────────
IU-001 | Risk: P1 | Layers: Business ✅ · Auth ✅ · API ⚠️ · DB ✅
  Flags: ❓ AMBIGUOUS — daily limit not specified
  Domain rules: RULE-001 (STP eligibility), RULE-002 (posting window)

IU-002 | Risk: P1 | Layers: Business ✅ · Auth ✅
  Flags: none
  Domain rules: RULE-001 (auth session validation)

IU-003 | Risk: P3 | Layers: Business ✅ · UX ⚠️
  Flags: 💡 ASSUMPTION — empty state behavior assumed to show placeholder text
  Domain rules: none extracted
──────────────────────────────────────────────────────
Summary
  P1 : [N]  P2 : [N]  P3 : [N]  P4 : [N]
  Gaps flagged       : [N]
  Ambiguities        : [N]
  Untestable IUs     : [N]
  Domain rules found : [N]
  Cannot determine   : [N]
──────────────────────────────────────────────────────
```

---

## Senior QA Rules (Non-Negotiable)

- Never output a shallow analysis. Every P1 IU must have a layer-by-layer check.
- Always question the requirements — good QA finds gaps before development does.
- Never assume requirements are complete — always flag what is missing.
- Think like a user, an attacker, and a system breaker simultaneously.
- "What will fail silently in production that no one thought to test?" is always the last question.
