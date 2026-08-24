import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

const PICKER_FILTER_FIELD_LABELS = [
  'Fixed Asset Number',
  'Reference Number',
  'Asset Responsible Name',
  'Asset Category',
  'Asset Sub Category',
  'Current Location',
  'Business Unit',
  'Department',
] as const;

/**
 * Add Tracking creation dialog — also reused for the Add Assets dialog opened
 * from a container row's Actions menu. Both render the identical filter form
 * (8 named fields, Search/Clear) and asset grid with a Save/Cancel footer
 * (proven equivalent DOM via live discovery); Add Assets omits the
 * Attachments/Return Reasons sections that only Add Tracking has.
 *
 * Filter field types (verified live):
 * - Free text: Fixed Asset Number, Reference Number, Asset Responsible Name
 * - Dropdown:  Asset Category, Asset Sub Category, Current Location,
 *              Business Unit, Department
 *
 * Business rule — the location cascade: Business Unit stays disabled until a
 * Current Location is chosen, and Department stays disabled until a Business
 * Unit is chosen. Both rendering `aria-disabled=true` on a fresh dialog is
 * intended behavior, not a defect. The cascade is also DATA-dependent: picking
 * a Location that has no Business Unit attached leaves Business Unit disabled,
 * so callers must probe for a location that actually opens the field rather
 * than assuming the first one does — see findLocationEnablingBusinessUnit().
 *
 * Asset Sub Category is NOT scoped by Asset Category — it offers the same full
 * option list regardless.
 */
export class AddTrackingDialogComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  // ─── Actions ─────────────────────────────────────────────

  async cancel(): Promise<void> {
    await allure.step('Cancel the Add Tracking dialog', async () => {
      await this.cancelButton().click();
    });
  }

  async dismissWithEscape(): Promise<void> {
    await allure.step('Dismiss the Add Tracking dialog with Escape', async () => {
      await this.page.keyboard.press('Escape');
    });
  }

  async searchByFixedAssetNumber(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Search the asset picker grid for Fixed Asset Number "${fixedAssetNumber}"`, async () => {
      await this.fixedAssetNumberInput().fill(fixedAssetNumber);
      await this.searchButton().click();
      await expect(this.assetRows().first()).toBeVisible({ timeout: 15_000 });
    });
  }

  async clearSearch(): Promise<void> {
    await allure.step('Clear the asset picker filter', async () => {
      await this.clearButton().click();
    });
  }

  /** Fills one of the free-text picker filters (Fixed Asset Number, Reference Number, Asset Responsible Name). */
  async setTextFilter(fieldLabel: string, value: string): Promise<void> {
    await allure.step(`Set picker filter "${fieldLabel}" to "${value}"`, async () => {
      await this.pickerFilterInput(fieldLabel).fill(value);
    });
  }

  /** Selects an option in one of the dropdown picker filters (Asset Category, Asset Sub Category, Current Location). */
  async selectDropdownFilter(fieldLabel: string, optionLabel: string): Promise<void> {
    await allure.step(`Select picker filter "${fieldLabel}" = "${optionLabel}"`, async () => {
      await this.openDropdown(fieldLabel);
      await this.repository
        .locator('TAGGING.DIALOG.DROPDOWN_OPTION', { parameters: { optionLabel } })
        .first()
        .click();
    });
  }

  async search(): Promise<void> {
    await allure.step('Apply the asset picker filters via Search', async () => {
      await this.searchButton().click();
    });
  }

  /**
   * Probes EVERY Current Location option until one enables Business Unit,
   * since the cascade only opens for locations that actually have a business
   * unit attached. `preferredLocation` is tried first purely as a fast path —
   * when it is absent or childless the probe falls back to every remaining
   * option in the live dropdown (no artificial cap), so the test never
   * depends on one specific location existing or on how many options there
   * currently are.
   *
   * Returns the location that worked, or undefined when none does.
   */
  async findLocationEnablingBusinessUnit(preferredLocation?: string): Promise<string | undefined> {
    return allure.step('Find a Current Location that enables the Business Unit filter', async () => {
      const locations = await this.readDropdownOptions('Current Location');
      const ordered = this.preferFirst(locations, preferredLocation);

      for (const location of ordered) {
        await this.selectDropdownFilter('Current Location', location);

        if (await this.isFilterFieldEnabled('Business Unit')) {
          return location;
        }
      }

      return undefined;
    });
  }

  /**
   * Probes EVERY Business Unit option until one enables Department — only
   * some business units have departments attached. Assumes Business Unit is
   * already enabled. Tries the full live option list, no artificial cap.
   * Returns the business unit that worked, or undefined when none does.
   */
  async findBusinessUnitEnablingDepartment(): Promise<string | undefined> {
    return allure.step('Find a Business Unit that enables the Department filter', async () => {
      const businessUnits = await this.readDropdownOptions('Business Unit');

      for (const businessUnit of businessUnits) {
        await this.selectDropdownFilter('Business Unit', businessUnit);

        if (await this.isFilterFieldEnabled('Department')) {
          return businessUnit;
        }
      }

      return undefined;
    });
  }

  /** Moves `preferred` to the front when present, leaving the rest of the order intact. */
  private preferFirst(options: readonly string[], preferred?: string): string[] {
    if (!preferred || !options.includes(preferred)) {
      return [...options];
    }

    return [preferred, ...options.filter((option) => option !== preferred)];
  }

  // ─── Getters (values) ────────────────────────────────────

  /**
   * Reads a dropdown filter's options from the live UI so specs never hardcode
   * option lists. Closes the PrimeNG panel by re-clicking its own trigger
   * (toggle-close) rather than Escape — the dialog itself also closes on
   * Escape (see dismissWithEscape/TC-TAG-ASSET-012), so a page-level Escape
   * here would dismiss the whole Add Tracking dialog, not just the panel.
   */
  async readDropdownOptions(fieldLabel: string): Promise<string[]> {
    return allure.step(`Read the available "${fieldLabel}" options from the live dropdown`, async () => {
      await this.openDropdown(fieldLabel);
      const options = this.repository.locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION');
      const labels = (await options.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
      await this.pickerFilterCombobox(fieldLabel).click();
      return labels;
    });
  }

  /** False for filters the application gates (verified live: Business Unit and Department render disabled). */
  async isFilterFieldEnabled(fieldLabel: string): Promise<boolean> {
    const combobox = this.pickerFilterCombobox(fieldLabel);

    if ((await combobox.count()) > 0) {
      return (await combobox.getAttribute('aria-disabled')) === 'false';
    }

    return this.pickerFilterInput(fieldLabel).isEnabled();
  }

  async readTextFilter(fieldLabel: string): Promise<string> {
    return this.pickerFilterInput(fieldLabel).inputValue();
  }

  async readDropdownFilterLabel(fieldLabel: string): Promise<string> {
    return (await this.pickerFilterCombobox(fieldLabel).innerText()).trim();
  }

  async countAssetRows(): Promise<number> {
    return this.assetRows().count();
  }

  /** Checked count on the CURRENT grid page only (the grid is paginated). */
  async countCheckedAssetsOnCurrentPage(): Promise<number> {
    const rows = this.assetRows();
    const rowCount = await rows.count();
    let checked = 0;

    for (let index = 0; index < rowCount; index += 1) {
      const highlight = await this.rowCheckbox(rows.nth(index)).getAttribute('data-p-highlight');

      if (highlight === 'true') {
        checked += 1;
      }
    }

    return checked;
  }

  /** Eligible (selectable, not already-linked) row count on the CURRENT grid page only. */
  async countEligibleAssetsOnCurrentPage(): Promise<number> {
    const rows = this.assetRows();
    const rowCount = await rows.count();
    let eligible = 0;

    for (let index = 0; index < rowCount; index += 1) {
      const disabled = await this.rowCheckbox(rows.nth(index)).getAttribute('data-p-disabled');

      if (disabled !== 'true') {
        eligible += 1;
      }
    }

    return eligible;
  }

  async readAssetColumnValues(columnIndex: number): Promise<string[]> {
    const rows = this.assetRows();
    const rowCount = await rows.count();
    const values: string[] = [];

    for (let index = 0; index < rowCount; index += 1) {
      values.push((await rows.nth(index).locator('td').nth(columnIndex).innerText()).trim());
    }

    return values;
  }

  async readColumnHeaders(): Promise<string[]> {
    const headers = this.repository.locator('TAGGING.DIALOG.COLUMN_HEADER', { scope: this.root() });
    return (await headers.allInnerTexts()).map((text) => text.trim());
  }

  async isSaveEnabled(): Promise<boolean> {
    return this.saveButton().isEnabled();
  }

  async selectAssetByFixedAssetNumber(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Select asset "${fixedAssetNumber}" in the picker grid`, async () => {
      const row = this.assetRowByFixedAssetNumber(fixedAssetNumber);
      await this.rowCheckbox(row).click();
    });
  }

  /**
   * Selects the first eligible (not already-linked) asset row, excluding any
   * Fixed Asset Number already chosen. Searches across grid pages — the demo
   * dataset's pool of unlinked assets shrinks with every container created,
   * so eligible rows are not guaranteed to be on page 1. Returns the Fixed
   * Asset Number it selected.
   */
  async selectFirstEligibleAsset(excludedFixedAssetNumbers: readonly string[]): Promise<string> {
    return allure.step('Select the first eligible asset row not already selected', async () => {
      const maxPages = 20;

      for (let page = 0; page < maxPages; page += 1) {
        const rows = this.assetRows();
        const rowCount = await rows.count();

        for (let index = 0; index < rowCount; index += 1) {
          const row = rows.nth(index);
          const fixedAssetNumber = (await row.locator('td').nth(1).innerText()).trim();

          if (excludedFixedAssetNumbers.includes(fixedAssetNumber)) {
            continue;
          }

          const disabled = await this.rowCheckbox(row).getAttribute('data-p-disabled');

          if (disabled === 'true') {
            continue;
          }

          await this.rowCheckbox(row).click();
          return fixedAssetNumber;
        }

        const advanced = await this.goToNextGridPage();

        if (!advanced) {
          break;
        }
      }

      throw new Error('No eligible asset row available across the picker grid pages');
    });
  }

  /** Advances the picker grid to the next page. Returns false when already on the last page. */
  private async goToNextGridPage(): Promise<boolean> {
    const nextPageButton = this.repository.locator('TAGGING.DIALOG.NEXT_PAGE_BUTTON', { scope: this.root() });
    const isDisabled = await nextPageButton.isDisabled();

    if (isDisabled) {
      return false;
    }

    await nextPageButton.click();
    await expect(this.assetRows().first()).toBeVisible({ timeout: 15_000 });
    return true;
  }

  /** Selects up to `count` eligible assets (across grid pages), returning the Fixed Asset Numbers chosen. */
  async selectEligibleAssets(count: number, excludedFixedAssetNumbers: readonly string[] = []): Promise<string[]> {
    return allure.step(`Select ${count} eligible asset(s) in the picker grid`, async () => {
      const selected: string[] = [];
      const excluded = [...excludedFixedAssetNumbers];

      for (let index = 0; index < count; index += 1) {
        const fixedAssetNumber = await this.selectFirstEligibleAsset(excluded);
        selected.push(fixedAssetNumber);
        excluded.push(fixedAssetNumber);
      }

      return selected;
    });
  }

  async unselectAsset(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Unselect asset "${fixedAssetNumber}" in the picker grid`, async () => {
      await this.selectAssetByFixedAssetNumber(fixedAssetNumber);
    });
  }

  async uploadAttachment(filePath: string): Promise<void> {
    await allure.step('Upload an attachment to the Add Tracking dialog', async () => {
      await this.attachmentInput().setInputFiles(filePath);
    });
  }

  async save(): Promise<void> {
    await allure.step('Save the asset picker dialog', async () => {
      await this.saveButton().click();
      await expect(this.root()).toBeHidden({ timeout: 30_000 });
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertOpenForCreation(): Promise<void> {
    await allure.step('Assert the Add Tracking dialog is open for creation', async () => {
      await expect(this.root()).toBeVisible();
      await expect(this.title()).toBeVisible();
      const fieldCount = await this.editableFields().count();
      expect(fieldCount).toBeGreaterThan(0);
      await this.waitForGridSettled();
    });
  }

  async assertClosed(): Promise<void> {
    await allure.step('Assert the Add Tracking dialog is closed', async () => {
      await expect(this.root()).toBeHidden();
    });
  }

  async assertOpenWithTitle(expectedTitle: string): Promise<void> {
    await allure.step(`Assert the asset picker dialog is open with title "${expectedTitle}"`, async () => {
      await expect(this.root()).toBeVisible();
      await expect(this.title()).toHaveText(expectedTitle);
      await this.waitForGridSettled();
    });
  }

  /**
   * Waits for the picker grid's async initial load to finish — either a real
   * row or the "No Data Found" empty-state row, either way `table tbody tr`
   * becomes visible. Without this, reading rows immediately after the dialog
   * opens can race the fetch and see zero rows (verified live: a fresh
   * TC-TAG-ASSET-061 run read 0 Fixed Asset Numbers on an otherwise
   * populated grid).
   */
  private async waitForGridSettled(): Promise<void> {
    const rawRows = this.repository.locator('TAGGING.DIALOG.ASSET_ROW', { scope: this.root() });
    await expect(rawRows.first()).toBeVisible({ timeout: 20_000 });
  }

  async assertAllPickerFilterFieldsPresent(): Promise<void> {
    await allure.step('Assert all 8 advanced filter fields are present in the asset picker', async () => {
      for (const fieldLabel of PICKER_FILTER_FIELD_LABELS) {
        await expect(this.pickerFilterField(fieldLabel)).toBeVisible();
      }
    });
  }

  async assertSaveDisabled(): Promise<void> {
    await allure.step('Assert the dialog Save button is disabled', async () => {
      await expect(this.saveButton()).toBeDisabled();
    });
  }

  async assertSaveEnabled(): Promise<void> {
    await allure.step('Assert the dialog Save button is enabled', async () => {
      await expect(this.saveButton()).toBeEnabled();
    });
  }

  async assertNoAssetRows(): Promise<void> {
    await allure.step('Assert the asset picker grid returned no rows', async () => {
      await expect(this.assetRows()).toHaveCount(0);
    });
  }

  async assertAssetNotSelectable(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Assert asset "${fixedAssetNumber}" cannot be selected`, async () => {
      const row = this.assetRowByFixedAssetNumber(fixedAssetNumber);
      await expect(this.rowCheckbox(row)).toHaveAttribute('data-p-disabled', 'true');
    });
  }

  async assertAssetChecked(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Assert asset "${fixedAssetNumber}" is checked`, async () => {
      const row = this.assetRowByFixedAssetNumber(fixedAssetNumber);
      await expect(this.rowCheckbox(row)).toHaveAttribute('data-p-highlight', 'true');
    });
  }

  async assertAssetUnchecked(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Assert asset "${fixedAssetNumber}" is unchecked`, async () => {
      const row = this.assetRowByFixedAssetNumber(fixedAssetNumber);
      await expect(this.rowCheckbox(row)).toHaveAttribute('data-p-highlight', 'false');
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  async readTitle(): Promise<string> {
    return (await this.title().textContent())?.trim() ?? '';
  }

  async hasEditableFields(): Promise<boolean> {
    const fieldCount = await this.editableFields().count();
    return fieldCount > 0;
  }

  /** Optional reader — undefined when every row on the current picker grid page is eligible. */
  async findFirstDisabledFixedAssetNumber(): Promise<string | undefined> {
    const rows = this.assetRows();
    const rowCount = await rows.count();

    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const disabled = await this.rowCheckbox(row).getAttribute('data-p-disabled');

      if (disabled === 'true') {
        return (await row.locator('td').nth(1).innerText()).trim();
      }
    }

    return undefined;
  }

  async isAssetSelectable(fixedAssetNumber: string): Promise<boolean> {
    const row = this.assetRowByFixedAssetNumber(fixedAssetNumber);
    const rowCount = await row.count();

    if (rowCount === 0) {
      return false;
    }

    const disabled = await this.rowCheckbox(row).getAttribute('data-p-disabled');
    return disabled === 'false';
  }

  async readSelectedCount(): Promise<number> {
    const text = await this.selectedCountLabel().innerText();
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  async readAttachmentChooseLabel(): Promise<string> {
    return (await this.attachmentChooseLabel().textContent())?.trim() ?? '';
  }

  // ─── Helpers (private) ──────────────────────────────────

  private root(): Locator {
    return this.repository.locator('TAGGING.DIALOG.ROOT');
  }

  private title(): Locator {
    return this.repository.locator('TAGGING.DIALOG.TITLE', { scope: this.root() });
  }

  private editableFields(): Locator {
    return this.repository.locator('TAGGING.DIALOG.FIELD_CONTAINER', { scope: this.root() });
  }

  private cancelButton(): Locator {
    return this.repository.locator('TAGGING.DIALOG.CANCEL_BUTTON', { scope: this.root() });
  }

  private pickerFilterField(fieldLabel: string): Locator {
    return this.repository.locator('TAGGING.DIALOG.PICKER_FILTER_FIELD', {
      scope: this.root(),
      parameters: { fieldLabel },
    });
  }

  private fixedAssetNumberInput(): Locator {
    return this.repository.locator('TAGGING.DIALOG.FIXED_ASSET_NUMBER_INPUT', { scope: this.root() });
  }

  private pickerFilterInput(fieldLabel: string): Locator {
    return this.repository.locator('TAGGING.DIALOG.PICKER_FILTER_INPUT', {
      scope: this.root(),
      parameters: { fieldLabel },
    });
  }

  private pickerFilterCombobox(fieldLabel: string): Locator {
    return this.repository.locator('TAGGING.DIALOG.PICKER_FILTER_COMBOBOX', {
      scope: this.root(),
      parameters: { fieldLabel },
    });
  }

  private async openDropdown(fieldLabel: string): Promise<void> {
    await this.pickerFilterCombobox(fieldLabel).click();
    await this.repository
      .locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  private searchButton(): Locator {
    return this.repository.locator('TAGGING.DIALOG.SEARCH_BUTTON', { scope: this.root() });
  }

  private clearButton(): Locator {
    return this.repository.locator('TAGGING.DIALOG.CLEAR_BUTTON', { scope: this.root() });
  }

  private saveButton(): Locator {
    return this.repository.locator('TAGGING.DIALOG.SAVE_BUTTON', { scope: this.root() });
  }

  private selectedCountLabel(): Locator {
    return this.repository.locator('TAGGING.DIALOG.SELECTED_COUNT_LABEL', { scope: this.root() });
  }

  /**
   * Real asset rows only. A no-match filter still renders one row with a
   * single td[colspan] reading "No Data Found" (verified live) — counting it
   * would make an empty result look like a single match, so it is excluded
   * here for every caller (selection, counting, column reads).
   */
  private assetRows(): Locator {
    const rows = this.repository.locator('TAGGING.DIALOG.ASSET_ROW', { scope: this.root() });
    return rows.filter({ hasNot: this.repository.locator('TAGGING.DIALOG.EMPTY_STATE_CELL') });
  }

  private assetRowByFixedAssetNumber(fixedAssetNumber: string): Locator {
    return this.assetRows().filter({ hasText: fixedAssetNumber });
  }

  private rowCheckbox(row: Locator): Locator {
    return this.repository.locator('TAGGING.ROW_CHECKBOX', { scope: row });
  }

  private attachmentInput(): Locator {
    return this.repository.locator('TAGGING.DIALOG.ATTACHMENT_INPUT', { scope: this.root() });
  }

  private attachmentChooseLabel(): Locator {
    return this.repository.locator('TAGGING.DIALOG.ATTACHMENT_CHOOSE_LABEL', { scope: this.root() });
  }
}
