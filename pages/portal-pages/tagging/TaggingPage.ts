import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ENV, portalHashRoute, ROUTES } from '../../../config/resources';
import { AddTrackingDialogComponent } from '../../components/portal/tagging/AddTrackingDialogComponent';
import { AdvancedFilterComponent } from '../../components/portal/tagging/AdvancedFilterComponent';
import { AssetSelectionGridComponent } from '../../components/portal/tagging/AssetSelectionGridComponent';
import { TrackingContainerDetailsComponent } from '../../components/portal/tagging/TrackingContainerDetailsComponent';
import { PortalHeaderComponent } from '../../components/portal/navigation/PortalHeaderComponent';
import { BasePortalPage } from '../BasePortalPage';

const TAGGING_MODULE_LABEL = 'Tagging';

/** Every tracking container number observed live follows ATC-<zero-padded sequence>, e.g. ATC-00001030. */
const TRACKING_NUMBER_PATTERN = /^(ATC-)(\d+)$/;

export class TaggingPage extends BasePortalPage {
  private readonly header: PortalHeaderComponent;
  private readonly grid: AssetSelectionGridComponent;
  private readonly filters: AdvancedFilterComponent;
  private readonly dialog: AddTrackingDialogComponent;
  private readonly details: TrackingContainerDetailsComponent;

  constructor(page: Page, private readonly testInfo?: TestInfo) {
    super(page);
    void this.testInfo;
    this.header = new PortalHeaderComponent(page, this.repository);
    this.grid = new AssetSelectionGridComponent(page, this.repository);
    this.filters = new AdvancedFilterComponent(page, this.repository);
    this.dialog = new AddTrackingDialogComponent(page, this.repository);
    this.details = new TrackingContainerDetailsComponent(page, this.repository);
  }

  // ─── Navigation ──────────────────────────────────────────

  async openFromHeader(): Promise<void> {
    await allure.step('Open Tagging from the portal header', async () => {
      await this.header.openModule(TAGGING_MODULE_LABEL);
      await this.assertTaggingModuleLoaded();
    });
  }

  async openByRoute(): Promise<void> {
    await allure.step('Navigate directly to the Tagging route', async () => {
      await this.page.goto(portalHashRoute(ROUTES.portal.tagging, ENV.portal.loginUrl));
      await this.assertTaggingModuleLoaded();
    });
  }

  // ─── Actions ─────────────────────────────────────────────

  async openAddTrackingDialog(): Promise<void> {
    await allure.step('Open the Add Tracking dialog', async () => {
      await this.addTrackingButton().click();
      await this.dialog.assertOpenForCreation();
    });
  }

  async cancelAddTrackingDialog(): Promise<void> {
    await this.dialog.cancel();
    await this.dialog.assertClosed();
  }

  async dismissAddTrackingDialogWithEscape(): Promise<void> {
    await this.dialog.dismissWithEscape();
    await this.dialog.assertClosed();
  }

  async expandAdvancedFilters(): Promise<void> {
    await this.filters.expand();
  }

  async assertAllTrackingDialogFilterFieldsPresent(): Promise<void> {
    await this.dialog.assertAllPickerFilterFieldsPresent();
  }

  async applyAdvancedFilter(fieldLabel: string, value: string): Promise<void> {
    await allure.step(`Apply advanced filter "${fieldLabel}" = "${value}"`, async () => {
      await this.filters.setField(fieldLabel, value);
      await this.filters.apply();
    });
  }

  async resetAdvancedFilters(): Promise<void> {
    await this.filters.reset();
  }

  async selectEligibleAssets(count: number): Promise<number> {
    return this.grid.selectEligibleRows(count);
  }

  async selectAllAssets(): Promise<void> {
    await this.grid.selectAll();
  }

  async clearAssetSelection(): Promise<void> {
    await this.grid.uncheckAllRows();
  }

  async submitSelectionToContainer(): Promise<void> {
    await allure.step('Submit the selected assets to the container', async () => {
      await this.submitButton().click();
    });
  }

  // ─── Tracking Container Actions ──────────────────────────

  async selectPreferredOrFallbackAssets(
    preferredFixedAssetNumbers: readonly string[],
    substitutionsOut: string[]
  ): Promise<string[]> {
    return allure.step('Select preferred assets, falling back to the next eligible asset when unavailable', async () => {
      const selected: string[] = [];

      for (const preferred of preferredFixedAssetNumbers) {
        await this.dialog.searchByFixedAssetNumber(preferred);
        const isSelectable = await this.dialog.isAssetSelectable(preferred);

        if (isSelectable) {
          await this.dialog.selectAssetByFixedAssetNumber(preferred);
          selected.push(preferred);
        } else {
          await this.dialog.clearSearch();
          const substitute = await this.dialog.selectFirstEligibleAsset([...preferredFixedAssetNumbers, ...selected]);
          selected.push(substitute);
          substitutionsOut.push(`${preferred} -> ${substitute}`);
        }

        await this.dialog.clearSearch();
      }

      return selected;
    });
  }

  async addAssetsFromActions(
    trackingNumber: string,
    count: number,
    excludedFixedAssetNumbers: readonly string[]
  ): Promise<string[]> {
    return allure.step(`Add ${count} additional asset(s) to container "${trackingNumber}" via Actions`, async () => {
      await this.openActionsMenu(trackingNumber);
      await this.repository.locator('TAGGING.ACTIONS_MENU.ADD_ASSETS_ITEM').click();
      await this.dialog.assertOpenWithTitle('Add Assets');

      const added: string[] = [];
      const excluded = [...excludedFixedAssetNumbers];

      for (let index = 0; index < count; index += 1) {
        const fixedAssetNumber = await this.dialog.selectFirstEligibleAsset(excluded);
        added.push(fixedAssetNumber);
        excluded.push(fixedAssetNumber);
      }

      await this.dialog.save();
      return added;
    });
  }

  async uploadContainerAttachment(filePath: string): Promise<void> {
    await this.dialog.uploadAttachment(filePath);
  }

  /** Exercises check -> assert checked -> uncheck -> assert unchecked on one eligible dialog asset, then leaves it unselected. */
  async verifyAssetCheckUncheckCycle(excludedFixedAssetNumbers: readonly string[]): Promise<void> {
    await allure.step('Verify a selectable asset can be checked and unchecked in the picker grid', async () => {
      const fixedAssetNumber = await this.dialog.selectFirstEligibleAsset(excludedFixedAssetNumbers);
      await this.dialog.assertAssetChecked(fixedAssetNumber);
      await this.dialog.selectAssetByFixedAssetNumber(fixedAssetNumber);
      await this.dialog.assertAssetUnchecked(fixedAssetNumber);
    });
  }

  /** Optional reader — undefined when the current picker grid page has no dimmed (already-linked) asset. */
  async findFirstDimmedTrackingDialogAsset(): Promise<string | undefined> {
    return this.dialog.findFirstDisabledFixedAssetNumber();
  }

  async assertTrackingDialogAssetNotSelectable(fixedAssetNumber: string): Promise<void> {
    await this.dialog.assertAssetNotSelectable(fixedAssetNumber);
  }

  async saveNewTrackingContainer(): Promise<void> {
    await this.dialog.save();
  }

  async openShowDetails(trackingNumber: string): Promise<void> {
    await allure.step(`Open Show Details for container "${trackingNumber}"`, async () => {
      await this.containerRow(trackingNumber).getByRole('button').filter({ hasText: 'Show Details' }).click();
      await this.details.assertOpen();
    });
  }

  async closeShowDetails(): Promise<void> {
    await this.details.close();
  }

  async openActionsMenu(trackingNumber: string): Promise<void> {
    await allure.step(`Open the Actions menu for container "${trackingNumber}"`, async () => {
      await this.containerRow(trackingNumber).getByRole('button').filter({ hasText: 'Actions' }).click();
    });
  }

  async submitContainerForApproval(trackingNumber: string): Promise<void> {
    await allure.step(`Submit container "${trackingNumber}" to the Checker`, async () => {
      await this.openActionsMenu(trackingNumber);
      await this.repository.locator('TAGGING.ACTIONS_MENU.SUBMIT_ITEM').click();
      await this.assertConfirmationDialogVisible(trackingNumber);
      await this.repository.locator('TAGGING.CONFIRM_DIALOG.ACCEPT_BUTTON').click();
    });
  }

  /** Business rule: tracking numbers follow ATC-<same-width zero-padded sequence>; never hardcoded, always derived from the live grid. */
  computeNextTrackingNumber(previousTrackingNumber: string): string {
    const match = previousTrackingNumber.match(TRACKING_NUMBER_PATTERN);

    if (!match) {
      throw new Error(`Tracking number "${previousTrackingNumber}" does not match the expected ATC-<sequence> format`);
    }

    const [, prefix, digits] = match;
    const nextSequence = (Number(digits) + 1).toString().padStart(digits.length, '0');
    return `${prefix}${nextSequence}`;
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertTaggingModuleLoaded(): Promise<void> {
    await allure.step('Assert the Tagging module is loaded', async () => {
      await expect(this.repository.locator('PORTAL.HEADER.ACTIVE_MODULE_LABEL')).toHaveText(
        TAGGING_MODULE_LABEL,
        { timeout: 30_000 }
      );
    });
  }

  async assertModuleAvailableFromHeader(): Promise<void> {
    await this.header.assertModuleAvailable(TAGGING_MODULE_LABEL);
  }

  async assertNoIneligibleAssetSelectable(index: number): Promise<void> {
    await this.grid.assertRowNotSelectable(index);
  }

  async assertFilterResultsEmpty(): Promise<void> {
    await this.grid.assertEmptyStateVisible();
  }

  async assertAssetsLeftPendingList(expectedRemainingCount: number): Promise<void> {
    await this.grid.assertRowCount(expectedRemainingCount);
  }

  async assertSubmitToContainerDisabled(): Promise<void> {
    await allure.step('Assert Submit To Container is disabled with no selection', async () => {
      await expect(this.submitButton()).toBeDisabled();
    });
  }

  async assertSubmitToContainerEnabled(): Promise<void> {
    await allure.step('Assert Submit To Container is enabled', async () => {
      await expect(this.submitButton()).toBeEnabled();
    });
  }

  async assertContainerVisible(trackingNumber: string): Promise<void> {
    await allure.step(`Assert container "${trackingNumber}" is visible in the Tagging grid`, async () => {
      await expect(this.containerRow(trackingNumber)).toBeVisible({ timeout: 30_000 });
    });
  }

  async assertContainerStatus(trackingNumber: string, expectedStatus: string): Promise<void> {
    await allure.step(`Assert container "${trackingNumber}" status is "${expectedStatus}"`, async () => {
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

  // ─── Getters (values) ────────────────────────────────────

  async findLatestTrackingNumber(): Promise<string> {
    return allure.step('Find the latest Tracking Number in the grid', async () => {
      const cells = this.repository.locator('TAGGING.ROW_TRACKING_NUMBER_CELL', { scope: this.gridRoot() });
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
        throw new Error('No tracking container rows found to determine the latest Tracking Number');
      }

      return latest.text;
    });
  }

  async readContainerStatus(trackingNumber: string): Promise<string> {
    return (await this.containerStatusCell(trackingNumber).innerText()).trim();
  }

  async readShowDetailsAssetCount(): Promise<number> {
    const fixedAssetNumbers = await this.details.readFixedAssetNumbers();
    return fixedAssetNumbers.length;
  }

  async readShowDetailsFixedAssetNumbers(): Promise<string[]> {
    return this.details.readFixedAssetNumbers();
  }

  async assertShowDetailsAssetCount(expectedCount: number): Promise<void> {
    await this.details.assertAssetCount(expectedCount);
  }

  async assertShowDetailsContainsAsset(fixedAssetNumber: string): Promise<void> {
    await this.details.assertContainsFixedAssetNumber(fixedAssetNumber);
  }

  async countAssetRows(): Promise<number> {
    return this.grid.rowCount();
  }

  async countEligibleAssets(): Promise<number> {
    return (await this.grid.selectableRowIndexes()).length;
  }

  async countCheckedAssets(): Promise<number> {
    return this.grid.checkedRowCount();
  }

  /** Optional reader — undefined when every asset row in the current grid is eligible. */
  async findFirstIneligibleAssetIndex(): Promise<number | undefined> {
    return this.grid.findFirstIneligibleAssetIndex();
  }

  async readAssetIdentifier(index: number): Promise<string> {
    return this.grid.readRowIdentifier(index);
  }

  async readActiveFilterLabels(): Promise<string[]> {
    return this.filters.readActiveFilterLabels();
  }

  // ─── Helpers (private) ──────────────────────────────────

  private addTrackingButton(): Locator {
    return this.repository.locator('TAGGING.ADD_TRACKING_BUTTON');
  }

  private submitButton(): Locator {
    return this.repository.locator('TAGGING.SUBMIT_BUTTON');
  }

  private gridRoot(): Locator {
    return this.repository.locator('TAGGING.GRID_ROOT');
  }

  private containerRow(trackingNumber: string): Locator {
    const rows = this.repository.locator('TAGGING.ROW', { scope: this.gridRoot() });
    return rows.filter({ has: this.repository.locator('TAGGING.ROW_CELL') }).filter({ hasText: trackingNumber });
  }

  private containerStatusCell(trackingNumber: string): Locator {
    return this.repository.locator('TAGGING.ROW_STATUS_CELL', { scope: this.containerRow(trackingNumber) });
  }
}
