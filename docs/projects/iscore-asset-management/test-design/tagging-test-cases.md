# IScore Asset Management — Tagging Regression Test Cases

> Test design artifact (skills 11/12) for `tests/regression-tcs/asset-management/`.
> Role under test: Maker, via `fixtures/assetManagementFixtures.ts`.
> Locator status: every `ASSET.*` repository entry is `UNVERIFIED` — see
> `docs/projects/iscore-asset-management/project-profile.md` §"Locator verification status".

| TC id | Spec file | Severity | Scenario |
|---|---|---|---|
| TC-AUTH-ASSET-010 | authentication/login-tagging-session-cycle.spec.ts | blocker | Sign in, open Tagging from the header |
| TC-AUTH-ASSET-011 | authentication/login-tagging-session-cycle.spec.ts | critical | Sign out of the portal |
| TC-AUTH-ASSET-012 | authentication/login-tagging-session-cycle.spec.ts | critical | Repeat login → Tagging cycle after logout |
| TC-TAG-ASSET-001 | tagging/tagging-navigation.spec.ts | critical | Tagging link available and opens from header |
| TC-TAG-ASSET-002 | tagging/tagging-navigation.spec.ts | normal | Header link and direct route agree |
| TC-TAG-ASSET-003 | tagging/tagging-navigation.spec.ts | normal | Direct route opens Tagging without the header |
| TC-TAG-ASSET-010 | tagging/tagging-creation-dialog.spec.ts | critical | Add Tracking opens dialog with title + fields |
| TC-TAG-ASSET-011 | tagging/tagging-creation-dialog.spec.ts | normal | Cancel closes the dialog |
| TC-TAG-ASSET-012 | tagging/tagging-creation-dialog.spec.ts | normal | Escape closes the dialog |
| TC-TAG-ASSET-013 | tagging/tagging-creation-dialog.spec.ts | minor | Dialog reopens cleanly after cancel |
| TC-TAG-ASSET-020 | tagging/tagging-advanced-filters.spec.ts | normal | Advanced filter panel opens |
| TC-TAG-ASSET-021 | tagging/tagging-advanced-filters.spec.ts | critical | Matching filter narrows the grid |
| TC-TAG-ASSET-022 | tagging/tagging-advanced-filters.spec.ts | normal | Reset restores the original grid |
| TC-TAG-ASSET-023 | tagging/tagging-advanced-filters.spec.ts | normal | Non-matching filter shows empty state |
| TC-TAG-ASSET-024 | tagging/tagging-advanced-filters.spec.ts | minor | Applied filter value is reflected back |
| TC-TAG-ASSET-030 | tagging/tagging-asset-container.spec.ts | critical | Submit disabled with no selection |
| TC-TAG-ASSET-031 | tagging/tagging-asset-container.spec.ts | blocker | Single asset submitted to container |
| TC-TAG-ASSET-032 | tagging/tagging-asset-container.spec.ts | critical | Multiple assets submitted to container |
| TC-TAG-ASSET-033 | tagging/tagging-asset-container.spec.ts | critical | Select-all submits every eligible asset |
| TC-TAG-ASSET-034 | tagging/tagging-asset-container.spec.ts | normal | Ineligible asset row cannot be selected |
| TC-TAG-ASSET-035 | tagging/tagging-asset-container.spec.ts | normal | Clearing selection resets checked count to zero |

21 regression cases across 5 spec files, plus 13 offline framework self-tests
(`tests/framework/asset-management/resources-contract.spec.ts`,
`locator-repository-integrity.spec.ts`) that require no live app.

## Environment prerequisites

* `.env` populated with `ASSET_PORTAL_*` and `ASSET_CRM_*` (see `.env.example`).
* The Tagging grid must contain at least 2 eligible (checkbox-selectable) asset
  rows for TC-TAG-ASSET-032/033/035, and ideally at least 1 ineligible row for
  TC-TAG-ASSET-034 — that case self-skips (optional-candidate pattern, skill 23)
  when the current grid has none.
* Before this suite's results can be trusted: run a live system walkthrough
  (skill 02) to promote the `ASSET.*` locator repository entries from
  `UNVERIFIED` to `ACTIVE`, per skill 24's discovery-vs-committed distinction.
