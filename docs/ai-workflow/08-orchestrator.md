# orchestrator.md

> Thin routing layer. Runs after:
- input-detector.md
- intent-preview.md
- requirements-quality-checker.md
- normalizer.md
> Acts as the pipeline routing authority.
> Decides which pipeline path to follow and sets the run context for all downstream skills.
> Generic — works for any domain, any project.

---

## Responsibility

Read:

- Detection Report
- Intent Preview Summary
- Requirements Quality Report
- Intent Unit List

Determine:

- Pipeline route
- Scope
- Coverage strategy
- Downstream skills

---
# Quality Gate (Mandatory)

Before routing:

Review Requirements Quality Report.

If any item is classified as:

Critical Ambiguity
Critical Missing Business Rule
Critical Untestable Requirement

Pipeline status becomes:

BLOCKED

Output:

🚫 PIPELINE BLOCKED

Reason:
Requirements are not sufficiently testable.

Issues:
[List]

Recommended Action:
Clarify requirements and rerun pipeline.

No downstream skill may execute.


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
Requirement      : PASS | WARNING | FAIL
Quality          

Quality Findings:
- Ambiguities : [no. of ambiguities]
- Missing Rules : [no. of missing rules]
- Untestable Requirements : [no. of unstable]
──────────────────────────────────────────────────────
IF Quality Status = FAIL

STOP

Do not execute:

- qa-analyzer
- traceability-manager
- tc-generator
- 13-automation-implementation-agent.md
- reporter

```

---

## Standard Pipeline Route

Activate when: input is BRD, FRD, User Story, Feature List, SDD, Free Text, Visual, or Mixed (without CR).

```
Pipeline Definition Source:
master-workflow.md

Orchestrator Responsibilities:

- Select Standard Mode
- Build Run Context
- Pass routing information to downstream skills

Stage ordering is controlled by master-workflow.md.

```

---

## CR Delta Pipeline Route

Activate when: input is a Change Request or Mixed with CR present.

```
Pipeline Definition Source:
master-workflow.md

Orchestrator Responsibilities:

- Select CR Delta Mode
- Build Run Context
- Pass CR routing information to downstream skills

Stage ordering is controlled by master-workflow.md.
```

---

## Scope Enforcement Rules

- **Standard mode**: all IUs are in scope. Full coverage applies.
- **CR mode**: only delta IUs (new, changed) are in scope for new TC generation. Regression IUs are flagged for re-run, not regenerated.
- **Baseline present**: tc-generator.md must not regenerate TCs already covered in the baseline. Gap-fill only.
- **Automation not requested**: stop after tc-generator.md. Do not run 13-automation-implementation-agent.md.

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
- Never run 13-automation-implementation-agent.md without a completed TC set from tc-generator.md.
- If domain context is not specified, pass "domain: unspecified" to all downstream skills — they will apply generic rules and flag domain-specific assumptions.
