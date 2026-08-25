# Asset Management — Tagging Automation Notes

> Living notes on non-obvious application behavior and automation gotchas
> discovered while building Tagging regression coverage (2026-08-24 onward).
> Read this before touching `pages/portal-pages/tagging/`,
> `pages/components/portal/tagging/`, or `tests/regression-tcs/tagging/`.
> Update it whenever a new gotcha costs you more than a few minutes to find —
> that is exactly the kind of thing this file exists to save the next person.

---

## 1. Two distinct "Advanced Filters" exist — do not conflate them

| | Container list | Add Tracking dialog |
|---|---|---|
| Component | `ContainerListFilterComponent` | `AddTrackingDialogComponent` |
| Locator prefix | `TAGGING.LIST_FILTERS.*` | `TAGGING.DIALOG.*` |
| Fields | Search, Status, Date From, Date To | Fixed Asset Number, Reference Number, Asset Responsible Name, Asset Category, Asset Sub Category, Current Location, Business Unit, Department |
| Panel root | `.adv-filters` | inside `role=dialog` |

The old `AdvancedFilterComponent` (`TAGGING.FILTERS.*`) targets the container
list's toggle button correctly but was never live-verified beyond that; its
`PANEL`/`FIELD`/`APPLY_BUTTON` locators were guesses and did not match reality
(wrong CSS class, wrong button name — "Search" not "Apply"). It has been
superseded by `ContainerListFilterComponent` for anything beyond the toggle.

## 2. Both grids render an empty-state ROW, not zero rows

A no-match filter does **not** produce a `tbody` with zero `tr`s. It renders
exactly one `tr` whose single `td[colspan]` reads a literal message:

- Container list grid: `"No Tracking Activity"`
- Add Tracking / Add Assets picker grid: `"No Data Found"`

Any row-counting or column-reading helper that doesn't explicitly exclude
this row will report **1** for a genuinely empty result instead of **0**.
Both `TaggingPage.containerRows()` and `AddTrackingDialogComponent.assetRows()`
now filter it out via `hasNot`. If you add a new grid-reading helper anywhere
in this module, route it through the existing `assetRows()`/`containerRows()`
private methods rather than hand-rolling a new `table tbody tr` locator —
that's how this bug reappears.

## 3. The Add Tracking picker grid loads asynchronously — wait for it

Opening the dialog does **not** guarantee the asset grid has finished its
first fetch. Reading rows immediately after `assertOpenForCreation()` can
race the fetch and observe zero rows even though the grid is populated a
moment later. `AddTrackingDialogComponent.assertOpenForCreation()` and
`assertOpenWithTitle()` now wait for `TAGGING.DIALOG.ASSET_ROW` to have at
least one visible row (real or empty-state) before returning — do not remove
that wait. The original smoke test never hit this because enough prior steps
(finding the latest Tracking Number, etc.) happened to absorb the load time;
new tests that open the dialog as their first action will hit it reliably.

## 4. `Escape` inside the Add Tracking dialog closes the WHOLE dialog

The dialog itself listens for Escape to dismiss (`dismissWithEscape()` /
TC-TAG-ASSET-012). If you press `page.keyboard.press('Escape')` to close a
PrimeNG dropdown or calendar panel that happens to be open *inside* the
dialog, you close the dialog too, not just the panel — everything after that
point silently operates on a `role=dialog` that no longer exists (usually
surfacing as an unrelated-looking timeout several steps later, not an
immediate error). Close a panel by re-clicking its own trigger (toggle-close)
instead. `ContainerListFilterComponent`'s Escape usages are safe — that panel
is not inside a dialog with its own Escape handler.

## 5. `:text-is()` unreliably fails to click PrimeNG dropdown options

`.p-dropdown-item:text-is("Some Option")` intermittently times out even when
the exact `<li>` with that exact text is confirmed present and visible in the
DOM (reproduced on "Smart Village", 7th of 10 Current Location options).
`getByText(label, { exact: true })` and a `hasText` filter both click it
reliably. `TAGGING.DIALOG.DROPDOWN_OPTION` now uses `type: 'text', exact:
true`. Prefer that pattern for any new parameterized "click the option with
this exact label" locator in this app — don't reach for `:text-is()`.

## 6. Business rule: the Current Location → Business Unit → Department cascade

Verified live end-to-end (not just documented from a spec):

- Business Unit is disabled until a Current Location is chosen.
- Department is disabled until a Business Unit is chosen.
- **The cascade is data-dependent, not just order-dependent**: not every
  Current Location has a Business Unit attached, and not every Business Unit
  has a Department attached. Selecting a childless location leaves Business
  Unit disabled — that is correct behavior, not a bug.
- Asset Sub Category is **not** scoped by Asset Category — it always offers
  the same full option list regardless of which Category is selected.

`AddTrackingDialogComponent.findLocationEnablingBusinessUnit(preferredLocation?)`
and `.findBusinessUnitEnablingDepartment()` probe rather than assume: they
try a preferred seed first (`TEST_DATA.tagging.preferredCascadeLocation`,
default `"Smart Village"`) purely as a fast path, then fall back to every
other option. Never hardcode a single location/business unit as "the one
that works" — use these probes, and `test.skip` the case (with a clear
reason) when no option in the current dataset enables the next level, rather
than failing or asserting an unverified path.

Example confirmed live: `Alex Branch` → Business Unit options
`[Electronics, Tokyo]` → `Electronics` → Department options `[ERP
development, Front end, Merchandising, Project management]`.

## 7. `new TaggingPage(...)` in a spec is a GUIDELINES §8 violation

Never instantiate page objects with `new` inside a spec file. If a test needs
an authenticated-but-not-navigated `TaggingPage` (e.g. to assert navigation
itself, header link vs. direct route), use the `taggingPage` fixture in
`fixtures/portalFixtures.ts` rather than adding another `new TaggingPage(...)`
call site.

## 8. `RoleApplier` caches "once per role per worker" — round-trips need `force`

`RoleApplier.ensureRoleApplied(role)` only writes the CRM role field once per
worker by default (by design, for regression suites that never revert). A
suite that deliberately switches Maker → Checker → Maker (or any round trip)
must pass `{ force: true }`, otherwise the second `ensureRoleApplied('MAKER')`
silently no-ops while the CRM record is actually still Checker. `force`
clears and resets the cache to the single currently-active role rather than
accumulating stale entries.

## 9. Shared demo environment is occasionally flaky — don't over-fix

Observed transient failures this session: `page.goto` timeout to the portal
login page, and `net::ERR_UNEXPECTED` navigating to a CRM record — both
resolved on an immediate retry with no code change, and a raw `curl` to both
hosts during the "outage" returned fast 200/401 responses. Classify a bare
`page.goto`/login timeout as environment (F4) first and retry manually before
assuming a locator or code regression, especially after a long run of
consecutive live sessions against the shared tenant.

## 10. `ROUTES.portal.tagging` was wrong and never actually exercised

`config/resources.ts` had `tagging: '#/tagging'`. The real header link resolves
to `'#/asset-tagging'` (confirmed live via a page snapshot and via
`openByRoute()` landing on Dashboard instead of Tagging). This was never
caught earlier because the only spec exercising direct-route navigation
(`TC-TAG-ASSET-002/003` in `tagging-navigation.spec.ts`) called `new
TaggingPage(...)` directly (a GUIDELINES §8 violation — see §7 above), which
suggests those cases may never have actually run cleanly before. Fixed to
`'#/asset-tagging'`. If a future route constant "looks right" but nothing
exercises `openByRoute()`/direct navigation, don't assume it's correct.

## 11. Date From / Date To controls redisplay empty after Search — filter still works

`ContainerListFilterComponent.setDateFrom/To` types into the PrimeNG
`p-calendar` input and used to close the popup with `Escape`; switching to
`Tab` made no difference. Either way, reading the control's value back after
clicking Search returns `""`, not the date that was chosen — reproduced
consistently. This is **not** a filtering bug: `TC-TAG-ASSET-053/054/055`
independently confirm the grid itself is correctly filtered by the same
values (containers outside the range are genuinely excluded). Treat this as a
control-redisplay quirk, not an automation gap — don't spend more time trying
a different key sequence to "fix" it. `TC-TAG-ASSET-023` documents the empty
redisplay explicitly so a future change (the app starting to show the chosen
date back) surfaces as a deliberate update, not a silent assumption either
way.

## 12. Checker asset-level workflow (now automated — see `TrackingContainerDetailsComponent`)

Per the Asset Container Workflow use-case doc (2026-08-24) and confirmed live,
Show Details on a `Pending Checker Approval` container renders a `.review-bar`
above the asset grid: `.review-hint` text ("Tick the assets to approve or
reject — N selected · M pending"), plus bulk `Approve Selected` / `Reject
Selected` / `Complete` buttons — all disabled until ≥1 asset row is ticked.
`TrackingContainerDetailsComponent` now owns this end-to-end
(`selectAsset`/`selectAllAssets`/`approveSelected`/`rejectSelected`/`complete`,
plus `readReviewCounts()`), and the full Maker→Checker→Approve→Complete flow
is exercised by the smoke test (TC-TAG-ASSET-040).

Three more gotchas found building this, in order encountered:

**a) Every bulk action opens a second, non-`role=dialog` confirmation modal.**
Approve Selected / Reject Selected / Complete each pop a modal titled
"Confirmation" ("Approve/Reject the selected assets?" with Reject/Accept
buttons) — the action only applies once **Accept** is clicked. It is NOT
exposed with `role="dialog"` (unlike the Add Tracking dialog), so
`getByRole('dialog')` finds nothing; match it by its "Confirmation" heading
text or, simpler, target the Accept/Reject buttons globally by role+text
(only one such modal is ever open at a time). Skipping this step is the
classic silent-failure trap: the click "succeeds" but nothing changes, and a
naive wait-for-hint-change assertion just times out with the pending count
unchanged.

**b) Approve/Reject/Complete are all async — wait for the actual state change, not the click.**
Same class of bug as gotcha #3 (grid loading race): clicking Approve Selected
does not itself wait for `.review-hint` to update. Capture the hint text
before clicking, accept the confirmation, then assert the hint text changed
(`not.toHaveText(before)`) before returning.

**c) Complete triggers label printing — its blocking overlay can run 90s+ on an environment with no printer, and two separate elements appear together.**
After accepting Complete's confirmation, a `.p-blockui-document[aria-busy=true]`
overlay AND a separate `img.loader` both appear and intercept clicks. They
must be awaited as **two independent locators** — a combined comma-selector
locator (`'.p-blockui-document[aria-busy="true"], .loader'`) matches 2
elements and violates Playwright strict mode on `toBeHidden`. Budget a long
timeout (90s used here) for this specifically in an environment without a
configured printer. Even after the overlay clears, the Show Details dialog's
own Status tag does **not** refresh in place — you must close the dialog and
reload/reopen the container list to see the terminal status. Confirmed live
terminal value: `"Approved - Ready to Print"`.

## 13. "Approved - Ready to Print" uses different dash characters in the grid vs. the Status filter

Confirmed live: the container-list grid cell renders this status with a
**plain hyphen** (`Approved - Ready to Print`, U+002D), while the Status
filter dropdown renders the identical status with an **em dash**
(`Approved — Ready to Print`, U+2014). A test that reads a status from the
grid and feeds it straight into `selectStatus()` will find zero matches and
time out — this reproduced consistently, it is not flaky. This is a genuine
(if minor) inconsistency in the live app between two surfaces showing the
same value, not an automation defect on its own — but automation must not
assume the two surfaces render identically. `ContainerListFilterComponent.selectStatus()`
now normalizes dash variants (U+2010–U+2015 → `-`) before comparing, so it
works regardless of which punctuation the caller's string came from. Apply
the same normalization if any other status-bearing value is ever compared
across the grid and a filter/dropdown surface.

## 14. Never combine `makerTaggingPage` with another `authenticatedPortal`-based fixture in one test

`makerTaggingPage` runs its own inline `loginPage.goto()` + login (plus
`roleApplier.ensureRoleApplied('MAKER')`) — it does **not** depend on the
`authenticatedPortal` fixture. Any other fixture that *does* depend on
`authenticatedPortal` (e.g. `assetProfilePage`, `taggingPage`,
`openAssetProfilePage`) triggers a second, independent
`loginPage.goto()` + login when combined with `makerTaggingPage` in the same
test. The app does not re-render the login form for an already-authenticated
session, so the second `LoginPage.goto()`'s `#UserName` wait times out —
reproduced consistently across 3 different tests, not environment flakiness.

**Fix**: when a test needs both Tagging data and another module's page
object, use `{ roleApplier, taggingPage, ...otherModulePage }` instead of
`makerTaggingPage` — `taggingPage` depends on the same `authenticatedPortal`
as every other module fixture, so it's cached and reused (one login), and
`roleApplier.ensureRoleApplied('MAKER')` gets you the same Maker role
`makerTaggingPage` would have applied. Call `taggingPage.openFromHeader()`
yourself since (unlike `makerTaggingPage`) it doesn't auto-navigate.

## 16. Asset Profile Recent Transactions: don't assume uniform `<li>` structure

`AssetProfilePage.readTransactions()` originally read `.ap-ev-module` /
`.ap-ev-status` / `.ap-ev-date` with a blind `innerText()` per transaction
list item and timed out on a live asset (reproducible structural variation,
not a wait/race issue — increasing the timeout would not have helped). Fixed
to count-check each sub-locator per item and default to `''` when absent,
so one oddly-shaped transaction entry doesn't crash the read for every other
entry. If you need per-field guarantees again, read the live data first
(`readTransactions()` + an `allure.attachment` dump, see TC-AP-104) rather
than assuming every module/status/date is always present.

## 17. Future Category/Subcategory master-data standardization (not yet live — do not test against it)

`iScore_Asset_Category_Subcategory_Mapping.xlsx` (shared 2026-08-24) defines a
**proposed** standardized 4-category mapping: `HW` Hardware & IT
Infrastructure (10 subcategories), `LPC` Laptops, PCs & End-User Devices (7),
`OE` Office Equipment (11), `FUR` Furniture & Fixtures (10) — 38 total,
explicitly marked "Review note: orange cells require business confirmation
before final master-data import."

This does **not** match the live app today (12 categories observed live,
including duplicates like `"Office equipment"` / `"Office Equipment"` and
`"Furniture & Fixtures"` / `"Furniture and Fixtures"` — see gotcha #6's full
live list). Do not write assertions against this mapping until the import
actually happens; it would just create false failures against current
correct-for-now behavior. Re-check this note once master data is migrated,
then gotcha #6's "Sub Category is not scoped by Category" finding should be
re-verified — this reference file implies category-scoped subcategories are
the intended end state, so that may become a real gap worth testing once live.

## 18. Disposal's Add/Show-Details dialogs reuse Tagging's components directly — verified byte-identical DOM

Live discovery 2026-08-24/25 confirmed the Add Disposal dialog and its Show
Details dialog share the exact same `.tracking-dialog` / `.details-body` /
`.review-bar` markup as Tagging's Add Tracking / Show Details (same 8-field
asset picker, same pagination, same Save/Cancel footer, same Approve
Selected/Reject Selected/Complete review controls). `DisposalPage`
instantiates `AddTrackingDialogComponent` and `TrackingContainerDetailsComponent`
directly (same pattern `TaggingPage` already uses) rather than duplicating
them — only the two Disposal-only fields (Disposal Method dropdown, Disposal
Reason textarea) and the outer container-list structure are module-specific.
Disposal Method's live options: `Scrapped`, `Sold`, `Suspended`. Disposal's
Show Details has a third tab reading "Disposal Reason" (plain text) where
Tagging has "Return Reasons" — otherwise the tab set matches ("Show Assets
(N)", "Attachments (N)").

## 19. `TAGGING.DIALOG.DROPDOWN_OPTION` (bare global text locator) can collide with an unrelated grid cell

`AddTrackingDialogComponent.selectDropdownFilter()` clicks a `.p-dropdown-item`
option via a page-wide `getByText(optionLabel, {exact:true})` locator
(`TAGGING.DIALOG.DROPDOWN_OPTION`, scope GLOBAL). For Tagging's own filter
values this apparently never collided in practice, but wiring Disposal's new
Disposal Method dropdown the same way failed live: `getByText('Scrapped',
{exact:true})` resolved to an asset-grid `<td>Scrapped</td>` behind the open
dialog (a category value in the picker data happens to read "Scrapped" too),
and the click hung waiting for that background cell to become clickable.
Fixed in `DisposalPage.selectDisposalMethod()` by filtering the *class-scoped*
`TAGGING.DIALOG.DROPDOWN_ANY_OPTION` (`.p-dropdown-item`) list by an
exact-anchored regex instead of using the bare global text locator — left
`AddTrackingDialogComponent`/`TAGGING.DIALOG.DROPDOWN_OPTION` itself untouched
since Tagging's own tests still pass against it. If you add another dropdown
field anywhere, prefer the class-scoped-list-plus-filter pattern over the bare
global text locator.

## 20. Combining `page`/`authenticatedPortal` with a second inline login on the SAME page silently bounces to the dashboard

A second flavor of gotcha #14's double-login bug: destructuring both
`authenticatedPortal` and `page` as separate fixture params gives you the
**same underlying `Page` object** (the `authenticatedPortal` fixture just
wraps `page` after logging it in). Calling `loginPage.goto()` +
`loginWithConfiguredUser()` again on that same page to pick up a role switch
does not show a stale/broken login form — the SPA just redirects `#/login`
straight back to the Dashboard because the session is already authenticated,
so the CRM role switch you meant to pick up silently never took effect. Fix:
open a genuine new browser context (`browser.newContext()` +
`context.newPage()`, exactly like `tests/smoke/tagging-maker-checker-tracking-container.spec.ts`
already does for its Checker stage) for every role-switch stage after the
Maker stage, and use `browser`/`roleApplier` fixtures instead of `page` when
the test needs more than one authenticated role in sequence.

## 21. `signInAs()` / `PORTAL.SHELL.ACTIVE_ROLE_LABEL` is unverified and currently broken — use the `roleApplier` + fresh-login pattern instead

`RoleSwitchOrchestrator.signInAs()` (backing the `signInAs` fixture) reads
back the active role via `BasePortalPage.readActiveRoleLabel()`, which
resolves `PORTAL.SHELL.ACTIVE_ROLE_LABEL` (`[data-role-label], .active-role`).
That locator's own repository entry is `repositoryStatus: 'UNVERIFIED'`,
`confidence: 'LOW'`, discoverySource "Reasoned from project profile role
model; not yet confirmed against live DOM" — and live testing 2026-08-25
confirmed it: the element is not present anywhere in the portal shell (the
header only shows the user's name + a chevron, no separate role label), so
`signInAs()` times out on every role every time. Until someone finds where
(or whether) the app surfaces the active role visibly and fixes that locator,
do not use `signInAs`/`roleSwitchOrchestrator` in new tests — use the
established `roleApplier.ensureRoleApplied(role)` + fresh
`browser.newContext()` + `loginPage.goto()`/`loginWithConfiguredUser()`
pattern instead (see gotcha #20 and `makerTaggingPage`).

## 22. Finance Checker role is CRM-valid but portal-rejected — "Your Role Not Accessible This Portal"

Live testing 2026-08-25: `roleApplier.ensureRoleApplied('FINANCE_CHECKER')`
successfully sets and reads back `cis_users`' role field as "Finance Checker"
on CRM (`UserRolePage.assertRoleFieldValue` passes) — the CRM side is fine.
But logging into the portal under that role fails with a red banner reading
exactly **"Your Role Not Accessible This Portal"** (see
`LoginPage.isRoleNotAccessibleErrorVisible()` /
`PORTAL.LOGIN.ROLE_NOT_ACCESSIBLE_ERROR`). This looks like an
environment/entitlement gap on this specific demo tenant (Finance Checker not
provisioned for this portal instance) rather than an automation defect or a
real product bug — but it currently blocks ALL Finance Checker regression
coverage for Disposal. Every Finance Checker test should probe for this
banner immediately after login and `testInfo.skip(...)` with a clear reason
(see `tests/smoke/disposal-maker-checker-financechecker.spec.ts` and
`tests/regression-tcs/disposal/disposal-maker-checker-financechecker.spec.ts`)
rather than failing or silently omitting the stage. Re-run those tests after
this gap is resolved — the Admin Checker → Finance Checker handoff logic
(only Admin-approved assets are actionable; Admin-rejected assets are visible
but read-only, per `TrackingContainerDetailsComponent.isAssetSelectableForReview`)
is already written and should just start passing.

## 23. This environment had a sustained flaky stretch on 2026-08-25 — expect repeated transient failures, not a code regression

Across roughly 90 minutes of Disposal discovery/testing on 2026-08-25, the
SAME shared tenant repeatedly failed in different ways on different attempts
of otherwise-identical steps: `net::ERR_UNEXPECTED` navigating to a CRM user
record, `#UserName` never appearing on a fresh login-page navigation,
`page.goto` outright timing out at 60s on the login route. Each one resolved
cleanly on a bare retry with zero code changes. This is a more severe
instance of gotcha #9, not a new class of problem — if you hit one of these
three exact symptoms while testing Disposal/Finance Checker flows, retry
before assuming a regression in `DisposalPage`, `RoleApplier`, or `LoginPage`.

## 24. Reject Selected opens a DIFFERENT modal than Approve/Complete — a required "Notes" dialog, not the generic Confirmation

Live-verified 2026-08-25 on Disposal (screenshot evidence, not a guess):
clicking **Reject Selected** in Show Details opens a dialog titled "Reject
Selected" with a required **Notes** textarea (red asterisk) and Cancel/Save
buttons — a completely different flow from Approve Selected/Complete, which
open the generic "Confirmation" dialog with Accept/Reject buttons (see
gotcha's `acceptReviewConfirmation()`). `TrackingContainerDetailsComponent.rejectSelected()`
previously (wrongly) reused the same generic-confirmation flow as Approve and
reproducibly timed out waiting for a nonexistent "Accept" button — this
looked exactly like a flaky race at first (4 consecutive identical failures
across environment retries) until a failure screenshot showed the real Notes
dialog sitting there unaddressed. Fixed: `rejectSelected(reason = 'Rejected
via automation')` now fills the Notes textarea and clicks Save, waiting for
that dialog to fully detach. This is the SAME shared component Tagging uses,
so the same fix should apply there — but this session only re-verified it
live against Disposal; if you write a Tagging test that calls
`rejectSelectedAssets()`, treat the Notes-dialog behavior as presumed, not
independently re-confirmed against Tagging's own UI, and re-verify once.

**Lesson**: when a "flaky" failure repeats at the exact same step across
otherwise-varied retries, stop assuming environment flakiness and pull a
failure screenshot — this one was a real, deterministic product-UX
difference (gotcha #23's genuine flakiness was a red herring that delayed
finding it).

## 25. Reports export XLSX needs namespace-prefix normalization AND dynamic header-row detection — see `utils/excelWorkbookReader.ts`

Two independent, real quirks in the Reports module's downloaded `.xlsx`
(verified live 2026-08-25, reproduced outside Playwright with a raw
ExcelJS call, so these are genuine file-format issues, not test-harness
bugs):

1. **Element namespace prefixes vary PER FILE inside the same workbook.**
   `xl/workbook.xml` uses `<x:workbook>`/`<x:sheets>`/`<x:sheet>` (prefix
   `x:`), but `docProps/app.xml` uses a DIFFERENT prefix (`<ap:Properties>`,
   prefix `ap:`) for its own elements. Both are valid OOXML (the prefix is
   just bound to the element's namespace via `xmlns:x=...`/`xmlns:ap=...`),
   but ExcelJS's reader does not recognize prefixed elements at all and
   fails immediately with `Cannot read properties of undefined (reading
   'sheets')`. Fixed by `stripXmlNamespacePrefix()`: unzip with `jszip`,
   regex-strip `<prefix:`/`</prefix:` down to `<`/`</` in EVERY `.xml` part
   (not hardcoded to one prefix), rezip, then hand the buffer to
   `workbook.xlsx.load()`.
2. **The real header row is not row 1.** Every export leads with a 4-row
   title/metadata banner (`"Asset Register Report"` / `"Period: All"` /
   `"Generated: <timestamp>"` / `"Total assets: N"`, each value repeated
   identically across every column via merged cells) plus one blank spacer
   row, THEN the real header row (`Fixed Asset Number`, `Asset Name`,
   `Serial Number`, `Model`, `Reference Number`, `Old Reference Number`,
   `Status`, `Category`, `Sub-Category`, `Brand`, `Location`, `Business
   Unit`, `Department`, `Responsible`, `HR Code`, `PO Number`, `Created On`
   — live-verified list for the Asset Profile Report; Asset Movement Report
   was not independently checked). `findHeaderRowNumber()` detects it
   generically: a banner row has exactly one DISTINCT non-empty value across
   its cells (because of the identical repeated text); the header row is the
   first row with more than one distinct value, scanned within the first 20
   rows.

Any new report-validation test should go through
`utils/excelWorkbookReader.ts` (`readExcelWorkbook`,
`everyRowMatchesColumnValue`, `distinctColumnValues`) rather than calling
ExcelJS directly — calling ExcelJS directly on a raw download will hit
finding #1 immediately.
