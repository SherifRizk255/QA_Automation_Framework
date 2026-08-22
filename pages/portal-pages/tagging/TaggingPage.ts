import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ENV, portalHashRoute, ROUTES } from '../../../config/resources';
import { AddTrackingDialogComponent } from '../../components/portal/tagging/AddTrackingDialogComponent';
import { AdvancedFilterComponent } from '../../components/portal/tagging/AdvancedFilterComponent';
import { AssetSelectionGridComponent } from '../../components/portal/tagging/AssetSelectionGridComponent';
import { PortalHeaderComponent } from '../../components/portal/navigation/PortalHeaderComponent';
import { BasePortalPage } from '../BasePortalPage';

const TAGGING_MODULE_LABEL = 'Tagging';

export class TaggingPage extends BasePortalPage {
  private readonly header: PortalHeaderComponent;
  private readonly grid: AssetSelectionGridComponent;
  private readonly filters: AdvancedFilterComponent;
  private readonly dialog: AddTrackingDialogComponent;

  constructor(page: Page, private readonly testInfo?: TestInfo) {
    super(page);
    void this.testInfo;
    this.header = new PortalHeaderComponent(page, this.repository);
    this.grid = new AssetSelectionGridComponent(page, this.repository);
    this.filters = new AdvancedFilterComponent(page, this.repository);
    this.dialog = new AddTrackingDialogComponent(page, this.repository);
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

  // ─── Getters (values) ────────────────────────────────────

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
}
