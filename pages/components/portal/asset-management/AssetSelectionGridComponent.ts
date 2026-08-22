import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

/**
 * Asset selection grid on the Tagging screen.
 *
 * `role=row` matches both the header row and data rows; the header row holds
 * the select-all checkbox and its cells are `role=columnheader`, not
 * `role=cell`. Filtering by ASSET.TAGGING.ROW_CELL excludes the header
 * semantically instead of a positional `nth(1)` hack (skill 23).
 */
export class AssetSelectionGridComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {
    void this.page;
  }

  // ─── Actions ─────────────────────────────────────────────

  async selectEligibleRows(count: number): Promise<number> {
    return allure.step(`Select ${count} eligible asset row(s)`, async () => {
      const eligibleIndexes = await this.selectableRowIndexes();
      const targetIndexes = eligibleIndexes.slice(0, count);
      const rows = this.dataRows();

      for (const index of targetIndexes) {
        await this.rowCheckbox(rows.nth(index)).check();
      }

      return targetIndexes.length;
    });
  }

  async selectAll(): Promise<void> {
    await allure.step('Select all assets via the header checkbox', async () => {
      await this.selectAllCheckbox().check();
    });
  }

  async uncheckAllRows(): Promise<void> {
    await allure.step('Clear the current asset selection', async () => {
      const selectAllCheckbox = this.selectAllCheckbox();
      const selectAllIsChecked = await selectAllCheckbox.isChecked();

      if (selectAllIsChecked) {
        await selectAllCheckbox.uncheck();
        return;
      }

      const rows = this.dataRows();
      const rowCount = await rows.count();

      for (let index = 0; index < rowCount; index += 1) {
        const checkbox = this.rowCheckbox(rows.nth(index));
        const isChecked = await checkbox.isChecked();

        if (isChecked) {
          await checkbox.uncheck();
        }
      }
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertRowNotSelectable(index: number): Promise<void> {
    await allure.step(`Assert asset row ${index} cannot be selected`, async () => {
      const checkbox = this.rowCheckbox(this.dataRows().nth(index));
      const checkboxCount = await checkbox.count();

      if (checkboxCount === 0) {
        return;
      }

      await expect(checkbox).toBeDisabled();
    });
  }

  async assertEmptyStateVisible(): Promise<void> {
    await allure.step('Assert the grid shows the no-results empty state', async () => {
      await expect(this.emptyState()).toBeVisible();
    });
  }

  async assertRowCount(expectedCount: number): Promise<void> {
    await allure.step(`Assert the grid shows ${expectedCount} asset row(s)`, async () => {
      await expect(this.dataRows()).toHaveCount(expectedCount);
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  async rowCount(): Promise<number> {
    return this.dataRows().count();
  }

  async readRowIdentifier(index: number): Promise<string> {
    const identifierCell = this.repository.locator('ASSET.TAGGING.ASSET_IDENTIFIER_CELL', {
      scope: this.dataRows().nth(index),
    });
    return (await identifierCell.textContent())?.trim() ?? '';
  }

  async selectableRowIndexes(): Promise<number[]> {
    const rows = this.dataRows();
    const rowCount = await rows.count();
    const eligibleIndexes: number[] = [];

    for (let index = 0; index < rowCount; index += 1) {
      const checkbox = this.rowCheckbox(rows.nth(index));
      const checkboxCount = await checkbox.count();

      if (checkboxCount === 0) {
        continue;
      }

      const isEnabled = await checkbox.isEnabled();

      if (!isEnabled) {
        continue;
      }

      eligibleIndexes.push(index);
    }

    return eligibleIndexes;
  }

  /** Optional reader — returns undefined when every row in the current grid is eligible. */
  async findFirstIneligibleAssetIndex(): Promise<number | undefined> {
    const rows = this.dataRows();
    const rowCount = await rows.count();
    const eligibleIndexes = new Set(await this.selectableRowIndexes());

    for (let index = 0; index < rowCount; index += 1) {
      if (!eligibleIndexes.has(index)) {
        return index;
      }
    }

    return undefined;
  }

  async checkedRowCount(): Promise<number> {
    const rows = this.dataRows();
    const rowCount = await rows.count();
    let checkedCount = 0;

    for (let index = 0; index < rowCount; index += 1) {
      const checkbox = this.rowCheckbox(rows.nth(index));
      const checkboxCount = await checkbox.count();

      if (checkboxCount === 0) {
        continue;
      }

      const isChecked = await checkbox.isChecked();

      if (isChecked) {
        checkedCount += 1;
      }
    }

    return checkedCount;
  }

  // ─── Helpers (private) ──────────────────────────────────

  private get gridRoot(): Locator {
    return this.repository.locator('ASSET.TAGGING.GRID_ROOT');
  }

  private dataRows(): Locator {
    const allRows = this.repository.locator('ASSET.TAGGING.ROW', { scope: this.gridRoot });
    return allRows.filter({ has: this.repository.locator('ASSET.TAGGING.ROW_CELL') });
  }

  private rowCheckbox(row: Locator): Locator {
    return this.repository.locator('ASSET.TAGGING.ROW_CHECKBOX', { scope: row });
  }

  private selectAllCheckbox(): Locator {
    return this.repository.locator('ASSET.TAGGING.SELECT_ALL_CHECKBOX', { scope: this.gridRoot });
  }

  private emptyState(): Locator {
    return this.repository.locator('ASSET.TAGGING.EMPTY_STATE');
  }
}
