import { expect, type Download, type Locator, type Page, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ENV, portalHashRoute, ROUTES } from '../../../config/resources';
import { PortalHeaderComponent } from '../../components/portal/navigation/PortalHeaderComponent';
import { BasePortalPage } from '../BasePortalPage';

const REPORTS_MODULE_LABEL = 'Reports';

export const REPORT_TYPES = ['Asset Profile Report', 'Asset Movement Report'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const ADVANCED_FILTER_FIELDS = [
  'Location Name',
  'Business Unit',
  'Department',
  'Asset Category',
  'Asset Sub Category',
  'Responsible',
] as const;
export type AdvancedFilterField = (typeof ADVANCED_FILTER_FIELDS)[number];

/**
 * Reports module page object. Structurally distinct from Tagging/Disposal
 * (a plain filter form + Export button, not a dialog with an asset picker
 * grid) so it does not reuse AddTrackingDialogComponent — but the dropdown
 * fields share the exact same PrimeNG `p-dropdown` markup (verified live
 * 2026-08-25: options render in `.p-dropdown-item`, appended to `body`), so
 * the option-list locator (`TAGGING.DIALOG.DROPDOWN_ANY_OPTION`) is reused
 * directly rather than duplicated.
 */
export class ReportsPage extends BasePortalPage {
  private readonly header: PortalHeaderComponent;

  constructor(page: Page, private readonly testInfo?: TestInfo) {
    super(page);
    void this.testInfo;
    this.header = new PortalHeaderComponent(page, this.repository);
  }

  // ─── Navigation ──────────────────────────────────────────

  async openFromHeader(): Promise<void> {
    await allure.step('Open Reports from the portal header', async () => {
      await this.header.openModule(REPORTS_MODULE_LABEL);
      await this.assertReportsModuleLoaded();
    });
  }

  async openByRoute(): Promise<void> {
    await allure.step('Navigate directly to the Reports route', async () => {
      await this.page.goto(portalHashRoute(ROUTES.portal.reports, ENV.portal.loginUrl));
      await this.assertReportsModuleLoaded();
    });
  }

  // ─── Actions ─────────────────────────────────────────────

  async selectReportType(reportType: ReportType): Promise<void> {
    await this.selectDropdown('Report Type', reportType);
  }

  async readSelectedReportType(): Promise<string> {
    return this.readDropdownLabel('Report Type');
  }

  async selectAdvancedFilter(field: AdvancedFilterField, optionLabel: string): Promise<void> {
    await this.selectDropdown(field, optionLabel);
  }

  async readAdvancedFilterLabel(field: AdvancedFilterField): Promise<string> {
    return this.readDropdownLabel(field);
  }

  async readAdvancedFilterOptions(field: AdvancedFilterField): Promise<string[]> {
    return allure.step(`Read the available "${field}" options from the live dropdown`, async () => {
      await this.openDropdown(field);
      const options = this.repository.locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION');
      const labels = (await options.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
      await this.fieldCombobox(field).click();
      return labels;
    });
  }

  async isAdvancedFilterEnabled(field: AdvancedFilterField): Promise<boolean> {
    return (await this.fieldCombobox(field).getAttribute('aria-disabled')) === 'false';
  }

  /**
   * Probes EVERY Location Name option until one enables Business Unit — same
   * cascade shape as the Tagging/Disposal asset picker (see
   * AddTrackingDialogComponent.findLocationEnablingBusinessUnit). Returns the
   * location that worked, or undefined when none does.
   */
  async findLocationEnablingBusinessUnit(preferredLocation?: string): Promise<string | undefined> {
    return allure.step('Find a Location Name that enables the Business Unit filter', async () => {
      const locations = await this.readAdvancedFilterOptions('Location Name');
      const ordered = preferredLocation && locations.includes(preferredLocation)
        ? [preferredLocation, ...locations.filter((value) => value !== preferredLocation)]
        : locations;

      for (const location of ordered) {
        await this.selectAdvancedFilter('Location Name', location);

        if (await this.isAdvancedFilterEnabled('Business Unit')) {
          return location;
        }
      }

      return undefined;
    });
  }

  /** Clicks Export and returns the download handle without saving it anywhere. */
  async export(): Promise<Download> {
    return allure.step('Click Export', async () => {
      const [download] = await Promise.all([this.page.waitForEvent('download'), this.exportButton().click()]);
      return download;
    });
  }

  /**
   * Clicks Export and returns the download, or `undefined` when the app
   * produces no file within `timeoutMs`. For cases where "did a file appear
   * at all" is itself the thing under test — callers assert the outcome and
   * report it, so a missing download surfaces as a precise expected/actual
   * failure instead of an opaque waitForEvent timeout.
   */
  async exportAllowingNoDownload(timeoutMs = 15_000): Promise<Download | undefined> {
    return allure.step('Click Export (tolerating no download)', async () => {
      const downloadPromise = this.page
        .waitForEvent('download', { timeout: timeoutMs })
        .catch(() => undefined);
      await this.exportButton().click();
      return downloadPromise;
    });
  }

  async resetAllFilters(): Promise<void> {
    await allure.step('Reset every Advanced Filter back to "All"', async () => {
      for (const field of ADVANCED_FILTER_FIELDS) {
        if (await this.isAdvancedFilterEnabled(field)) {
          const clearButton = this.fieldClearButton(field);
          if (await clearButton.count()) {
            await clearButton.click();
          }
        }
      }
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertReportsModuleLoaded(): Promise<void> {
    await allure.step('Assert the Reports module is loaded', async () => {
      await expect(this.repository.locator('PORTAL.HEADER.ACTIVE_MODULE_LABEL')).toHaveText(
        REPORTS_MODULE_LABEL,
        { timeout: 30_000 }
      );
      await expect(this.repository.locator('REPORTS.ROOT')).toBeVisible({ timeout: 30_000 });
    });
  }

  async assertExportEnabled(): Promise<void> {
    await expect(this.exportButton()).toBeEnabled();
  }

  // ─── Helpers (private) ──────────────────────────────────

  private async selectDropdown(field: string, optionLabel: string): Promise<void> {
    await allure.step(`Select "${field}" = "${optionLabel}"`, async () => {
      await this.openDropdown(field);
      const escaped = optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await this.repository
        .locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION')
        .filter({ hasText: new RegExp(`^${escaped}$`) })
        .first()
        .click();
    });
  }

  private async readDropdownLabel(field: string): Promise<string> {
    return (await this.fieldCombobox(field).innerText()).trim();
  }

  private async openDropdown(field: string): Promise<void> {
    await this.fieldCombobox(field).click();
    await this.repository
      .locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  private fieldCombobox(field: string): Locator {
    return this.repository.locator('REPORTS.FIELD_COMBOBOX', { parameters: { fieldLabel: field } });
  }

  private fieldClearButton(field: string): Locator {
    return this.repository
      .locator('REPORTS.FIELD', { parameters: { fieldLabel: field } })
      .locator('.p-dropdown-clear-icon');
  }

  private exportButton(): Locator {
    return this.repository.locator('REPORTS.EXPORT_BUTTON');
  }
}
