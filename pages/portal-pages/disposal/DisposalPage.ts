import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ENV, portalHashRoute, ROUTES } from '../../../config/resources';
import { AddTrackingDialogComponent } from '../../components/portal/tagging/AddTrackingDialogComponent';
import { TrackingContainerDetailsComponent } from '../../components/portal/tagging/TrackingContainerDetailsComponent';
import { PortalHeaderComponent } from '../../components/portal/navigation/PortalHeaderComponent';
import { BasePortalPage } from '../BasePortalPage';

const DISPOSAL_MODULE_LABEL = 'Disposal';

/** Every disposal tracking number observed live follows ADC-<zero-padded sequence>, e.g. ADC-00001027. */
const TRACKING_NUMBER_PATTERN = /^(ADC-)(\d+)$/;

/**
 * Disposal module page object. The Add Disposal dialog and Show Details dialog
 * are byte-identical in DOM structure to Tagging's Add Tracking / Show Details
 * (verified live 2026-08-24: same .tracking-dialog markup, same 8-field asset
 * picker, same Save/Cancel footer, same .details-body/.review-bar review
 * controls) — so this page reuses AddTrackingDialogComponent and
 * TrackingContainerDetailsComponent directly rather than duplicating them.
 * Only the two Disposal-specific fields (Disposal Method dropdown, Disposal
 * Reason textarea) and the outer container-list structure are module-specific.
 */
export class DisposalPage extends BasePortalPage {
  private readonly header: PortalHeaderComponent;
  private readonly dialog: AddTrackingDialogComponent;
  private readonly details: TrackingContainerDetailsComponent;

  constructor(page: Page, private readonly testInfo?: TestInfo) {
    super(page);
    void this.testInfo;
    this.header = new PortalHeaderComponent(page, this.repository);
    this.dialog = new AddTrackingDialogComponent(page, this.repository);
    this.details = new TrackingContainerDetailsComponent(page, this.repository);
  }

  // ─── Navigation ──────────────────────────────────────────

  async openFromHeader(): Promise<void> {
    await allure.step('Open Disposal from the portal header', async () => {
      await this.header.openModule(DISPOSAL_MODULE_LABEL);
      await this.assertDisposalModuleLoaded();
    });
  }

  async openByRoute(): Promise<void> {
    await allure.step('Navigate directly to the Disposal route', async () => {
      await this.page.goto(portalHashRoute(ROUTES.portal.disposal, ENV.portal.loginUrl));
      await this.assertDisposalModuleLoaded();
    });
  }

  // ─── Add Disposal dialog: shared asset picker (delegated) ─

  async openAddDisposalDialog(): Promise<void> {
    await allure.step('Open the Add Disposal dialog', async () => {
      await this.addDisposalButton().click();
      await this.dialog.assertOpenForCreation();
    });
  }

  async cancelAddDisposalDialog(): Promise<void> {
    await this.dialog.cancel();
    await this.dialog.assertClosed();
  }

  async setDialogTextFilter(fieldLabel: string, value: string): Promise<void> {
    await this.dialog.setTextFilter(fieldLabel, value);
  }

  async selectDialogDropdownFilter(fieldLabel: string, optionLabel: string): Promise<void> {
    await this.dialog.selectDropdownFilter(fieldLabel, optionLabel);
  }

  async searchDialogFilters(): Promise<void> {
    await this.dialog.search();
  }

  async clearDialogFilters(): Promise<void> {
    await this.dialog.clearSearch();
  }

  async countDialogAssetRows(): Promise<number> {
    return this.dialog.countAssetRows();
  }

  async readDialogAssetColumn(columnIndex: number): Promise<string[]> {
    return this.dialog.readAssetColumnValues(columnIndex);
  }

  async readDialogColumnHeaders(): Promise<string[]> {
    return this.dialog.readColumnHeaders();
  }

  async selectEligibleDialogAssets(count: number, excluded: readonly string[] = []): Promise<string[]> {
    return this.dialog.selectEligibleAssets(count, excluded);
  }

  async selectFirstEligibleDialogAsset(excluded: readonly string[] = []): Promise<string> {
    return this.dialog.selectFirstEligibleAsset(excluded);
  }

  async assertDialogSaveDisabled(): Promise<void> {
    await this.dialog.assertSaveDisabled();
  }

  async assertDialogSaveEnabled(): Promise<void> {
    await this.dialog.assertSaveEnabled();
  }

  async uploadDisposalAttachment(filePath: string): Promise<void> {
    await this.dialog.uploadAttachment(filePath);
  }

  // ─── Add Disposal dialog: Disposal-specific fields ────────

  /**
   * Uses the class-scoped `.p-dropdown-item` option list (TAGGING.DIALOG.DROPDOWN_ANY_OPTION)
   * filtered by exact text, NOT the generic page-wide TAGGING.DIALOG.DROPDOWN_OPTION text
   * locator — verified live that a bare global text match can collide with an unrelated
   * asset-grid cell showing the same word (e.g. a "Scrapped" category value on a row behind
   * the open dropdown), which fails the click as blocked by the dialog's own subtree.
   */
  async selectDisposalMethod(optionLabel: string): Promise<void> {
    await allure.step(`Select Disposal Method "${optionLabel}"`, async () => {
      await this.disposalMethodDropdown().click();
      const escaped = optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await this.repository
        .locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION')
        .filter({ hasText: new RegExp(`^${escaped}$`) })
        .first()
        .click();
    });
  }

  async readDisposalMethodOptions(): Promise<string[]> {
    return allure.step('Read the available Disposal Method options from the live dropdown', async () => {
      await this.disposalMethodDropdown().click();
      const options = this.repository.locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION');
      const labels = (await options.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
      await this.disposalMethodDropdown().click();
      return labels;
    });
  }

  async enterDisposalReason(reason: string): Promise<void> {
    await allure.step(`Enter Disposal Reason "${reason}"`, async () => {
      await this.disposalReasonTextarea().fill(reason);
    });
  }

  async readDisposalReason(): Promise<string> {
    return this.disposalReasonTextarea().inputValue();
  }

  async saveNewDisposalContainer(): Promise<void> {
    await this.dialog.save();
  }

  // ─── Show Details (delegated to TrackingContainerDetailsComponent) ─

  async openShowDetails(trackingNumber: string): Promise<void> {
    await allure.step(`Open Show Details for disposal container "${trackingNumber}"`, async () => {
      await this.containerRow(trackingNumber).getByRole('button').filter({ hasText: 'Show Details' }).click();
      await this.details.assertOpen();
    });
  }

  async closeShowDetails(): Promise<void> {
    await this.details.close();
  }

  async readShowDetailsDisposalMethod(): Promise<string> {
    return (await this.detailsMethodField().innerText()).trim();
  }

  async selectAssetForReview(fixedAssetNumber: string): Promise<void> {
    await this.details.selectAsset(fixedAssetNumber);
  }

  async deselectAssetForReview(fixedAssetNumber: string): Promise<void> {
    await this.details.deselectAsset(fixedAssetNumber);
  }

  async selectAllAssetsForReview(): Promise<void> {
    await this.details.selectAllAssets();
  }

  async approveSelectedAssets(): Promise<void> {
    await this.details.approveSelected();
  }

  async rejectSelectedAssets(reason?: string): Promise<void> {
    await this.details.rejectSelected(reason);
  }

  async completeContainerReview(): Promise<void> {
    await this.details.complete();
  }

  async readReviewCounts(): Promise<{ selected: number; pending: number }> {
    return this.details.readReviewCounts();
  }

  /**
   * Disposal's Show Details table has one extra trailing "Reason" column
   * after Status (verified live 2026-08-25) — pass the Disposal-specific
   * status cell locator so this reads Status, not Reason (see
   * TrackingContainerDetailsComponent.readAssetStatus and gotcha in the
   * automation notes).
   */
  async readShowDetailsAssetStatus(fixedAssetNumber: string): Promise<string> {
    return this.details.readAssetStatus(fixedAssetNumber, 'DISPOSAL.DETAILS.ASSET_STATUS_CELL');
  }

  async isAssetSelectableForReview(fixedAssetNumber: string): Promise<boolean> {
    return this.details.isAssetSelectableForReview(fixedAssetNumber);
  }

  async readShowDetailsFixedAssetNumbers(): Promise<string[]> {
    return this.details.readFixedAssetNumbers();
  }

  async readShowDetailsAssetCount(): Promise<number> {
    const fixedAssetNumbers = await this.details.readFixedAssetNumbers();
    return fixedAssetNumbers.length;
  }

  async assertShowDetailsContainsAsset(fixedAssetNumber: string): Promise<void> {
    await this.details.assertContainsFixedAssetNumber(fixedAssetNumber);
  }

  async assertApproveSelectedDisabled(): Promise<void> {
    await this.details.assertApproveSelectedDisabled();
  }

  async assertApproveSelectedEnabled(): Promise<void> {
    await this.details.assertApproveSelectedEnabled();
  }

  async assertRejectSelectedDisabled(): Promise<void> {
    await this.details.assertRejectSelectedDisabled();
  }

  async assertRejectSelectedEnabled(): Promise<void> {
    await this.details.assertRejectSelectedEnabled();
  }

  async assertCompleteReviewDisabled(): Promise<void> {
    await this.details.assertCompleteDisabled();
  }

  async assertCompleteReviewEnabled(): Promise<void> {
    await this.details.assertCompleteEnabled();
  }

  async readStatusTag(): Promise<string> {
    return this.details.readStatusTag();
  }

  // ─── Container list actions ────────────────────────────────

  async openActionsMenu(trackingNumber: string): Promise<void> {
    await allure.step(`Open the Actions menu for disposal container "${trackingNumber}"`, async () => {
      await this.containerRow(trackingNumber).getByRole('button').filter({ hasText: 'Actions' }).click();
    });
  }

  async submitContainerForApproval(trackingNumber: string): Promise<void> {
    await allure.step(`Submit disposal container "${trackingNumber}" to the Admin Checker`, async () => {
      await this.openActionsMenu(trackingNumber);
      await this.repository.locator('TAGGING.ACTIONS_MENU.SUBMIT_ITEM').click();
      await this.assertConfirmationDialogVisible(trackingNumber);
      await this.repository.locator('TAGGING.CONFIRM_DIALOG.ACCEPT_BUTTON').click();
    });
  }

  /** Business rule: disposal tracking numbers follow ADC-<same-width zero-padded sequence>; never hardcoded, always derived from the live grid. */
  computeNextTrackingNumber(previousTrackingNumber: string): string {
    const match = previousTrackingNumber.match(TRACKING_NUMBER_PATTERN);

    if (!match) {
      throw new Error(`Disposal tracking number "${previousTrackingNumber}" does not match the expected ADC-<sequence> format`);
    }

    const [, prefix, digits] = match;
    const nextSequence = (Number(digits) + 1).toString().padStart(digits.length, '0');
    return `${prefix}${nextSequence}`;
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertDisposalModuleLoaded(): Promise<void> {
    await allure.step('Assert the Disposal module is loaded', async () => {
      await expect(this.repository.locator('PORTAL.HEADER.ACTIVE_MODULE_LABEL')).toHaveText(
        DISPOSAL_MODULE_LABEL,
        { timeout: 30_000 }
      );
    });
  }

  async assertContainerVisible(trackingNumber: string): Promise<void> {
    await allure.step(`Assert disposal container "${trackingNumber}" is visible in the grid`, async () => {
      await expect(this.containerRow(trackingNumber)).toBeVisible({ timeout: 30_000 });
    });
  }

  async assertContainerStatus(trackingNumber: string, expectedStatus: string): Promise<void> {
    await allure.step(`Assert disposal container "${trackingNumber}" status is "${expectedStatus}"`, async () => {
      await expect(this.containerStatusCell(trackingNumber)).toHaveText(expectedStatus, { timeout: 30_000 });
    });
  }

  async assertConfirmationDialogVisible(trackingNumber: string): Promise<void> {
    await allure.step('Assert the Confirmation dialog is visible', async () => {
      const confirmDialog = this.repository.locator('TAGGING.CONFIRM_DIALOG.ROOT');
      await expect(confirmDialog).toBeVisible({ timeout: 15_000 });
      await expect(confirmDialog).toContainText('Confirmation');
      await expect(confirmDialog).toContainText(trackingNumber);
    });
  }

  // ─── Getters (values) ──────────────────────────────────────

  async findLatestTrackingNumber(): Promise<string> {
    return allure.step('Find the latest disposal Tracking Number in the grid', async () => {
      const cells = this.repository.locator('DISPOSAL.ROW_TRACKING_NUMBER_CELL', { scope: this.gridRoot() });
      const cellCount = await cells.count();
      let latest: { text: string; sequence: number } | undefined;

      for (let index = 0; index < cellCount; index += 1) {
        const text = (await cells.nth(index).innerText()).trim();
        const match = text.match(TRACKING_NUMBER_PATTERN);

        if (!match) {
          continue;
        }

        const sequence = Number(match[2]);

        if (!latest || sequence > latest.sequence) {
          latest = { text, sequence };
        }
      }

      if (!latest) {
        throw new Error('No disposal container rows found to determine the latest Tracking Number');
      }

      return latest.text;
    });
  }

  async countContainerRows(): Promise<number> {
    return this.containerRows().count();
  }

  async readAllTrackingNumbers(): Promise<string[]> {
    return this.readContainerColumn('DISPOSAL.ROW_TRACKING_NUMBER_CELL');
  }

  async readAllContainerStatuses(): Promise<string[]> {
    return this.readContainerColumn('DISPOSAL.ROW_STATUS_CELL');
  }

  async readContainerStatus(trackingNumber: string): Promise<string> {
    return (await this.containerStatusCell(trackingNumber).innerText()).trim();
  }

  async readContainerDisposalMethod(trackingNumber: string): Promise<string> {
    return (
      await this.repository.locator('DISPOSAL.ROW_METHOD_CELL', { scope: this.containerRow(trackingNumber) }).innerText()
    ).trim();
  }

  /** Undefined when no container on the current (unfiltered) grid page has this status. */
  async findContainerTrackingNumberByStatus(status: string): Promise<string | undefined> {
    return allure.step(`Find a disposal container with status "${status}"`, async () => {
      const trackingNumbers = await this.readAllTrackingNumbers();
      const statuses = await this.readAllContainerStatuses();
      const index = statuses.findIndex((value) => value === status);
      return index === -1 ? undefined : trackingNumbers[index];
    });
  }

  // ─── Helpers (private) ──────────────────────────────────

  private addDisposalButton(): Locator {
    return this.repository.locator('DISPOSAL.ADD_DISPOSAL_BUTTON');
  }

  private disposalMethodDropdown(): Locator {
    return this.repository.locator('DISPOSAL.DIALOG.METHOD_DROPDOWN');
  }

  private disposalReasonTextarea(): Locator {
    return this.repository.locator('DISPOSAL.DIALOG.REASON_TEXTAREA');
  }

  private detailsMethodField(): Locator {
    return this.repository.locator('DISPOSAL.DETAILS.METHOD_FIELD');
  }

  private gridRoot(): Locator {
    return this.repository.locator('DISPOSAL.GRID_ROOT');
  }

  private async readContainerColumn(cellElementId: string): Promise<string[]> {
    const rows = this.containerRows();
    const rowCount = await rows.count();
    const values: string[] = [];

    for (let index = 0; index < rowCount; index += 1) {
      const cell = this.repository.locator(cellElementId, { scope: rows.nth(index) });
      values.push((await cell.innerText()).trim());
    }

    return values.filter(Boolean);
  }

  /**
   * Real container rows only. A no-match search still renders one row whose
   * cell reads "No Tracking Activity" (verified live for Tagging; same grid
   * component powers Disposal) — excluded here for every caller.
   */
  private containerRows(): Locator {
    const rows = this.repository.locator('DISPOSAL.ROW', { scope: this.gridRoot() });
    return rows
      .filter({ has: this.repository.locator('DISPOSAL.ROW_CELL') })
      .filter({ hasNot: this.repository.locator('DISPOSAL.EMPTY_STATE_CELL') });
  }

  private containerRow(trackingNumber: string): Locator {
    return this.containerRows().filter({ hasText: trackingNumber });
  }

  private containerStatusCell(trackingNumber: string): Locator {
    return this.repository.locator('DISPOSAL.ROW_STATUS_CELL', { scope: this.containerRow(trackingNumber) });
  }
}
