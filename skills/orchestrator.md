# orchestrator.md

> Thin routing layer. Runs after input-detector.md and normalizer.md.
> Decides which pipeline path to follow and sets the run context for all downstream skills.
> Generic — works for any domain, any project.

---

## Responsibility

Read the detection report from input-detector.md and the IU list from normalizer.md.
Set the run context. Route to the correct pipeline. Do not generate anything.

---

## Run Context Block

Produce this block before any downstream skill runs:

```
⚙️ ORCHESTRATOR — RUN CONTEXT
──────────────────────────────────────────────────────
Pipeline mode    : Standard | CR Delta
Input type(s)    : [from detection report]
Domain context   : [from detection report, or "not specified"]
System type      : [from detection report, or "not specified"]
Total IUs        : [N]
P1 IUs           : [N] — automation-first, full coverage required
CR scope limit   : [Yes — delta only | No — full suite]
Baseline present : [Yes — existing TCs indexed | No]
Skills to run    : [ordered list of skills for this run]
──────────────────────────────────────────────────────
```

---

## Standard Pipeline Route

Activate when: input is BRD, FRD, User Story, Feature List, SDD, Free Text, Visual, or Mixed (without CR).

```
Skills to run (in order):
1. qa-analyzer.md
2. traceability-manager.md
3. tc-generator.md
4. playwright-generator.md   ← only if automation is requested
5. reporter.md
```

---

## CR Delta Pipeline Route

Activate when: input is a Change Request or Mixed with CR present.

```
Skills to run (in order):
1. cr-analyzer.md            ← produces delta IUs and regression scope
2. qa-analyzer.md            ← runs on delta IUs only
3. traceability-manager.md   ← updates existing matrix, flags retired TCs
4. tc-generator.md           ← delta TCs only
5. playwright-generator.md   ← updated specs only, plus regression run list
6. reporter.md
```

---

## Scope Enforcement Rules

- **Standard mode**: all IUs are in scope. Full coverage applies.
- **CR mode**: only delta IUs (new, changed) are in scope for new TC generation. Regression IUs are flagged for re-run, not regenerated.
- **Baseline present**: tc-generator.md must not regenerate TCs already covered in the baseline. Gap-fill only.
- **Automation not requested**: stop after tc-generator.md. Do not run playwright-generator.md.

---

## Conflict Resolution

If the IU list contains conflicting signals (e.g. a CR that contradicts an existing BRD requirement):

```
⚠️ CONFLICT DETECTED
IU-[X] (from CR) contradicts IU-[Y] (from BRD Section Z).
CR takes precedence for scope. Flagging IU-[Y] as SUPERSEDED.
Recommend: confirm with stakeholder before retiring TC-[N].
```

---

## Orchestrator Rules

- Never skip cr-analyzer.md when a CR is detected — even if the CR seems small.
- Never run tc-generator.md without a completed IU list from normalizer.md.
- Never run playwright-generator.md without a completed TC set from tc-generator.md.
- If domain context is not specified, pass "domain: unspecified" to all downstream skills — they will apply generic rules and flag domain-specific assumptions.
