import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ENV, portalHashRoute, ROUTES, TEST_DATA } from '../../../config/resources';
import { MovementReviewComponent } from '../../components/portal/movement/MovementReviewComponent';
import { NewMovementDialogComponent } from '../../components/portal/movement/NewMovementDialogComponent';
import { PortalHeaderComponent } from '../../components/portal/navigation/PortalHeaderComponent';
import { BasePortalPage } from '../BasePortalPage';

const MOVEMENT_MODULE_LABEL = 'Movement';

/** Every movement container reference observed live follows AMC-<zero-padded sequence>, e.g. AMC-00001014. */
const CONTAINER_ID_PATTERN = /^(AMC-)(\d+)$/;

/**
 * Movement module page object (`#/asset-movement`).
 *
 * Verified live 2026-08-27: the New Movement / Add Assets dialogs, the Checker
 * "Review & Approve" dialog, the Show Details summary, and every Submit /
 * Approve / Complete confirmation reuse the exact Tagging/Disposal PrimeNG
 * markup — so this page composes `NewMovementDialogComponent` (which itself
 * delegates the asset picker to `AddTrackingDialogComponent`) and
 * `MovementReviewComponent` rather than duplicating that logic.
 *
 * Movement-specific: the Movement Type toggle, the target-location/memo/reason
 * block, the AMC- container prefix, the "Return" checker action, and the
 * Created-only "Delete" action (the teardown hook for un-submitted containers).
 */
export class MovementPage extends BasePortalPage {
  private readonly header: PortalHeaderComponent;
  private readonly dialog: NewMovementDialogComponent;
  private readonly review: MovementReviewComponent;

  constructor(page: Page, private readonly testInfo?: TestInfo) {
    super(page);
    void this.testInfo;
    this.header = new PortalHeaderComponent(page, this.repository);
    this.dialog = new NewMovementDialogComponent(page, this.repository);
    this.review = new MovementReviewComponent(page, this.repository);
  }

  // ─── Navigation ──────────────────────────────────────────

  async openFromHeader(): Promise<void> {
    await allure.step('Open Movement from the portal header', async () => {
      await this.header.openModule(MOVEMENT_MODULE_LABEL);
      await this.assertMovementModuleLoaded();
    });
  }

  async openByRoute(): Promise<void> {
    await allure.step('Navigate directly to the Movement route', async () => {
      await this.page.goto(portalHashRoute(ROUTES.portal.movement, ENV.portal.loginUrl));
      await this.assertMovementModuleLoaded();
    });
  }

  // ─── New Movement dialog ─────────────────────────────────

  async openNewMovementDialog(): Promise<void> {
    await allure.step('Open the New Movement dialog', async () => {
      await this.newMovementButton().click();
      await this.dialog.assertOpen('New Movement');
    });
  }

  async cancelNewMovementDialog(): Promise<void> {
    await this.dialog.cancel();
  }

  async saveNewMovementContainer(): Promise<void> {
    await this.dialog.save();
  }

  /**
   * Full happy-path creation as Maker: select type, dynamically pick eligible
   * assets, choose a target location that differs from every selected asset's
   * current location, fill memo + reason, attach, save, and capture the new
   * AMC- container id. Returns the runtime ids the Checker / Asset Profile
   * steps key off — never hardcoded.
   */
  async createSelectedAssetsMovement(options: {
    assetCount: number;
    locationMemo: string;
    reason: string;
    attachmentPath: string;
    targetResponsible?: string;
    /**
     * Container ids present BEFORE the dialog was opened. Passed in rather than
     * read here because the open dialog covers the container list, and reading
     * it mid-dialog is what previously let a pre-existing container be mistaken
     * for the newly created one.
     */
    previousContainerIds: readonly string[];
  }): Promise<{ containerId: string; assetNumbers: string[]; targetLocation: string }> {
    return allure.step('Create a Selected Assets Movement container', async () => {
      await this.dialog.selectMovementType('Selected Assets Movement');
      const assetNumbers = await this.dialog.picker.selectEligibleAssets(options.assetCount);

      const currentLocations = await this.readSelectedAssetCurrentLocations(assetNumbers);
      const targetLocation = await this.pickTargetLocationDifferentFrom(currentLocations);

      await this.dialog.selectTargetLocation(targetLocation);
      await this.dialog.enterLocationMemo(options.locationMemo);
      if (options.targetResponsible) {
        await this.dialog.selectTargetResponsible(options.targetResponsible);
      }
      await this.dialog.picker.uploadAttachment(options.attachmentPath);
      await this.dialog.enterReason(options.reason);

      await this.dialog.save();

      const containerId = await this.waitForNewContainerId(options.previousContainerIds);
      await allure.attachment(
        'movement-container',
        JSON.stringify({ containerId, assetNumbers, targetLocation }, null, 2),
        'application/json'
      );
      return { containerId, assetNumbers, targetLocation };
    });
  }

  /** Picks a Target Location option not present in `avoid`; falls back to the first option. */
  async pickTargetLocationDifferentFrom(avoid: readonly string[]): Promise<string> {
    const options = await this.dialog.readTargetLocationOptions();
    const usable = options.filter((option) => option && !/target location/i.test(option));
    const different = usable.find((option) => !avoid.includes(option));
    if (!different) {
      throw new Error(`No Target Location option differs from the selected assets' current locations (${avoid.join(', ')})`);
    }
    return different;
  }

  /** Reads the "Current Location" column (index 8) for the ticked picker rows. */
  private async readSelectedAssetCurrentLocations(fixedAssetNumbers: readonly string[]): Promise<string[]> {
    const rows = this.dialogRoot().locator('table tbody tr');
    const rowCount = await rows.count();
    const locations: string[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const fan = (await row.locator('td').nth(1).innerText()).trim();
      if (fixedAssetNumbers.includes(fan)) {
        locations.push((await row.locator('td').nth(8).innerText()).trim());
      }
    }
    return locations;
  }

  // ─── New Movement dialog: asset picker (delegated) ───────

  async selectMovementType(type: 'Selected Assets Movement' | 'Full Movement'): Promise<void> {
    await this.dialog.selectMovementType(type);
  }

  async setDialogTextFilter(fieldLabel: string, value: string): Promise<void> {
    await this.dialog.picker.setTextFilter(fieldLabel, value);
  }

  async selectDialogDropdownFilter(fieldLabel: string, optionLabel: string): Promise<void> {
    await this.dialog.selectPickerDropdownFilter(fieldLabel, optionLabel);
  }

  /**
   * Applies the picker filters and waits for the grid to settle. The grid
   * re-fetches asynchronously, and a no-match result still renders one
   * "No Data Found" row — so waiting on `tbody tr` (not on a real row) is what
   * makes both the match and the empty-state paths deterministic.
   */
  async searchDialogFilters(): Promise<void> {
    await this.dialog.picker.search();
    await expect(this.dialogRoot().locator('table tbody tr').first()).toBeVisible({ timeout: 20_000 });
  }

  async clearDialogFilters(): Promise<void> {
    await this.dialog.picker.clearSearch();
  }

  async readDialogDropdownOptions(fieldLabel: string): Promise<string[]> {
    return this.dialog.picker.readDropdownOptions(fieldLabel);
  }

  async isDialogFilterEnabled(fieldLabel: string): Promise<boolean> {
    return this.dialog.picker.isFilterFieldEnabled(fieldLabel);
  }

  /** Undefined when no probed Current Location has a Business Unit attached (cascade is data-dependent). */
  async findLocationEnablingBusinessUnit(preferredLocation?: string): Promise<string | undefined> {
    return this.dialog.picker.findLocationEnablingBusinessUnit(
      preferredLocation ?? TEST_DATA.movement.preferredCascadeLocation
    );
  }

  /** Undefined when no probed Business Unit has a Department attached (cascade is data-dependent). */
  async findBusinessUnitEnablingDepartment(): Promise<string | undefined> {
    return this.dialog.picker.findBusinessUnitEnablingDepartment();
  }

  async countDialogAssetRows(): Promise<number> {
    return this.dialog.picker.countAssetRows();
  }

  async readDialogAssetColumn(columnIndex: number): Promise<string[]> {
    return this.dialog.picker.readAssetColumnValues(columnIndex);
  }

  async selectEligibleDialogAssets(count: number, excluded: readonly string[] = []): Promise<string[]> {
    return this.dialog.picker.selectEligibleAssets(count, excluded);
  }

  async selectFirstEligibleDialogAsset(excluded: readonly string[] = []): Promise<string> {
    return this.dialog.picker.selectFirstEligibleAsset(excluded);
  }

  async countCheckedDialogAssetsOnCurrentPage(): Promise<number> {
    return this.dialog.picker.countCheckedAssetsOnCurrentPage();
  }

  async assertDialogAssetChecked(fixedAssetNumber: string): Promise<void> {
    await this.dialog.picker.assertAssetChecked(fixedAssetNumber);
  }

  async assertDialogNoAssetRows(): Promise<void> {
    await this.dialog.picker.assertNoAssetRows();
  }

  // ─── New Movement dialog: Movement-specific fields ───────

  async selectTargetLocation(optionLabel: string): Promise<void> {
    await this.dialog.selectTargetLocation(optionLabel);
  }

  async readTargetLocationOptions(): Promise<string[]> {
    return this.dialog.readTargetLocationOptions();
  }

  async enterLocationMemo(memo: string): Promise<void> {
    await this.dialog.enterLocationMemo(memo);
  }

  async enterMovementReason(reason: string): Promise<void> {
    await this.dialog.enterReason(reason);
  }

  async uploadMovementAttachment(filePath: string): Promise<void> {
    await this.dialog.picker.uploadAttachment(filePath);
  }

  async assertNewMovementDialogOpen(expectedTitle = 'New Movement'): Promise<void> {
    await this.dialog.assertOpen(expectedTitle);
  }

  /**
   * Negative-path save: clicks Save (when enabled) and proves the request was
   * NOT created — the dialog stays open and no new AMC- row appears. The app
   * may gate an invalid form either by disabling Save or by rejecting the
   * click; both satisfy the business rule, so both are accepted here and the
   * observed outcome is attached for the report.
   */
  async assertSaveRejected(): Promise<{ saveWasEnabled: boolean }> {
    return allure.step('Assert the movement request was rejected and no container was created', async () => {
      const previousIds = await this.readAllContainerIds();
      const saveWasEnabled = await this.dialog.attemptSave();

      await expect(
        this.dialogRoot(),
        'The New Movement dialog must stay open when required data is missing'
      ).toBeVisible({ timeout: 10_000 });

      const currentIds = await this.readAllContainerIds();
      expect(
        currentIds.filter((id) => !previousIds.includes(id)),
        'No movement container should be created when required data is missing'
      ).toEqual([]);

      await allure.attachment('save-gate', saveWasEnabled ? 'Save was enabled and rejected' : 'Save was disabled', 'text/plain');
      return { saveWasEnabled };
    });
  }

  // ─── Container list ──────────────────────────────────────

  async findLatestContainerId(): Promise<string> {
    return allure.step('Find the latest movement container id in the grid', async () => {
      const ids = await this.readAllContainerIds();
      let latest: { id: string; sequence: number } | undefined;
      for (const id of ids) {
        const match = id.match(CONTAINER_ID_PATTERN);
        if (!match) {
          continue;
        }
        const sequence = Number(match[2]);
        if (!latest || sequence > latest.sequence) {
          latest = { id, sequence };
        }
      }
      if (!latest) {
        throw new Error('No movement container rows found to determine the latest container id');
      }
      return latest.id;
    });
  }

  /**
   * Reads every container id ACROSS ALL PAGES. Verified live: the container
   * list is sorted oldest-first and paginated 25/page, so a freshly created
   * container is on the LAST page, never page 1 — a page-1-only read would
   * never see it.
   */
  async readAllContainerIds(): Promise<string[]> {
    return this.readContainerColumnAllPages('MOVEMENT.ROW_REFERENCE_CELL');
  }

  async readAllContainerStatuses(): Promise<string[]> {
    return this.readContainerColumnAllPages('MOVEMENT.ROW_STATUS_CELL');
  }

  /**
   * Brings the page that holds `containerId` into view. New containers sit on
   * the last page (oldest-first sort), so this jumps straight to Last and then
   * walks backwards only if needed.
   */
  async revealContainer(containerId: string): Promise<void> {
    await allure.step(`Locate movement container "${containerId}" across the list pages`, async () => {
      if ((await this.containerRow(containerId).count()) > 0) {
        return;
      }
      await this.goToLastListPage();
      if ((await this.containerRow(containerId).count()) > 0) {
        return;
      }
      await this.goToFirstListPage();
      const maxPages = 50;
      for (let page = 0; page < maxPages; page += 1) {
        if ((await this.containerRow(containerId).count()) > 0) {
          return;
        }
        if (!(await this.goToNextListPage())) {
          break;
        }
      }
      throw new Error(`Movement container "${containerId}" was not found on any list page`);
    });
  }

  async readContainerStatus(containerId: string): Promise<string> {
    await this.revealContainer(containerId);
    return (await this.containerStatusCell(containerId).innerText()).trim();
  }

  /** Undefined when no container on the current (unfiltered) grid page has this status. */
  async findContainerIdByStatus(status: string): Promise<string | undefined> {
    const ids = await this.readAllContainerIds();
    const statuses = await this.readAllContainerStatuses();
    const index = statuses.findIndex((value) => value === status);
    return index === -1 ? undefined : ids[index];
  }

  // ─── Actions menu ────────────────────────────────────────

  async openActionsMenu(containerId: string): Promise<void> {
    await allure.step(`Open the Actions menu for movement container "${containerId}"`, async () => {
      await this.revealContainer(containerId);
      await this.containerRow(containerId).getByRole('button').filter({ hasText: 'Actions' }).click();
      await expect(this.actionsMenu()).toBeVisible({ timeout: 10_000 });
    });
  }

  async readActionsMenuItems(containerId: string): Promise<string[]> {
    await this.openActionsMenu(containerId);
    const items = (await this.actionsMenu().getByRole('menuitem').allInnerTexts()).map((text) => text.trim());
    await this.page.keyboard.press('Escape');
    return items;
  }

  async submitContainer(containerId: string): Promise<void> {
    await allure.step(`Submit movement container "${containerId}" to the Checker`, async () => {
      await this.openActionsMenu(containerId);
      await this.repository.locator('MOVEMENT.ACTIONS_MENU.SUBMIT_ITEM').click();
      await this.acceptConfirmationContaining(containerId);
      // The status change is an async round-trip; poll the row rather than sleep.
      await expect(this.containerStatusCell(containerId)).not.toHaveText('Created', { timeout: 30_000 });
    });
  }

  async deleteContainer(containerId: string): Promise<void> {
    await allure.step(`Delete movement container "${containerId}"`, async () => {
      await this.openActionsMenu(containerId);
      await this.repository.locator('MOVEMENT.ACTIONS_MENU.DELETE_ITEM').click();
      await this.acceptConfirmation();
      // Deletion removes the row entirely — wait for that, not a fixed delay.
      await expect(this.containerRow(containerId)).toHaveCount(0, { timeout: 30_000 });
    });
  }

  /** Teardown helper — deletes the container only while it is still un-submitted (Created). Never throws. */
  async deleteContainerIfCreated(containerId: string | undefined): Promise<void> {
    if (!containerId) {
      return;
    }
    await allure.step(`Clean up movement container "${containerId}" if still in Created status`, async () => {
      try {
        await this.openByRoute();
        try {
          await this.revealContainer(containerId);
        } catch {
          return; // already gone (e.g. deleted by a prior attempt)
        }
        const status = await this.readContainerStatus(containerId);
        if (status === 'Created') {
          await this.deleteContainer(containerId);
        }
      } catch (error) {
        await allure.attachment('teardown-cleanup-warning', String(error), 'text/plain');
      }
    });
  }

  async addAssetsFromActions(
    containerId: string,
    count: number,
    excludedFixedAssetNumbers: readonly string[]
  ): Promise<string[]> {
    return allure.step(`Add ${count} asset(s) to container "${containerId}" via Actions`, async () => {
      await this.openActionsMenu(containerId);
      await this.repository.locator('MOVEMENT.ACTIONS_MENU.ADD_ASSETS_ITEM').click();
      await this.dialog.assertOpen('Add Assets');
      const added = await this.dialog.picker.selectEligibleAssets(count, excludedFixedAssetNumbers);
      await this.dialog.picker.save();
      return added;
    });
  }

  // ─── Show Details (read-only) ────────────────────────────

  async openShowDetails(containerId: string): Promise<void> {
    await allure.step(`Open Show Details for movement container "${containerId}"`, async () => {
      await this.revealContainer(containerId);
      await this.containerRow(containerId).getByRole('button').filter({ hasText: 'Show Details' }).click();
      await expect(this.detailsRoot()).toBeVisible({ timeout: 20_000 });
    });
  }

  async closeShowDetails(): Promise<void> {
    await this.repository.locator('TAGGING.DETAILS.CLOSE_BUTTON', { scope: this.detailsRoot() }).click();
    await expect(this.detailsRoot()).toBeHidden({ timeout: 15_000 });
  }

  async readShowDetailsValue(key: string): Promise<string> {
    const value = this.repository.locator('MOVEMENT.DETAILS.SUMMARY_VALUE', {
      scope: this.detailsRoot(),
      parameters: { key },
    });
    return (await value.first().innerText()).trim();
  }

  async readShowDetailsStatusTag(): Promise<string> {
    return (await this.repository.locator('TAGGING.DETAILS.STATUS_TAG', { scope: this.detailsRoot() }).innerText()).trim();
  }

  async readShowDetailsAssetNumbers(): Promise<string[]> {
    const rows = this.repository.locator('TAGGING.DETAILS.ASSET_ROW', { scope: this.detailsRoot() });
    const count = await rows.count();
    const out: string[] = [];
    for (let index = 0; index < count; index += 1) {
      out.push((await rows.nth(index).locator('td').nth(1).innerText()).trim());
    }
    return out.filter(Boolean);
  }

  async assertShowDetailsContainsAsset(fixedAssetNumber: string): Promise<void> {
    const rows = this.repository.locator('TAGGING.DETAILS.ASSET_ROW', { scope: this.detailsRoot() });
    await expect(rows.filter({ hasText: fixedAssetNumber })).toHaveCount(1);
  }

  // ─── Checker review ──────────────────────────────────────

  async openReviewAndApprove(containerId: string): Promise<void> {
    await allure.step(`Open Review & Approve for movement container "${containerId}"`, async () => {
      await this.openActionsMenu(containerId);
      await this.repository.locator('MOVEMENT.ACTIONS_MENU.REVIEW_APPROVE_ITEM').click();
      await this.review.assertOpen();
    });
  }

  /**
   * Re-opens the review dialog if it self-closed. Verified live: the dialog can
   * close itself after an Approve round-trip, so every sequential review step
   * goes through this rather than assuming the dialog stayed open.
   */
  async ensureReviewOpen(containerId: string): Promise<void> {
    if (!(await this.review.isOpen())) {
      await this.openByRoute();
      await this.openReviewAndApprove(containerId);
    }
  }

  async selectAllAssetsForReview(): Promise<void> {
    await this.review.selectAllAssets();
  }

  async selectAssetForReview(fixedAssetNumber: string): Promise<void> {
    await this.review.selectAsset(fixedAssetNumber);
  }

  async deselectAssetForReview(fixedAssetNumber: string): Promise<void> {
    await this.review.deselectAsset(fixedAssetNumber);
  }

  async approveSelectedAssets(): Promise<void> {
    await this.review.approveSelected();
  }

  async rejectSelectedAssets(reason?: string): Promise<void> {
    await this.review.rejectSelected(reason);
  }

  async completeContainerReview(): Promise<void> {
    await this.review.complete();
  }

  async closeReviewDialog(): Promise<void> {
    await this.review.close();
  }

  async readReviewCounts(): Promise<{ selected: number; pending: number }> {
    return this.review.readReviewCounts();
  }

  async readReviewAssetStatus(fixedAssetNumber: string): Promise<string> {
    return this.review.readAssetStatus(fixedAssetNumber);
  }

  async readReviewAssetNumbers(): Promise<string[]> {
    return this.review.readFixedAssetNumbers();
  }

  async isAssetSelectableForReview(fixedAssetNumber: string): Promise<boolean> {
    return this.review.isAssetSelectableForReview(fixedAssetNumber);
  }

  async assertApproveSelectedDisabled(): Promise<void> {
    await this.review.assertApproveSelectedDisabled();
  }

  async assertApproveSelectedEnabled(): Promise<void> {
    await this.review.assertApproveSelectedEnabled();
  }

  async assertRejectSelectedEnabled(): Promise<void> {
    await this.review.assertRejectSelectedEnabled();
  }

  async assertCompleteReviewDisabled(): Promise<void> {
    await this.review.assertCompleteDisabled();
  }

  async assertCompleteReviewEnabled(): Promise<void> {
    await this.review.assertCompleteEnabled();
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertMovementModuleLoaded(): Promise<void> {
    await allure.step('Assert the Movement module is loaded', async () => {
      await expect(this.repository.locator('PORTAL.HEADER.ACTIVE_MODULE_LABEL')).toHaveText(MOVEMENT_MODULE_LABEL, {
        timeout: 30_000,
      });
    });
  }

  async assertNewMovementButtonVisible(): Promise<void> {
    await expect(this.newMovementButton()).toBeVisible({ timeout: 30_000 });
  }

  async assertContainerVisible(containerId: string): Promise<void> {
    await this.revealContainer(containerId);
    await expect(this.containerRow(containerId)).toBeVisible({ timeout: 30_000 });
  }

  async assertContainerStatus(containerId: string, expectedStatus: string): Promise<void> {
    await allure.step(`Assert movement container "${containerId}" status is "${expectedStatus}"`, async () => {
      // The status change is an async round-trip; poll (re-revealing in case a
      // status filter or refresh moved the row to another page).
      await expect(async () => {
        await this.revealContainer(containerId);
        await expect(this.containerStatusCell(containerId)).toHaveText(expectedStatus, { timeout: 5_000 });
      }).toPass({ timeout: 45_000 });
    });
  }

  async assertSaveSuccessToastVisible(): Promise<void> {
    await expect(this.repository.locator('MOVEMENT.SAVE_SUCCESS_TOAST')).toBeVisible({ timeout: 15_000 });
  }

  // ─── Getters (values) ────────────────────────────────────

  async isNewMovementButtonVisible(): Promise<boolean> {
    return this.newMovementButton().isVisible().catch(() => false);
  }

  computeNextContainerId(previousContainerId: string): string {
    const match = previousContainerId.match(CONTAINER_ID_PATTERN);
    if (!match) {
      throw new Error(`Movement container id "${previousContainerId}" does not match the expected AMC-<sequence> format`);
    }
    const [, prefix, digits] = match;
    return `${prefix}${(Number(digits) + 1).toString().padStart(digits.length, '0')}`;
  }

  // ─── Helpers (private) ──────────────────────────────────

  private newMovementButton(): Locator {
    return this.repository.locator('MOVEMENT.NEW_MOVEMENT_BUTTON');
  }

  private gridRoot(): Locator {
    return this.repository.locator('MOVEMENT.GRID_ROOT').first();
  }

  private dialogRoot(): Locator {
    return this.repository.locator('TAGGING.DIALOG.ROOT');
  }

  private detailsRoot(): Locator {
    return this.repository.locator('TAGGING.DETAILS.ROOT');
  }

  private actionsMenu(): Locator {
    return this.repository.locator('MOVEMENT.ACTIONS_MENU.ROOT');
  }

  private containerRows(): Locator {
    return this.repository.locator('MOVEMENT.ROW', { scope: this.gridRoot() });
  }

  private containerRow(containerId: string): Locator {
    return this.containerRows().filter({ hasText: containerId });
  }

  private containerStatusCell(containerId: string): Locator {
    return this.repository.locator('MOVEMENT.ROW_STATUS_CELL', { scope: this.containerRow(containerId) });
  }

  private async readContainerColumn(cellElementId: string): Promise<string[]> {
    const rows = this.containerRows();
    const rowCount = await rows.count();
    const values: string[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      const cell = this.repository.locator(cellElementId, { scope: rows.nth(index) });
      if ((await cell.count()) === 0) {
        continue;
      }
      values.push((await cell.first().innerText()).trim());
    }
    return values.filter(Boolean);
  }

  /** Same as readContainerColumn but walks every list page (from the first). */
  private async readContainerColumnAllPages(cellElementId: string): Promise<string[]> {
    await this.goToFirstListPage();
    const all: string[] = [];
    const maxPages = 50;
    for (let page = 0; page < maxPages; page += 1) {
      all.push(...(await this.readContainerColumn(cellElementId)));
      if (!(await this.goToNextListPage())) {
        break;
      }
    }
    return all;
  }

  private listPaginator(): Locator {
    return this.repository.locator('MOVEMENT.LIST_PAGINATOR').last();
  }

  private firstRowReferenceText(): Locator {
    return this.repository.locator('MOVEMENT.ROW_REFERENCE_CELL', { scope: this.containerRows().first() });
  }

  /** Clicks a paginator control and waits for the grid's first row to actually change. */
  private async clickPaginatorAndSettle(control: Locator): Promise<void> {
    const before = (await this.firstRowReferenceText().innerText().catch(() => '')).trim();
    await control.click();
    await expect(async () => {
      const after = (await this.firstRowReferenceText().innerText().catch(() => '')).trim();
      expect(after && after !== before, 'the list page should have changed').toBeTruthy();
    }).toPass({ timeout: 15_000 });
  }

  private async goToFirstListPage(): Promise<void> {
    const first = this.repository.locator('MOVEMENT.LIST_PAGINATOR.FIRST_PAGE', { scope: this.listPaginator() });
    if ((await first.count()) > 0 && (await first.isEnabled())) {
      await this.clickPaginatorAndSettle(first);
    }
  }

  private async goToLastListPage(): Promise<void> {
    const last = this.repository.locator('MOVEMENT.LIST_PAGINATOR.LAST_PAGE', { scope: this.listPaginator() });
    if ((await last.count()) > 0 && (await last.isEnabled())) {
      await this.clickPaginatorAndSettle(last);
    }
  }

  /** Advances one list page; false when already on the last page. */
  private async goToNextListPage(): Promise<boolean> {
    const next = this.repository.locator('MOVEMENT.LIST_PAGINATOR.NEXT_PAGE', { scope: this.listPaginator() });
    if ((await next.count()) === 0 || !(await next.isEnabled())) {
      return false;
    }
    await this.clickPaginatorAndSettle(next);
    return true;
  }

  private async acceptConfirmation(): Promise<void> {
    const confirm = this.repository.locator('MOVEMENT.CONFIRM_DIALOG.ROOT');
    await expect(confirm).toBeVisible({ timeout: 15_000 });
    await this.repository.locator('MOVEMENT.CONFIRM_DIALOG.ACCEPT_BUTTON').click();
    await expect(confirm).not.toBeAttached({ timeout: 20_000 });
  }

  private async acceptConfirmationContaining(text: string): Promise<void> {
    const confirm = this.repository.locator('MOVEMENT.CONFIRM_DIALOG.ROOT');
    await expect(confirm).toBeVisible({ timeout: 15_000 });
    await expect(confirm).toContainText('Confirmation');
    await expect(confirm).toContainText(text);
    await this.repository.locator('MOVEMENT.CONFIRM_DIALOG.ACCEPT_BUTTON').click();
    await expect(confirm).not.toBeAttached({ timeout: 20_000 });
  }

  /**
   * The list is oldest-first and paginated, so a just-saved container is on the
   * LAST page — jump there and diff against the pre-save snapshot rather than
   * re-reading every page on each poll.
   */
  private async waitForNewContainerId(previousIds: readonly string[]): Promise<string> {
    let containerId: string | undefined;
    await expect(async () => {
      await this.goToLastListPage();
      const lastPageIds = await this.readContainerColumn('MOVEMENT.ROW_REFERENCE_CELL');
      containerId = lastPageIds.find((id) => CONTAINER_ID_PATTERN.test(id) && !previousIds.includes(id));
      expect(containerId, 'a new AMC- container row should appear on the last list page after Save').toBeTruthy();
    }).toPass({ timeout: 30_000 });
    return containerId as string;
  }
}
