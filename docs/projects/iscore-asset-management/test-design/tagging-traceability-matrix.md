# Tagging — Traceability Matrix

> Stage 10 (Traceability Manager), skill `11-traceability-manager.md`. Built
> from `tagging-qa-analysis.md` (master-workflow Rule 5: never run this
> without Analyzer output). Feeds TC Generator (Rule 6) and Automation
> Implementation (Rule 7). Preserves the REQ → IU → SCN → TC → AUT chain
> that Self-Healing (skill 16) must never break.

## Intent Unit inventory

| IU | Requirement | Canonical behavior |
|---|---|---|
| IU-001 | REQ-001 | Authenticated session can reach the Tagging module, by header link or direct route, with header/route agreement. |
| IU-002 | REQ-002 | An authenticated session can be explicitly terminated. |
| IU-003 | REQ-003 | The login → navigate → logout → re-login → navigate cycle is repeatable without residual state. |
| IU-004 | REQ-004 | The Add Tracking dialog is a modal creation surface with two dismissal paths, both leaving no residual open state. |
| IU-005 | REQ-005 | The advanced filter panel narrows the grid on a valid value, restores on reset, and reports an explicit empty state on no match. |
| IU-006 | REQ-006 | Grid row selectability is checkbox-state-driven; submission is gated on a non-empty, all-eligible selection. |
| IU-007 | REQ-007 | A valid selection can be submitted to the container and the grid reflects the outcome. |

## Scenario inventory

| SCN | IU | Scenario |
|---|---|---|
| SCN-001 | IU-001 | Header link is available and opens Tagging. |
| SCN-002 | IU-001 | Header-link navigation and direct-route navigation land on the same state. |
| SCN-003 | IU-001 | Direct route works without ever using the header. |
| SCN-004 | IU-002 | Logout returns to the login route. |
| SCN-005 | IU-003 | Full cycle repeats cleanly after logout. |
| SCN-006 | IU-004 | Dialog opens for creation with title + at least one editable field. |
| SCN-007 | IU-004 | Cancel closes the dialog. |
| SCN-008 | IU-004 | Escape closes the dialog. |
| SCN-009 | IU-004 | Dialog reopens cleanly after a prior cancel (no stuck state). |
| SCN-010 | IU-005 | Filter panel expands. |
| SCN-011 | IU-005 | A matching filter value narrows the grid (count decreases, stays > 0). |
| SCN-012 | IU-005 | Reset restores the pre-filter row count. |
| SCN-013 | IU-005 | A guaranteed non-matching value produces the empty state. |
| SCN-014 | IU-005 | The panel reflects back the value that was applied. |
| SCN-015 | IU-006 / IU-007 | Submit is disabled with an empty selection. |
| SCN-016 | IU-006 / IU-007 | A single eligible row can be selected and submitted; grid count decreases by exactly the submitted count. |
| SCN-017 | IU-006 | An ineligible row's checkbox is absent/disabled and cannot be checked. |
| SCN-018 | IU-006 | Clearing the selection returns the checked count to zero. |
| SCN-019 | IU-007 | Multiple eligible rows (`TEST_DATA.tagging.multiSelectCount`) can be selected and submitted together. |
| SCN-020 | IU-007 | Select-all checks exactly the eligible-row count, and that selection submits. |

## Full traceability chain

| REQ | IU | SCN | TC | Spec file | Automation status |
|---|---|---|---|---|---|
| REQ-001 | IU-001 | SCN-001 | TC-AUTH-ASSET-010 | `authentication/login-tagging-session-cycle.spec.ts` | Automated |
| REQ-001 | IU-001 | SCN-001 | TC-TAG-ASSET-001 | `tagging/tagging-navigation.spec.ts` | Automated |
| REQ-001 | IU-001 | SCN-002 | TC-TAG-ASSET-002 | `tagging/tagging-navigation.spec.ts` | Automated |
| REQ-001 | IU-001 | SCN-003 | TC-TAG-ASSET-003 | `tagging/tagging-navigation.spec.ts` | Automated |
| REQ-002 | IU-002 | SCN-004 | TC-AUTH-ASSET-011 | `authentication/login-tagging-session-cycle.spec.ts` | Automated |
| REQ-003 | IU-003 | SCN-005 | TC-AUTH-ASSET-012 | `authentication/login-tagging-session-cycle.spec.ts` | Automated |
| REQ-004 | IU-004 | SCN-006 | TC-TAG-ASSET-010 | `tagging/tagging-creation-dialog.spec.ts` | Automated |
| REQ-004 | IU-004 | SCN-007 | TC-TAG-ASSET-011 | `tagging/tagging-creation-dialog.spec.ts` | Automated |
| REQ-004 | IU-004 | SCN-008 | TC-TAG-ASSET-012 | `tagging/tagging-creation-dialog.spec.ts` | Automated |
| REQ-004 | IU-004 | SCN-009 | TC-TAG-ASSET-013 | `tagging/tagging-creation-dialog.spec.ts` | Automated |
| REQ-005 | IU-005 | SCN-010 | TC-TAG-ASSET-020 | `tagging/tagging-advanced-filters.spec.ts` | Automated |
| REQ-005 | IU-005 | SCN-011 | TC-TAG-ASSET-021 | `tagging/tagging-advanced-filters.spec.ts` | Automated |
| REQ-005 | IU-005 | SCN-012 | TC-TAG-ASSET-022 | `tagging/tagging-advanced-filters.spec.ts` | Automated |
| REQ-005 | IU-005 | SCN-013 | TC-TAG-ASSET-023 | `tagging/tagging-advanced-filters.spec.ts` | Automated |
| REQ-005 | IU-005 | SCN-014 | TC-TAG-ASSET-024 | `tagging/tagging-advanced-filters.spec.ts` | Automated |
| REQ-006 / REQ-007 | IU-006 / IU-007 | SCN-015 | TC-TAG-ASSET-030 | `tagging/tagging-asset-container.spec.ts` | Automated |
| REQ-006 / REQ-007 | IU-006 / IU-007 | SCN-016 | TC-TAG-ASSET-031 | `tagging/tagging-asset-container.spec.ts` | Automated |
| REQ-007 | IU-007 | SCN-019 | TC-TAG-ASSET-032 | `tagging/tagging-asset-container.spec.ts` | Automated |
| REQ-007 | IU-007 | SCN-020 | TC-TAG-ASSET-033 | `tagging/tagging-asset-container.spec.ts` | Automated |
| REQ-006 | IU-006 | SCN-017 | TC-TAG-ASSET-034 | `tagging/tagging-asset-container.spec.ts` | Automated (self-skips per run if the live grid has no ineligible row — optional-candidate pattern, skill 23) |
| REQ-006 | IU-006 | SCN-018 | TC-TAG-ASSET-035 | `tagging/tagging-asset-container.spec.ts` | Automated |

21/21 TCs automated. 0 gaps between requirement and automation coverage.
Locator-level trust is tracked separately in `tagging-qa-analysis.md` §4 —
"Automated" here means the chain is complete and executable, not that every
locator has been live-confirmed yet.

## Coverage plan summary

- Requirements covered: 7/7 (100%)
- Intent Units covered: 7/7 (100%)
- Scenarios covered: 20/20 (100%)
- Test cases automated: 21/21 (100%)
