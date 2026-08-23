import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

/**
 * Show Details dialog for a tracking container: the "Show Assets (N)" tab
 * (open by default), its asset rows, and the close (X) control.
 */
export class TrackingContainerDetailsComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {
    void this.page;
  }

  // ─── Actions ─────────────────────────────────────────────

  async close(): Promise<void> {
    await allure.step('Close the Show Details dialog', async () => {
      await this.closeButton().click();
      await expect(this.root()).toBeHidden();
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertOpen(): Promise<void> {
    await allure.step('Assert the Show Details dialog is open', async () => {
      await expect(this.root()).toBeVisible();
    });
  }

  async assertAssetCount(expectedCount: number): Promise<void> {
    await allure.step(`Assert the Show Details asset count is ${expectedCount}`, async () => {
      await expect(this.tabLabel()).toHaveText(`Show Assets (${expectedCount})`);
      await expect(this.assetRows()).toHaveCount(expectedCount);
    });
  }

  async assertContainsFixedAssetNumber(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Assert Show Details lists Fixed Asset Number "${fixedAssetNumber}"`, async () => {
      await expect(this.assetRows().filter({ hasText: fixedAssetNumber })).toHaveCount(1);
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  async readFixedAssetNumbers(): Promise<string[]> {
    const rows = this.assetRows();
    const rowCount = await rows.count();
    const fixedAssetNumbers: string[] = [];

    for (let index = 0; index < rowCount; index += 1) {
      const value = await rows.nth(index).locator('td').first().innerText();
      fixedAssetNumbers.push(value.trim());
    }

    return fixedAssetNumbers;
  }

  // ─── Helpers (private) ──────────────────────────────────

  private root(): Locator {
    return this.repository.locator('TAGGING.DETAILS.ROOT');
  }

  private tabLabel(): Locator {
    return this.repository.locator('TAGGING.DETAILS.TAB_LABEL', { scope: this.root() });
  }

  private assetRows(): Locator {
    return this.repository.locator('TAGGING.DETAILS.ASSET_ROW', { scope: this.root() });
  }

  private closeButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.CLOSE_BUTTON', { scope: this.root() });
  }
}
