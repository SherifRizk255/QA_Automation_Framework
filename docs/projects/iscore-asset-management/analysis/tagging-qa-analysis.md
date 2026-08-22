# Tagging — QA Analysis Report

> Stage 09A (QA Analyzer), skill `09-qa-analyzer.md`. Runs after Orchestrator,
> before Traceability Manager (master-workflow Rule 4/5). Source: the 7
> Tagging requirements from the IScore Asset Management work order (Maker
> role, regression suite, cross-system CRM role write + portal login).

---

## 1. Requirement inventory

| REQ | Statement | Domain |
|---|---|---|
| REQ-001 | Log in with valid credentials, open Tagging from the header, confirm the module opens. | Navigation |
| REQ-002 | Sign out of the portal. | Session |
| REQ-003 | Repeat login → Tagging after logout; the cycle must be stable. | Session |
| REQ-004 | Add Tracking dialog: opens with title + editable fields; cancel and Escape both close it without side effects. | Tagging / Dialog |
| REQ-005 | Advanced filters: open, apply a narrowing filter, verify results, reset, verify empty/no-match state. | Tagging / Filters |
| REQ-006 | Asset selection via checkboxes: single, multiple, select-all; ineligible assets cannot be selected. | Tagging / Grid |
| REQ-007 | Submit selected assets to the container; confirm acceptance / list update. | Tagging / Submit |

## 2. Risk scoring

| REQ | Risk | Rationale | Severity mapping (skill 21) |
|---|---|---|---|
| REQ-001 | P1 | Release-blocking — nothing else is reachable without login+navigation. | blocker |
| REQ-002 | P1 | Session termination; a stuck session blocks every subsequent regression run. | critical |
| REQ-003 | P1 | Proves the auth cycle itself is stable, not a one-shot fluke. | critical |
| REQ-004 | P2 | Entry point for creating tracking records; failure blocks the Maker workflow's create path. | critical (open) / normal (cancel, escape) |
| REQ-005 | P2 | Filters narrow a potentially large grid; core to finding the right assets, not release-blocking on its own. | critical (narrows) / normal (open, reset, empty) / minor (value readback) |
| REQ-006 | P1 | Core business action — wrong selection state means wrong assets get tagged. Ineligible-selection leak is a data-integrity risk. | critical (disabled/enabled transitions, select-all) / normal (ineligible block, clear) |
| REQ-007 | P1 | The actual business outcome of the whole flow — assets reaching the container. | blocker (single) / critical (multi, select-all) |

## 3. Dependency mapping

```
REQ-001 (login + nav)
  └─ prerequisite for REQ-002..REQ-007 (every other requirement needs an
     authenticated, Tagging-loaded session)
REQ-003 depends on REQ-001 and REQ-002 (repeats the cycle they each prove)
REQ-006 (selection) is a prerequisite for REQ-007 (submit) — cannot submit
  without a valid checked selection
REQ-005 (filters) is independent of REQ-006/007 but shares the same grid
  component (AssetSelectionGridComponent) — a locator break in the grid
  root/row/cell entries risks both
```

External dependency: **CRM role field** (`cis_users.cis_role` = Maker) is a
precondition for the whole suite but is NOT re-verified per test — see
`tagging-test-lifecycle.md` for why (suite-level, not case-level, setup).

## 4. Gap analysis

| Gap | Status | Notes |
|---|---|---|
| Checker / Finance Checker role behavior | **Out of scope for this suite** | `signInAs()`/`RoleSwitchOrchestrator` exist and are proven by construction (skill 19/20 pattern), but no TC currently exercises a role other than Maker. Not a defect — the work order scoped Maker only. |
| Live DOM confirmation of locators | **Open** | All `PORTAL.*`/`TAGGING.*`/`CRM.*` locator repository entries are `UNVERIFIED` (skill 02 walkthrough not yet run against the live app from a network that can reach it). Automation is trustworthy structurally, not yet empirically. |
| Concurrent-user grid state | **Not covered** | REQ-006/007 assume the tester has exclusive use of the demo tenant's grid (skill 20 "latest row" caveat) — no correlation-key based selection exists because Tagging has no natural unique business key exposed pre-selection other than the identifier cell read at runtime. |
| Multi-page / large grid pagination | **Unknown, not covered** | Requirements never mention pagination; TCs assume all rows render in one grid view. If the live grid paginates, `TAGGING.ROW` scoping and `assertRowCount()` after submit (TC-TAG-ASSET-031/032) would need revisiting once live-verified. |

## 5. Coverage intent

Every REQ maps to at least one TC (see `tagging-traceability-matrix.md`).
Coverage intent per REQ:

- REQ-001/002/003 → session lifecycle proven end-to-end, including a full
  repeat cycle (not just first-login).
- REQ-004 → positive path (open, title, fields) + both dismissal paths
  (cancel, Escape) + idempotency (reopen after cancel).
- REQ-005 → open, narrow (positive), reset (restores baseline), empty state
  (negative), and value-readback (UI truthfulness) — five distinct angles
  on one requirement, deliberately.
- REQ-006/007 → disabled-state gate, single, multiple, select-all, ineligible
  blocking, and clear-selection — the full selection/submission state
  machine, not just the happy path.

## 6. Domain rules extracted

1. The active role is a CRM field, never a portal-side toggle (role model,
   `project-profile.md`).
2. A row's checkbox absence/disabled state is the sole source of truth for
   selectability — never inferred from a status label (REQ-006, mirrored in
   `AssetSelectionGridComponent`'s doc comment and skill 24's locator rule).
3. Filter values must be derived from the live grid, never pinned literals
   (skill 24 discovery-vs-committed distinction, applied at the test-data
   level too) — TC-TAG-ASSET-021/022/024 read `readAssetIdentifier(0)` rather
   than hardcoding a category value.
4. The header row is structurally distinct from data rows (`columnheader` vs
   `cell`) — never positional (`nth(1)`) row exclusion.

## 7. Regression assessment

This is a new module (no prior automated coverage existed before this
suite), so there is no regression baseline to diff against. Every TC below
is net-new coverage. Once locators are live-verified, this report's Gap #2
closes and this suite becomes the regression baseline for future CRs.
