# traceability-manager.md

> Runs after qa-analyzer.md (or cr-analyzer.md in CR mode).
> Builds the traceability plan before TCs are generated.
> Maintains the living matrix through CR updates.
> Generic — works for any domain, any project.

---

## Responsibility

Translate the analyzed IU list into a TC coverage plan.
Produce the traceability matrix.
In CR mode: update the matrix, flag retired and superseded entries.

This is the bridge between analysis and generation. tc-generator.md uses this plan as its input.

---

## Coverage Rules

Minimum TC count per IU by risk level:

| Risk | Positive | Negative | Boundary | Security/Auth | Total min |
|---|---|---|---|---|---|
| P1 | 2 | 3 | 2 | 1 | 8 |
| P2 | 1 | 2 | 1 | — | 4 |
| P3 | 1 | 1 | 1 | — | 3 |
| P4 | 1 | 1 | — | — | 2 |

Security/Auth column applies when the IU involves authentication, authorization, session management, or permission control — regardless of the domain.

---

## Traceability Plan Output

Produce the plan before any TCs are written:

```
📐 TRACEABILITY PLAN
──────────────────────────────────────────────────────
IU-001 | [short description] | P1
  TC-001 : Positive — [scenario title]
  TC-002 : Positive — [alternate happy path]
  TC-003 : Negative — [invalid input scenario]
  TC-004 : Negative — [boundary breach scenario]
  TC-005 : Negative — [missing required field]
  TC-006 : Boundary — [at lower limit]
  TC-007 : Boundary — [at upper limit]
  TC-008 : Security — [unauthorized access attempt]

IU-002 | [short description] | P2
  TC-009 : Positive — [scenario title]
  TC-010 : Negative — [scenario title]
  TC-011 : Negative — [scenario title]
  TC-012 : Boundary — [scenario title]
...
──────────────────────────────────────────────────────
Total TCs planned : [N]
P1 TCs            : [N]
P2 TCs            : [N]
P3 TCs            : [N]
P4 TCs            : [N]
──────────────────────────────────────────────────────
```

---

## Traceability Matrix Output

After TC generation, maintain the living matrix:

```
📊 TRACEABILITY MATRIX
──────────────────────────────────────────────────────
IU-001 | [description] | TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-008 | ✅ Covered
IU-002 | [description] | TC-009, TC-010, TC-011, TC-012 | ✅ Covered
IU-003 | [description] | — | ❌ Not covered — [reason]
──────────────────────────────────────────────────────
Coverage rate : [N]% ([covered IUs] / [total IUs])
Gaps          : [N] IUs with zero TC coverage
```

---

## CR Mode: Matrix Update Rules

When running in CR Delta Mode:

```
📊 MATRIX UPDATE (CR-[ID])
──────────────────────────────────────────────────────
RETIRED    : TC-[N] — IU-[N] superseded by CR delta
UPDATED    : TC-[N] — expected result changed per CR-[ID]
NEW        : TC-[N], TC-[N] — added for delta IU-[N]
REGRESSION : TC-[N], TC-[N] — unchanged but in regression scope
──────────────────────────────────────────────────────
```

---

## Gap Reporting

If any IU has zero planned TCs, report it:

```
⚠️ COVERAGE GAP
IU-[N] | [description] | Risk: [P?]
Reason: [ambiguity unresolved / untestable as written / awaiting confirmation]
Action needed: [what must be provided before TCs can be generated]
```

---

## Rules

- Never hand off to tc-generator.md with an incomplete plan.
- Every IU in the plan must have at least one TC assigned, or a documented gap reason.
- In CR mode, never include non-delta IUs in the new TC plan — regression IUs go in the regression list only.
- If coverage rules cannot be met (e.g. a P1 IU has insufficient requirement detail for 8 TCs), document why and generate what is possible.
