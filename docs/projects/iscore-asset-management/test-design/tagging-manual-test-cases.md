# Tagging — Manual Test Case Set

> Stage 11 (TC Generator), skill `12-tc-generator.md`. Generated from
> `tagging-traceability-matrix.md` (master-workflow Rule 6: never run TC
> Generator without a Traceability Matrix). Role under test: **Maker**
> throughout — the active role is set once via CRM before the suite runs,
> not per case (see `tagging-test-lifecycle.md`).
>
> Preconditions common to every case below (stated once, not repeated per
> row): portal reachable at `ENV.portal.loginUrl`; `PORTAL_USERNAME`/
> `PORTAL_PASSWORD` valid; CRM `cis_users` record's role field already
> `Maker`; the Tagging grid contains at least 2 eligible rows.

---

## Authentication & Session Cycle

### TC-AUTH-ASSET-010 | Maker signs in and opens Tagging from the header
- **Priority**: P1 (blocker)
- **Preconditions**: Common preconditions; browser at the login route.
- **Steps**:
  1. Enter the configured username and password, submit.
  2. Click "Tagging" in the portal header.
- **Expected Result**: Login succeeds (route leaves `/login`); the Tagging module loads and the header shows it as the active module.
- **Test data**: `ENV.portal.username` / `ENV.portal.password`.

### TC-AUTH-ASSET-011 | Maker signs out of the portal
- **Priority**: P1 (critical)
- **Preconditions**: Common preconditions; already authenticated.
- **Steps**:
  1. Trigger logout from the portal shell.
- **Expected Result**: Browser is returned to the login route.

### TC-AUTH-ASSET-012 | Maker repeats the login-Tagging cycle after logout
- **Priority**: P1 (critical)
- **Preconditions**: Common preconditions.
- **Steps**:
  1. Log in; open Tagging from the header; confirm it loaded.
  2. Log out.
  3. Log in again with the same credentials.
  4. Open Tagging from the header again.
- **Expected Result**: Both cycles succeed identically — no residual state from the first cycle blocks or alters the second.

---

## Tagging Navigation

### TC-TAG-ASSET-001 | Tagging is available and opens from the header
- **Priority**: P1 (critical)
- **Preconditions**: Common preconditions; authenticated.
- **Steps**:
  1. Confirm "Tagging" is visible/enabled in the header.
  2. Open it.
- **Expected Result**: Module available before click; loads after click.

### TC-TAG-ASSET-002 | Header link and direct route both resolve to Tagging
- **Priority**: P2 (normal)
- **Steps**:
  1. Open Tagging via the header; confirm loaded.
  2. Navigate directly to the Tagging hash route; confirm loaded.
- **Expected Result**: Both navigation methods land on the same loaded-module state.

### TC-TAG-ASSET-003 | Tagging opens by direct route without using the header
- **Priority**: P2 (normal)
- **Steps**:
  1. Navigate directly to the Tagging hash route (skip the header entirely).
- **Expected Result**: Module loads.

---

## Add Tracking Dialog

### TC-TAG-ASSET-010 | Add Tracking opens the creation dialog with title and fields
- **Priority**: P1 (critical)
- **Preconditions**: On the Tagging module.
- **Steps**:
  1. Click "Add Tracking".
- **Expected Result**: A dialog opens with a visible title and at least one editable field (input/select/textarea).

### TC-TAG-ASSET-011 | Cancel closes the Add Tracking dialog
- **Priority**: P2 (normal)
- **Steps**:
  1. Open the dialog.
  2. Click Cancel.
- **Expected Result**: Dialog closes; no tracking record is created.

### TC-TAG-ASSET-012 | Escape dismisses the Add Tracking dialog
- **Priority**: P2 (normal)
- **Steps**:
  1. Open the dialog.
  2. Press Escape.
- **Expected Result**: Dialog closes.

### TC-TAG-ASSET-013 | Add Tracking dialog reopens cleanly after being cancelled
- **Priority**: P3 (minor)
- **Steps**:
  1. Open the dialog, cancel it.
  2. Open it again.
- **Expected Result**: Second open behaves identically to the first (title + fields present) — no stuck/disabled state from the cancel.

---

## Advanced Filters

### TC-TAG-ASSET-020 | The advanced filter panel opens
- **Priority**: P2 (normal)
- **Steps**:
  1. Click the advanced filters toggle.
- **Expected Result**: Filter panel becomes visible.

### TC-TAG-ASSET-021 | Applying a matching filter narrows the grid
- **Priority**: P1 (critical)
- **Steps**:
  1. Record the current row count (baseline).
  2. Expand filters; set the configured field to a value read from the first live row; apply.
- **Expected Result**: New row count is `> 0` and `<= baseline` — the value is never a hardcoded literal, always derived from a live row.

### TC-TAG-ASSET-022 | Resetting the filter restores the original grid
- **Priority**: P2 (normal)
- **Steps**:
  1. Record baseline count; apply a matching filter (as above).
  2. Click Reset.
- **Expected Result**: Row count returns to the recorded baseline.

### TC-TAG-ASSET-023 | A non-matching filter value shows the empty state
- **Priority**: P2 (normal)
- **Steps**:
  1. Expand filters; apply the configured guaranteed-no-match value.
- **Expected Result**: Grid shows the explicit empty/no-results state.

### TC-TAG-ASSET-024 | The applied filter value is reflected back by the panel
- **Priority**: P3 (minor)
- **Steps**:
  1. Apply a matching filter value (derived from a live row, as in TC-021).
  2. Read the active filter chip/label text.
- **Expected Result**: The active filter labels include the applied value.

---

## Asset Selection & Container Submit

### TC-TAG-ASSET-030 | Submit To Container is disabled with no selection
- **Priority**: P1 (critical)
- **Steps**:
  1. On a freshly loaded grid with nothing checked, inspect the Submit button.
- **Expected Result**: Submit is disabled.

### TC-TAG-ASSET-031 | A single selected asset can be submitted to the container
- **Priority**: P1 (blocker)
- **Steps**:
  1. Record baseline row count.
  2. Check exactly one eligible row.
  3. Confirm Submit is now enabled; click it.
- **Expected Result**: Selection count returned is 1; after submit, grid row count is `baseline - 1`.

### TC-TAG-ASSET-032 | Multiple selected assets can be submitted to the container
- **Priority**: P1 (critical)
- **Steps**:
  1. Record baseline row count.
  2. Check `TEST_DATA.tagging.multiSelectCount` eligible rows.
  3. Confirm Submit is enabled; click it.
- **Expected Result**: Selected count equals the configured target; after submit, grid row count is `baseline - target`.

### TC-TAG-ASSET-033 | Select-all submits every eligible asset to the container
- **Priority**: P1 (critical)
- **Steps**:
  1. Record the eligible-row count.
  2. Click the header select-all checkbox.
  3. Confirm the checked count equals the eligible count; click Submit.
- **Expected Result**: Checked count matches eligible count exactly (no ineligible row gets silently checked); submit succeeds.

### TC-TAG-ASSET-034 | An ineligible asset row cannot be selected
- **Priority**: P2 (normal)
- **Steps**:
  1. Locate the first row whose checkbox is absent or disabled.
  2. Attempt to assert it is not selectable.
- **Expected Result**: The row's checkbox is either absent or disabled (never checkable). If the current grid has no ineligible row, this case self-skips with an explicit reason rather than reporting a false pass — a genuinely optional precondition, not a suppressed failure.

### TC-TAG-ASSET-035 | Clearing the selection resets the checked asset count to zero
- **Priority**: P2 (normal)
- **Steps**:
  1. Select `TEST_DATA.tagging.multiSelectCount` eligible rows.
  2. Clear the selection.
- **Expected Result**: Checked count is 0.

---

21 manual test cases, one-to-one with the 21 automated regression cases in
`tests/regression-tcs/{authentication,tagging}/`. See
`tagging-automation-coverage.md` for the automation mapping and
`tagging-test-lifecycle.md` for setup/teardown ownership.
