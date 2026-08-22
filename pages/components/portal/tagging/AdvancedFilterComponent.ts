import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

export class AdvancedFilterComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {
    void this.page;
  }

  // ─── Actions ─────────────────────────────────────────────

  async expand(): Promise<void> {
    await allure.step('Expand the advanced filter panel', async () => {
      await this.toggle().click();
      await expect(this.panel()).toBeVisible();
    });
  }

  async setField(fieldLabel: string, value: string): Promise<void> {
    await allure.step(`Set advanced filter field "${fieldLabel}" to "${value}"`, async () => {
      await this.field(fieldLabel).fill(value);
    });
  }

  async apply(): Promise<void> {
    await allure.step('Apply the advanced filter', async () => {
      await this.applyButton().click();
    });
  }

  async reset(): Promise<void> {
    await allure.step('Reset the advanced filter', async () => {
      await this.resetButton().click();
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertExpanded(): Promise<void> {
    await allure.step('Assert the advanced filter panel is expanded', async () => {
      await expect(this.panel()).toBeVisible();
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  async readActiveFilterLabels(): Promise<string[]> {
    const chips = this.activeFilterChips();
    const chipCount = await chips.count();
    const labels: string[] = [];

    for (let index = 0; index < chipCount; index += 1) {
      const text = await chips.nth(index).textContent();
      labels.push(text?.trim() ?? '');
    }

    return labels;
  }

  async readField(fieldLabel: string): Promise<string> {
    return this.field(fieldLabel).inputValue();
  }

  // ─── Helpers (private) ──────────────────────────────────

  private toggle(): Locator {
    return this.repository.locator('TAGGING.FILTERS.TOGGLE');
  }

  private panel(): Locator {
    return this.repository.locator('TAGGING.FILTERS.PANEL');
  }

  private applyButton(): Locator {
    return this.repository.locator('TAGGING.FILTERS.APPLY_BUTTON', { scope: this.panel() });
  }

  private resetButton(): Locator {
    return this.repository.locator('TAGGING.FILTERS.RESET_BUTTON', { scope: this.panel() });
  }

  private activeFilterChips(): Locator {
    return this.repository.locator('TAGGING.FILTERS.ACTIVE_FILTER_CHIP', { scope: this.panel() });
  }

  private field(fieldLabel: string): Locator {
    return this.repository.locator('TAGGING.FILTERS.FIELD', {
      scope: this.panel(),
      parameters: { fieldLabel },
    });
  }
}
