import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

/**
 * Container-list Advanced Filters panel: Search (text), Status (multiselect),
 * Date From / Date To (calendars), plus the Search and Clear actions.
 *
 * Distinct from AdvancedFilterComponent, which drives the asset-picker filter
 * form inside the Add Tracking dialog — different DOM, different fields.
 * Verified live: the panel only exists in the DOM once the Advanced Filters
 * toggle has been pressed, so every action expands it first.
 */
export class ContainerListFilterComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  // ─── Actions ─────────────────────────────────────────────

  async expand(): Promise<void> {
    await allure.step('Expand the container list Advanced Filters panel', async () => {
      if (await this.panel().isVisible()) {
        return;
      }

      await this.toggle().click();
      await expect(this.panel()).toBeVisible();
    });
  }

  async setSearch(value: string): Promise<void> {
    await allure.step(`Set the container list Search filter to "${value}"`, async () => {
      await this.searchInput().fill(value);
    });
  }

  /**
   * `Tab` commits the typed date and moves focus off the field. Escape was
   * tried first but reverts the visible input back to empty (verified live:
   * TC-TAG-ASSET-023) even though the underlying filter is still applied —
   * PrimeNG's calendar overlay treats Escape as cancel, not confirm.
   */
  async setDateFrom(value: string): Promise<void> {
    await allure.step(`Set Date From to "${value}"`, async () => {
      await this.dateFromInput().fill(value);
      await this.page.keyboard.press('Tab');
    });
  }

  async setDateTo(value: string): Promise<void> {
    await allure.step(`Set Date To to "${value}"`, async () => {
      await this.dateToInput().fill(value);
      await this.page.keyboard.press('Tab');
    });
  }

  /**
   * Matches by normalized text rather than the raw parameterized locator:
   * verified live, the container-list grid cell renders a status like
   * "Approved - Ready to Print" with a plain hyphen, while this same status
   * in the Status filter dropdown renders as "Approved — Ready to Print"
   * with an em dash — a genuine inconsistency between the two UI surfaces
   * for the identical value. Normalizing dash variants makes selection work
   * regardless of which punctuation a caller's status string came from.
   */
  async selectStatus(statusLabel: string): Promise<void> {
    await allure.step(`Select the Status filter option "${statusLabel}"`, async () => {
      await this.openStatusPanel();
      const target = this.normalizeDashes(statusLabel);
      const options = this.repository.locator('TAGGING.LIST_FILTERS.STATUS_ANY_OPTION');
      const optionCount = await options.count();
      let matched = false;

      for (let index = 0; index < optionCount; index += 1) {
        const optionText = (await options.nth(index).innerText()).trim();

        if (this.normalizeDashes(optionText) === target) {
          await options.nth(index).click();
          matched = true;
          break;
        }
      }

      if (!matched) {
        throw new Error(`No Status option matching "${statusLabel}" was found in the live dropdown`);
      }

      await this.page.keyboard.press('Escape');
    });
  }

  private normalizeDashes(value: string): string {
    return value.replace(/[‐-―]/g, '-').trim();
  }

  async search(): Promise<void> {
    await allure.step('Apply the container list filters via Search', async () => {
      await this.searchButton().click();
    });
  }

  async clear(): Promise<void> {
    await allure.step('Clear the container list filters', async () => {
      await this.clearButton().click();
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertExpanded(): Promise<void> {
    await allure.step('Assert the container list filter panel is expanded', async () => {
      await expect(this.panel()).toBeVisible();
    });
  }

  async assertControlsReset(): Promise<void> {
    await allure.step('Assert every container list filter control is back to its default state', async () => {
      await expect(this.searchInput()).toHaveValue('');
      await expect(this.dateFromInput()).toHaveValue('');
      await expect(this.dateToInput()).toHaveValue('');
      await expect(this.statusLabel()).toHaveText('Select Status');
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  async readSearch(): Promise<string> {
    return this.searchInput().inputValue();
  }

  async readDateFrom(): Promise<string> {
    return this.dateFromInput().inputValue();
  }

  async readDateTo(): Promise<string> {
    return this.dateToInput().inputValue();
  }

  async readStatusLabel(): Promise<string> {
    return (await this.statusLabel().innerText()).trim();
  }

  /** Reads the Status options straight from the live dropdown — never a hardcoded status list. */
  async readAvailableStatuses(): Promise<string[]> {
    return allure.step('Read the available Status filter options from the live dropdown', async () => {
      await this.openStatusPanel();
      const options = this.repository.locator('TAGGING.LIST_FILTERS.STATUS_ANY_OPTION');
      const labels = (await options.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
      await this.page.keyboard.press('Escape');
      return labels;
    });
  }

  // ─── Helpers (private) ──────────────────────────────────

  private async openStatusPanel(): Promise<void> {
    await this.statusMultiselect().click();
    await this.repository
      .locator('TAGGING.LIST_FILTERS.STATUS_ANY_OPTION')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  private toggle(): Locator {
    return this.repository.locator('TAGGING.FILTERS.TOGGLE');
  }

  private panel(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.PANEL');
  }

  private searchInput(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.SEARCH_INPUT', { scope: this.panel() });
  }

  private statusMultiselect(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.STATUS_MULTISELECT', { scope: this.panel() });
  }

  private statusLabel(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.STATUS_LABEL', { scope: this.panel() });
  }

  private dateFromInput(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.DATE_FROM_INPUT', { scope: this.panel() });
  }

  private dateToInput(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.DATE_TO_INPUT', { scope: this.panel() });
  }

  private searchButton(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.SEARCH_BUTTON', { scope: this.panel() });
  }

  private clearButton(): Locator {
    return this.repository.locator('TAGGING.LIST_FILTERS.CLEAR_BUTTON', { scope: this.panel() });
  }
}
