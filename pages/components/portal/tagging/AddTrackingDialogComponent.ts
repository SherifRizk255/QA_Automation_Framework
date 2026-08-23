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
    });
  }

  async assertAllPickerFilterFieldsPresent(): Promise<void> {
    await allure.step('Assert all 8 advanced filter fields are present in the asset picker', async () => {
      for (const fieldLabel of PICKER_FILTER_FIELD_LABELS) {
        await expect(this.pickerFilterField(fieldLabel)).toBeVisible();
      }
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

  private assetRows(): Locator {
    return this.repository.locator('TAGGING.DIALOG.ASSET_ROW', { scope: this.root() });
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
