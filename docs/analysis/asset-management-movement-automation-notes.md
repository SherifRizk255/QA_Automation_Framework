# Asset Management — Movement Automation Notes

> Living notes on the Movement module: discovery findings, open gaps, and the
> lifecycle (setup/teardown) design for the 32-case intake batch
> (TC-MOV-001..032, ingested 2026-08-27 via `docs/ai-workflow/templates/test-case-intake-template.json`).
> Read this before touching `pages/portal-pages/movement/`, `fixtures/`, or
> `tests/regression-tcs/movement/` (none exist yet — this is a brand-new module).

---

## 1. Discovery status

**Route** — confirmed live from the header link's own `href`:
`ROUTES.portal.movement = '#/asset-movement'` (in `config/resources.ts`).

### 1.0 Live pass 2026-08-27 #2 — MAKER role applied (New Movement dialog inventoried)

Ran `tests/smoke/_zz-discover-movement-locators.spec.ts` with
`roleApplier.ensureRoleApplied('MAKER')`. The **New Movement dialog is now
fully reachable and inventoried** — DOM dump in
`reports/system-walkthrough/movement/movement-new-dialog.html`, Actions-menu dump in
`reports/system-walkthrough/movement/movement-actions-menu.html`. 17 `MOVEMENT.*` locator entries
committed to `docs/analysis/locator-repository.json`.

**Headline finding — the New Movement dialog reuses the `.tracking-dialog`
markup wholesale**, exactly like Add Disposal does. Same `role=dialog`, same
`.adv-filters` 8-field asset picker, same `table tbody tr` rows + `.p-checkbox-box`
selection, same `p-paginator`, same `"N Show Assets"` + Cancel + Save footer,
same `input[type="file"]` attachment (`.pdf,.doc,.docx,.jpg,.jpeg,.png`, 5 MB,
choose-label **"Import"**). **Reuse `TAGGING.DIALOG.*` for all of those** — do
not rebuild. Only these are Movement-specific:

| Field | Locator (committed) | Notes |
|---|---|---|
| Movement Type toggle | `MOVEMENT.DIALOG.MOVEMENT_TYPE_OPTION` (param `optionLabel`), `…MOVEMENT_TYPE_ACTIVE` | Required 2-button `.type-toggle .type-option`; selected carries `.active`; **default on open = "Selected Assets Movement"**. Other option: "Full Movement". |
| Target Location | `MOVEMENT.DIALOG.TARGET_LOCATION_DROPDOWN` — `role=combobox name=/Target Location/i` | span has real `aria-label`. |
| Location Memo | `MOVEMENT.DIALOG.LOCATION_MEMO_INPUT` — `input[placeholder="Location Memo"]` | required iff a Target Location is chosen. |
| Target Responsible | `MOVEMENT.DIALOG.TARGET_RESPONSIBLE_DROPDOWN` — `role=combobox name=/Target Responsible/i` | real `aria-label`. |
| Target-section rule hint | `MOVEMENT.DIALOG.TARGET_HINT` | literal text: *"Select a target location (with a memo) or a responsible person."* → target block is **EITHER (Location + Memo) OR Responsible**. |
| Reason | `MOVEMENT.DIALOG.REASON_TEXTAREA` — `textarea[placeholder="Reason"]` | required. Placeholder is `"Reason"` here vs. `"Disposal Reason"` on Disposal. |

**Gotchas for the generator (skill 13):**

- `"New Movement"` text resolves to **2 nodes** (dialog header + list button) —
  scope every dialog assertion to `page.getByRole('dialog')`.
- **Business Unit and Department search dropdowns render `aria-disabled="true"`
  / `.p-disabled` on dialog open** — cascade-gated (same as Tagging's picker).
  The exact parent that enables them is **not yet confirmed** — this blocks
  **TC-MOV-010 / TC-MOV-011** as written ("Select a valid Business Unit/Department").
- Attachment "Import" is a `<span>`, not a `<button>` — `getByRole('button',
  {name:'Import'})` returns 0. Use `setInputFiles()` on
  `TAGGING.DIALOG.ATTACHMENT_INPUT` (`input[type="file"]`).
- Search / Clear / Save buttons: the leading icon adds whitespace to the
  accessible name — match with `{ name: 'Search' }` (non-exact) or `hasText`,
  never `{ exact: true }`.
- Search-section text inputs (`Fixed Asset Number`, `Reference Number`,
  `Asset Responsible Name`) and dropdowns carry **no id / name / formcontrolname /
  placeholder** — only a sibling `<label>`. Also the same label strings appear
  as **assets-table column headers**, so label-relative locators MUST be scoped
  to `.adv-filters` (reuse `TAGGING.DIALOG.PICKER_FILTER_COMBOBOX` /
  `…FIXED_ASSET_NUMBER_INPUT` patterns which already do this).
- `Asset Responsible Name` is a free-text `<input>`, **not** a dropdown
  (TC-MOV-006 wording "enter or select" → it's enter only).
- The assets table is **pre-populated** (~50 assets, 5 pages, 10/page) before
  any search — TC-MOV-012 ("select without filter") is directly supported.

### 1.1 Reachable without Maker (earlier pass) — list grid + Show Details modal

- Movement list grid: columns `Reference / Type / Status / Maker / Created On / Asset Count / Actions / Show Details`.
- "Show Details" record modal: header fields `Type, Status, Requested By, Created On, Asset Count, Target Location, Target Department, Responsible`, plus two tabs — **Show Assets** (Fixed Asset Number, Asset Name, Old Fixed Asset Number, Asset Brand, Model, Current Location, Target Location, Department, Target Department, Responsible, Target Responsible, Status) and **Attachments** (filename + timestamp).
- Container reference IDs are prefixed `AMC-` (Asset Movement Container), e.g. `AMC-00001013` — analogous to Tagging's `ATC-` prefix.

### 1.2 Live pass 2026-08-27 #3 — approved real-data Maker→Checker lifecycle

Ran `_zz-discover-movement-lifecycle.spec.ts` + `_zz-discover-movement-checker.spec.ts`
+ `_zz-discover-movement-assetprofile.spec.ts` against DEMO with real data.
Created **AMC-00001014** (Selected Assets Movement, assets BUIL-000001 +
BUIL-000002, target location "Alex Branch"), submitted, Checker-approved both,
completed. 19 more `MOVEMENT.*` locators committed. Dumps:
`reports/system-walkthrough/movement/lifecycle-*.html`, `checker-*.html`,
`assetprofile-after-movement.html`.

**Cascade — RESOLVED (TC-MOV-010/011 unblocked).** Identical to Tagging's
Current Location → Business Unit → Department cascade and it is data-dependent:
- On dialog open: Business Unit + Department `aria-disabled="true"`.
- After picking a Current Location **that has a BU** (e.g. `Smart Village Two`
  → BU options `HR (324)`, `Tokyo`): Business Unit enables.
- After picking a Business Unit **that has a Dept** (`HR (324)`): Department enables.
- Reuse `AddTrackingDialogComponent.findLocationEnablingBusinessUnit()` /
  `findBusinessUnitEnablingDepartment()` probing — do NOT assume any fixed
  location/BU. `Smart Village Two` + `HR` is the known-good seed for this tenant.

**Created-container `Actions` menu (Maker):** `Add Assets` (pi-plus),
`Attachments` (pi-paperclip), `Submit` (pi-send), **`Delete`** (pi-trash),
`Export` (pi-file-excel). → `MOVEMENT.ACTIONS_MENU.*`.
**`Delete` exists ONLY in Created (pre-submit) state** — this is the concrete
TC_TEARDOWN hook (§3): a Maker-created container that never gets submitted can be
deleted. Once Submitted/Completed the menu loses Add Assets/Submit/Delete.

**Completed-container `Actions` menu:** `Export` only. No delete — audit record.

**Pending-container `Actions` menu (Checker):** `Review & Approve`
(literal `&`, pi-check-circle), **`Return`** (pi-backward — bounces back to
Maker), `Export`.

**Add Assets dialog:** header title "Add Assets"; same `.tracking-dialog`
8-field picker + grid + Save/Cancel as New Movement (no type/target/reason/
attachment). Reuse `TAGGING.DIALOG.*`. → `MOVEMENT.ADD_ASSETS_DIALOG.ROOT`.

**Submit:** confirm `.p-confirm-dialog[role=alertdialog]` "Confirmation",
msg *"Are you sure you want to assign "AMC-…" to the checker?"*, Accept/Reject.
Status `Created` → `Pending Checker Approval`. Save toast on create:
`.p-toast-message-success` detail **"Track Created Successfully"** (copy-paste
from Tagging — don't exact-match "Track").

**Checker Review & Approve dialog** (`MOVEMENT.REVIEW_DIALOG.*`) — same markup
as `TAGGING.DETAILS.*`: header = AMC id, `.detail-summary` (`.ds-item` >
`.ds-k`/`.ds-v`), tabview `Show Assets (N)` / `Attachments (N)`, and a
`.review-bar`:
- `.review-hint`: *"Tick the assets to approve or reject — N selected · M pending"*.
- `.review-actions`: `Approve Selected` / `Reject Selected` / `Complete`
  (all disabled until valid; **Complete enabled only at M pending = 0**).
- Per-asset Status cell (last td): `Initiated by Maker` → `Checker Approved` /
  `Checker Rejected`.
- Approve confirm msg: *"Approve the selected assets?"*. Complete confirm msg:
  *"Are you sure you want to complete this request?"* → status `Completed`.
- **Gotcha:** after Approve and after Complete a `p-blockui` overlay flashes
  (async) — poll, don't assert immediately (same as Tagging Complete). The
  review dialog also **closes itself after Approve** — re-open via Actions →
  Review & Approve to click Complete.

**Asset Profile after completion (`#/AssetsProfileDetails`, search `id="fan"`):**
- **Asset Location → Current Location = "Alex Branch"** (the movement target) ✓
- **General Information → Memo** = the movement's Location Memo string ✓
- **Recent Transactions** timeline shows `Movement · AMC-00001014 · Completed ·
  <timestamp>` (`.ap-ev-module` / `.ap-ev-ref` / `.ap-ev-status`) — good
  assertion target for TC-MOV-029/032. Reuse `ASSET_PROFILE.TX_*`.
- Responsible unchanged ("Ramy") since no Target Responsible was set — correct.

**Only remaining coverage gaps (no blockers):** `Return` (Checker→Maker) and
`Export` (any state) have no TC — raise with the author.

**Known defect (application, not automation) — F2 candidate:**
Several labels render as raw i18n keys instead of translated text: list grid headers `labels.Reference`, `labels.Type`, `labels.Maker`, and inside the Show Details modal `LABELS.TYPE`. Confirmed on both English and Arabic locale toggles — the translation entries are simply missing for this screen. **Do not** locator-match on these literal strings (they may get fixed); match by column position or a stable attribute once one is captured.

**Locator repository**: no `MOVEMENT.*` entries were added yet. The accessibility-tree pass captured structure (roles, labels, tab order) but not concrete CSS attributes (`id`/`formcontrolname`/`class`) needed to meet this repo's locator-confidence bar (see `PORTAL.LOGIN.USERNAME_INPUT` in `docs/analysis/locator-repository.json` for the expected shape). A follow-up pass with DOM inspection (not just the accessibility tree) is needed before `MovementPage` can be written — this is the next concrete step, combined with the Maker-role pass above.

---

## 2. Reuse — do not rebuild

- **Maker/Checker role switching**: `ROLES.MAKER` / `ROLES.CHECKER` + `RoleApplier` / `RoleSwitchOrchestrator` (`fixtures/portalFixtures.ts`) — same mechanism Tagging and Disposal already use. `RoleApplier.ensureRoleApplied(role)` caches per-role-per-worker; a suite that round-trips roles (Maker→Checker→Maker, which TC-MOV-001 and the cross-role regression cases do) must pass `{ force: true }` on the second switch back, per the Tagging gotcha already on file.
- **Checker bulk-action pattern**: Tagging's Checker workflow (`docs/analysis/asset-management-tagging-automation-notes.md` §12) found that Approve/Reject/Complete each open a *second* confirmation modal that is **not** `role=dialog` (match by heading text or a global Accept/Reject target), and that these actions are async (poll a status/hint field rather than asserting immediately). Movement's Review-and-Approve → Approve/Reject → Complete flow (TC-MOV-022..027) is structurally the same pattern — budget for the same gotcha until disproven live.
- **`portalHashRoute()` / `BasePortalPage`**: same navigation pattern as Tagging/Disposal/Reports/Asset Profile.

---

## 3. Lifecycle design (test-lifecycle.md) — setup, teardown, repeatability

Per `docs/test-design/test-lifecycle.md` Rule 3 ("Setup must be idempotent") and
Rule 2 ("Teardown must always execute"), the design below is built so the
32-case suite can run repeatedly against the same shared demo environment
without manual data reset between runs.

### 3.1 Reusable lifecycle actions (fixtures/utilities — not per-TC copies)

| Action | Level | Retryable | Notes |
|---|---|---|---|
| `LOAD_LOCATOR_REPOSITORY` | SUITE_SETUP | yes | existing `LocatorRepository`, no change needed |
| `LOGIN_MAKER` / `LOGIN_CHECKER` | TC_SETUP | yes | existing `loginPage` + `roleApplier.ensureRoleApplied(role)` fixtures |
| `SWITCH_ROLE(role, { force })` | TC_SETUP | yes | needed wherever a TC round-trips roles within one spec |
| `DISCOVER_ELIGIBLE_MOVEMENT_ASSET(criteria?)` | TC_SETUP | yes | **new** — reads the live assets grid at runtime and picks an asset whose `Current Location` differs from the intended target, rather than a hardcoded Fixed Asset Number. This is the key idempotency mechanism: a hardcoded asset would already be *at* the target location after run 1 and silently produce a no-op or a misleading pass/fail on run 2+. Mirrors Tagging's location-cascade probing already on file. |
| `CREATE_MOVEMENT_CONTAINER(assets, target, memo, reason, attachment)` | TC_SETUP (for TCs that depend on an existing container) | yes | the JSON intake already uses `[GENERATED: VALID_LOCATION_MEMO]` / `[GENERATED: VALID_MOVEMENT_REASON]` placeholders — generate a fresh unique string per run (e.g. suffix with a run timestamp/UUID) so repeated runs never collide on uniqueness constraints or produce ambiguous "latest row" matches |
| `CAPTURE_CONTAINER_ID` | TC_SETUP output | yes | capture the created container's reference (`AMC-...`) immediately after creation; every downstream TC in the same chain must key off this captured ID, never off "the latest row" |
| `SUBMIT_MOVEMENT_CONTAINER(containerId)` | part of TC_SETUP for Checker-dependent TCs (022–027) | **no** | state transition Created → Pending Checker Approval; verify current status before submitting so a retry never double-submits |
| `CHECKER_APPROVE/REJECT_ASSETS(containerId, assets)` | TEST EXECUTION or TC_SETUP (depending on which TC owns the assertion) | **no** | state transition, asset-level |
| `COMPLETE_MOVEMENT_CONTAINER(containerId)` | TEST EXECUTION or TC_SETUP | **no** | state transition |
| `LOGOUT_USER` | TC_TEARDOWN | yes | existing pattern |

### 3.2 SUITE_SETUP / SUITE_TEARDOWN (once per run, `beforeAll`/`afterAll`)

```
SUITE_SETUP
 → Verify DEMO environment reachable (existing convention)
 → Load Locator Repository
 → (once MAKER-role discovery is done) verify New Movement button renders for MAKER

SUITE_TEARDOWN
 → Persist any newly discovered/healed MOVEMENT.* locators back to
   docs/analysis/locator-repository.json
 → Archive execution artifacts (existing Cubic HTML / Allure flow — unchanged)
```

No shared Movement container is created at suite level — see §3.4 on why
sharing state across independent TCs here would break repeatability, not help it.

### 3.3 TC_SETUP / TC_TEARDOWN by group

**Group A — read-only navigation/search (TC-MOV-002, 004–013):**
No data is created. `TC_SETUP`: `LOGIN_MAKER` → navigate to Movement → open New Movement. `TC_TEARDOWN`: close the dialog, `LOGOUT_USER`. Fully idempotent by construction — nothing to clean up.

**Group B — validation negatives that never Save (TC-MOV-014, 015):**
Same as Group A. The whole point of the TC is that Save is rejected, so no container is ever created — teardown is trivial (close dialog, logout).

**Group C — single-container creation and its own detail checks (TC-MOV-001, 003, 016, 017):**
`TC_SETUP`: `LOGIN_MAKER` → `DISCOVER_ELIGIBLE_MOVEMENT_ASSET` (dynamic, never a fixed Fixed Asset Number) → for TC-017, `CREATE_MOVEMENT_CONTAINER` + `CAPTURE_CONTAINER_ID` as setup, since TC-017 asserts on details of an *already-created* container, not on creation itself.
`TC_TEARDOWN`: `LOGOUT_USER`. **No delete/cancel of the created container** — per §1, Movement containers appear to be audit-trail records like Disposal/Tagging (no delete action observed so far; flagged as an open assumption pending live confirmation of the Actions menu). Because creation data is generated fresh every run (§3.1), leftover containers from prior runs are harmless — they don't collide with or get matched by later runs' assertions, since every downstream check keys off a freshly captured container ID, never "the newest row" or a fixed count.

**Group D — full Maker→Checker chain (TC-MOV-018–032):**
These are naturally chained, not independent single actions, but each TC must still be **independently executable** per skill 12's absolute rule. Design: each TC in this group performs the **full chain up to the point it needs**, using the reusable actions in §3.1, rather than depending on another TC having run first in the same process:
```
TC_SETUP for TC-MOV-022 (Checker can approve all assets), for example:
 → LOGIN_MAKER
 → DISCOVER_ELIGIBLE_MOVEMENT_ASSET (≥2, since this TC needs multiple assets)
 → CREATE_MOVEMENT_CONTAINER + CAPTURE_CONTAINER_ID
 → SUBMIT_MOVEMENT_CONTAINER(containerId)
 → SWITCH_ROLE('CHECKER', { force: true })
 → navigate to the captured container
TEST EXECUTION
 → Review and Approve → select all → Approve → assert
TC_TEARDOWN
 → LOGOUT_USER
```
This costs more runtime per TC than sharing one container across the group, but it is what makes every TC pass **every run, standalone or in any order** — the exact property you asked for. A shared-container shortcut (create once in a `beforeAll` for Group D) is possible as a later optimization once the suite is stable, but per Rule 5/8 of `test-lifecycle.md` that shared resource would need explicit tracking and its own teardown story (which we can't design yet without confirming whether containers are deletable) — not recommended until the Actions-menu / role gaps in §1 are closed.

**Group E — Asset Profile verification after completion (TC-MOV-029–032):**
`TC_SETUP` extends Group D's chain through `COMPLETE_MOVEMENT_CONTAINER`, capturing the approved/rejected assets' Fixed Asset Numbers and the movement's target location/responsible as `[RUNTIME: ...]` values (already reflected in the intake JSON's test data) — never re-derive these from a second, potentially stale query. `TEST EXECUTION` navigates to Asset Profile and searches by the captured Fixed Asset Number. `TC_TEARDOWN`: `LOGOUT_USER`. No cleanup of Asset Profile data — the module has no "undo a movement" action, so, as with Group C, repeatability relies on every run using freshly discovered/created assets and captured IDs rather than fixed ones.

### 3.4 Why no shared/fixed test data

The intake JSON already avoids hardcoded Fixed Asset Numbers, container IDs, and location values in favor of `[ENV: ...]` (env-configurable), `[GENERATED: ...]` (fresh per run), and `[RUNTIME: ...]` (captured during the same run) placeholders. That is the correct design for this module specifically *because* Movement asset state (Current Location, Responsible) is mutated by the very act of testing it — a fixed seed asset would be in a different state after run 1 than run 2, so assertions like "location differs from current" would silently start failing or passing for the wrong reason on repeat runs. Dynamic discovery + fresh generation is what makes Rule 3 ("setup must be idempotent") achievable here, not incidental.

---

## 3b. Implementation status — TC-MOV-001..032 AUTOMATED (2026-08-27)

All 32 intake cases are implemented and executed green against DEMO.

| Spec | TC IDs |
|---|---|
| `tests/regression-tcs/movement/movement-navigation.spec.ts` | 002, 003 |
| `…/movement-asset-search.spec.ts` | 004–011 |
| `…/movement-asset-selection.spec.ts` | 012, 013 |
| `…/movement-validation.spec.ts` | 014, 015 |
| `…/movement-create.spec.ts` | 016, 017 |
| `…/movement-add-assets.spec.ts` | 018, 019 |
| `…/movement-submit.spec.ts` | 020, 021 |
| `…/movement-checker-review.spec.ts` | 022, 023, 024 |
| `…/movement-checker-completion.spec.ts` | 025, 026, 027, 028 |
| `…/movement-asset-profile.spec.ts` | 029, 030, 031, 032 |
| `…/movement-end-to-end.spec.ts` | 001 |
| `tests/smoke/movement-maker-checker-container.spec.ts` | MOV-SM-001 (critical-path smoke) |

Architecture (reuse, not rebuild):
`MovementPage` → `NewMovementDialogComponent` (which delegates the whole asset
picker to the existing `AddTrackingDialogComponent`) + `MovementReviewComponent`
(mirrors `TrackingContainerDetailsComponent`'s review bar). Shared lifecycle
actions live in `utils/movement/movementLifecycle.ts`; fixtures `movementPage` /
`openMovementPage` registered in the existing `fixtures/portalFixtures.ts`.

**Teardown**: `deleteContainerIfCreated()` uses the Created-state-only `Delete`
action, so un-submitted containers never accumulate. Submitted/Completed
containers are audit records with no delete — left in place, which is safe
because every assertion keys off the runtime-captured AMC- id, never "the newest
row" (§3.4).

### 3b.1 Automation defects found and fixed during implementation

1. **`MOVEMENT.GRID_ROOT` matched the wrong table.** A bare `table` also matched
   the New Movement dialog's asset picker (earlier in the DOM), so `.first()`
   read picker rows as container rows and a pre-existing container was mistaken
   for the newly created one. Healed to
   `table:has(button:has-text("Show Details"))`.
2. **`MOVEMENT.ROW_REFERENCE_CELL` / `ROW_STATUS_CELL` used an unsupported
   `nth` field.** `LocatorRepository` ignores `nth`, so both resolved to all 8
   cells and broke strict mode. Healed to `td:nth-child(1)` / `td:nth-child(3)`.
3. **Picker dropdown filters clicked grid cells instead of options.** The shared
   picker's page-wide text locator collided with asset-grid cell text showing
   the same value (TC-MOV-009 failed exactly this way). Movement now selects via
   the class-scoped `.p-dropdown-item` + exact text — the same gotcha
   `DisposalPage.selectDisposalMethod` documents.
4. **The new container id must be diffed against a pre-dialog snapshot.** The
   open dialog covers the container list, so `previousContainerIds` is captured
   before opening it and passed in.
5. **The container list is oldest-first and paginated 25/page.** Once ~25+
   containers exist a freshly created one is on the LAST page, so page-1-only
   reads never see it. `MovementPage` now paginates: `readAllContainerIds()`
   walks every page, `revealContainer(id)` jumps to Last then scans, and every
   container-scoped action (`openActionsMenu`, `openShowDetails`,
   `assertContainerStatus`, …) reveals the row first. `MOVEMENT.LIST_PAGINATOR.*`
   locators added.
6. **A selected asset can pull in components.** Some assets (e.g. a parent
   building) bring extra assets into the container, so the Maker picker's
   returned FAN list can under-count what the container holds. The smoke reads
   the true asset set from the Checker review dialog rather than trusting the
   picker return.

### 3b.2 Framework gap found (pre-existing, not introduced here)

`RoleSwitchOrchestrator.signInAs()` is unusable against this portal: it asserts
the active role by reading `PORTAL.SHELL.ACTIVE_ROLE_LABEL`, still an
UNVERIFIED / LOW-confidence repository entry (`[data-role-label], .active-role`)
that this build never renders, so every call fails before reaching the module.
No existing spec used it. Movement uses `openMovementAsChecker()`, which follows
the proven Tagging/Disposal flow (apply role on CRM → fresh context → form
login) and still honours skill 19's rule that no two roles share a context.
Worth either healing that locator or retiring the orchestrator.

---

## 4. Open items — ALL DISCOVERY BLOCKERS CLOSED (2026-08-27)

1. ~~Maker New Movement dialog pass.~~ **DONE** (§1.0).
2. ~~DOM-level locator capture.~~ **DONE** (§1.0).
3. ~~Created/Pending `Actions` menu + confirm dialogs + deletability.~~ **DONE**
   (§1.2). Menus fully mapped; **Delete exists in Created state** (teardown hook).
4. ~~Business Unit / Department cascade.~~ **DONE** (§1.2) — same data-dependent
   cascade as Tagging; `Smart Village Two` + `HR` is the known-good seed.
5. Coverage gaps only (not blockers): `Return` and `Export` have no TC.

**Implementation is unblocked.** Next: build `pages/portal-pages/movement/`
(`MovementPage`, `NewMovementDialog` reusing `AddTrackingDialogComponent`,
`MovementReviewDialog` reusing `TAGGING.DETAILS.*`), register fixtures, then
hand TC-MOV-001..032 to skill 12 → skill 13.

## 5. Intake JSON review (`docs/ai-workflow/templates/test-case-intake-template.json`, 32 TCs) vs. live app

Checked TC-MOV-001..032 against the 2026-08-27 Maker pass. Placeholders
(`[ENV:]`/`[GENERATED:]`/`[RUNTIME:]`) are all skill-24-compliant — no
hardcoded data. Discrepancies / risks:

| TC(s) | Issue | Action |
|---|---|---|
| all | `[ENV: MOVEMENT_ROUTE]` / `[ENV: ASSET_PROFILE_ROUTE]` now resolve to `ROUTES.portal.movement` (`#/asset-movement`) / `ROUTES.portal.assetProfile` (`#/AssetsProfileDetails`) — already in `config/resources.ts`. | generator wires these, no `.env` entry needed. |
| TC-MOV-010, 011 | Business Unit / Department search dropdowns are **cascade-gated** (BU needs a Current Location that has a BU; Dept needs a BU that has a Dept). | **Unblocked** (§1.2). Add a precondition: "pick a Current Location that exposes a Business Unit" — the suite must probe (reuse `findLocationEnablingBusinessUnit()`), not hardcode. Known-good seed: `Smart Village Two` → `HR`. |
| TC-MOV-006 | "Enter or select a valid Asset Responsible Name" — the field is a **free-text input**, not a dropdown. | Reword to "Enter". |
| TC-MOV-016 businessRules | Missing the **EITHER (Target Location + Memo) OR (Target Responsible)** rule shown in the dialog hint. | Add business rule; consider a negative TC for "neither supplied". |
| TC-MOV-018, 020, 022, 025, 027 | Actions-menu items + confirm dialogs + review flow. | **Unblocked** (§1.2) — `Add Assets`, `Submit`, `Review & Approve` (literal `&`), `Approve Selected`/`Reject Selected`/`Complete`, all confirm messages, and the async `p-blockui` gotcha are all captured. |
| TC-MOV-017 / TC_TEARDOWN | Container deletability was an open assumption. | **Resolved** — `Delete` action exists in Created (pre-submit) state only. Group C/D teardown can delete an un-submitted container; submitted/completed ones stay (audit). |
| TC-MOV-001 step "window ... title New Movement" | `"New Movement"` matches 2 nodes. | generator note: scope to `getByRole('dialog')`. |
| TC-MOV-029..032 | Asset Profile assertion targets. | Confirmed: Current Location (Asset Location section), Memo (General Information), and a `Movement · <AMC id> · Completed` row in Recent Transactions all reflect the completed movement. |
| — | No TC for `Return` (Checker→Maker) or `Export`. | Coverage gaps — raise with author. |

Otherwise the 32 TCs are internally consistent, independently executable per
skill 12, and the lifecycle design in §3 still holds. **All discovery blockers
are closed (§4)** — the batch is ready for skill 12 → skill 13.

### 5.1 Test data left on DEMO by the discovery pass

`AMC-00001014` — Selected Assets Movement, assets **BUIL-000001** and
**BUIL-000002**, target location **Alex Branch**, status **Completed**. Both
assets' Current Location is now "Alex Branch" (was "--"). Harmless for future
runs since the idempotent design (§3.4) discovers fresh assets every run, but
noted here so it isn't mistaken for a defect.
