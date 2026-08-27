import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ENV, portalHashRoute, ROUTES } from '../../../config/resources';
import { PortalHeaderComponent } from '../../components/portal/navigation/PortalHeaderComponent';
import { BasePortalPage } from '../BasePortalPage';

const ASSET_PROFILE_MODULE_LABEL = 'Asset Profiles';

/** Value the profile renders for an unset field (em dash, U+2014) — verified live. */
export const EMPTY_FIELD_VALUE = '—';

/** The six section headings the profile renders, in the order the page lays them out. */
export const PROFILE_SECTIONS = [
  'General Information',
  'Asset Type',
  'Asset Location',
  'Asset Responsibility',
  'Recent Transactions',
  'Asset Notes Timeline',
] as const;

export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

/**
 * Asset Profile module (#/AssetsProfileDetails).
 *
 * Search accepts three independent identifiers (Fixed Asset Number, New
 * Reference Number, Old Reference Number) via stable input IDs, and renders a
 * hero card plus six section cards. Field values live in `dt`/`dd` pairs, so
 * `readField()` works for any labelled value in any section without needing a
 * locator per field.
 */
export class AssetProfilePage extends BasePortalPage {
  private readonly header: PortalHeaderComponent;

  constructor(page: Page, private readonly testInfo?: TestInfo) {
    super(page);
    void this.testInfo;
    this.header = new PortalHeaderComponent(page, this.repository);
  }

  // ─── Navigation ──────────────────────────────────────────

  async openFromHeader(): Promise<void> {
    await allure.step('Open Asset Profiles from the portal header', async () => {
      await this.header.openModule(ASSET_PROFILE_MODULE_LABEL);
      await this.assertSearchFormVisible();
    });
  }

  async openByRoute(): Promise<void> {
    await allure.step('Navigate directly to the Asset Profiles route', async () => {
      await this.page.goto(portalHashRoute(ROUTES.portal.assetProfile, ENV.portal.loginUrl));
      await this.assertSearchFormVisible();
    });
  }

  // ─── Actions ─────────────────────────────────────────────

  async searchByFixedAssetNumber(value: string): Promise<void> {
    await allure.step(`Search Asset Profile by Fixed Asset Number "${value}"`, async () => {
      await this.clearSearchInputs();
      await this.fixedAssetNumberInput().fill(value);
      await this.submitSearch();
    });
  }

  async searchByNewReferenceNumber(value: string): Promise<void> {
    await allure.step(`Search Asset Profile by New Reference Number "${value}"`, async () => {
      await this.clearSearchInputs();
      await this.newReferenceNumberInput().fill(value);
      await this.submitSearch();
    });
  }

  async searchByOldReferenceNumber(value: string): Promise<void> {
    await allure.step(`Search Asset Profile by Old Reference Number "${value}"`, async () => {
      await this.clearSearchInputs();
      await this.oldReferenceNumberInput().fill(value);
      await this.submitSearch();
    });
  }

  /** Presses Search without waiting for a profile — for negative/empty-input cases. */
  async submitSearch(): Promise<void> {
    await this.searchButton().click();
  }

  async clearSearch(): Promise<void> {
    await allure.step('Clear the Asset Profile search', async () => {
      await this.clearButton().click();
    });
  }

  /** Empties all three inputs without pressing Search (each search targets one identifier). */
  async clearSearchInputs(): Promise<void> {
    await this.fixedAssetNumberInput().fill('');
    await this.newReferenceNumberInput().fill('');
    await this.oldReferenceNumberInput().fill('');
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertSearchFormVisible(): Promise<void> {
    await allure.step('Assert the Asset Profile search form is visible', async () => {
      await expect(this.fixedAssetNumberInput()).toBeVisible({ timeout: 30_000 });
      await expect(this.newReferenceNumberInput()).toBeVisible();
      await expect(this.oldReferenceNumberInput()).toBeVisible();
      await expect(this.searchButton()).toBeVisible();
      await expect(this.clearButton()).toBeVisible();
    });
  }

  async assertProfileVisible(): Promise<void> {
    await allure.step('Assert an asset profile is displayed', async () => {
      await expect(this.hero()).toBeVisible({ timeout: 30_000 });
    });
  }

  async assertProfileNotVisible(): Promise<void> {
    await allure.step('Assert no asset profile is displayed', async () => {
      await expect(this.hero()).toBeHidden();
    });
  }

  async assertEmptyStateVisible(): Promise<void> {
    await allure.step('Assert the "No asset found" empty state is displayed', async () => {
      await expect(this.emptyState()).toBeVisible({ timeout: 30_000 });
      await expect(this.emptyState()).toContainText('No asset found for the given criteria.');
    });
  }

  async assertSearchButtonDisabled(): Promise<void> {
    await expect(this.searchButton()).toBeDisabled();
  }

  async assertSearchButtonEnabled(): Promise<void> {
    await expect(this.searchButton()).toBeEnabled();
  }

  async assertNotesEmptyStateVisible(): Promise<void> {
    await allure.step('Assert the Asset Notes Timeline empty state is displayed', async () => {
      await expect(this.notesEmptyState()).toBeVisible();
      await expect(this.notesEmptyState()).toContainText('No notes available.');
    });
  }

  async assertAllSectionsVisible(): Promise<void> {
    await allure.step('Assert all six Asset Profile sections are visible', async () => {
      for (const heading of PROFILE_SECTIONS) {
        await expect(this.section(heading)).toBeVisible();
      }
    });
  }

  async assertFixedAssetNumber(expected: string): Promise<void> {
    await allure.step(`Assert the displayed Fixed Asset Number is "${expected}"`, async () => {
      await expect(this.heroFixedAssetNumber()).toHaveText(expected, { timeout: 30_000 });
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  /** Reads any labelled profile value by its dt text (works across every section). */
  async readField(fieldLabel: string): Promise<string> {
    const value = this.repository.locator('ASSET_PROFILE.FIELD_VALUE', {
      scope: this.repository.locator('ASSET_PROFILE.FIELD_ROW', { parameters: { fieldLabel } }).first(),
    });
    return (await value.innerText()).trim();
  }

  async hasField(fieldLabel: string): Promise<boolean> {
    const row = this.repository.locator('ASSET_PROFILE.FIELD_ROW', { parameters: { fieldLabel } });
    return (await row.count()) > 0;
  }

  async readHeroTitle(): Promise<string> {
    return (await this.heroTitle().innerText()).trim();
  }

  async readHeroFixedAssetNumber(): Promise<string> {
    return (await this.heroFixedAssetNumber().innerText()).trim();
  }

  async readHeroStatus(): Promise<string> {
    return (await this.heroStatus().innerText()).trim();
  }

  async readHeroCategory(): Promise<string> {
    return (await this.heroCategory().innerText()).trim();
  }

  async isProfileVisible(): Promise<boolean> {
    return this.hero().isVisible();
  }

  async countSections(): Promise<number> {
    return this.repository.locator('ASSET_PROFILE.SECTION').count();
  }

  /** Reads a section's whole rendered text — used for empty-state / transaction checks. */
  async readSectionText(heading: ProfileSection): Promise<string> {
    return (await this.section(heading).innerText()).trim();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState().isVisible();
  }

  async isSearchButtonDisabled(): Promise<boolean> {
    return this.searchButton().isDisabled();
  }

  /**
   * The Recent Transactions timeline holds TWO kinds of entry (verified live
   * 2026-08-25), which share the same `<li>` but not the same structure:
   *
   * - Module transactions: `.ap-ev-module` (e.g. "Disposal", "Movement") +
   *   `.ap-ev-status` (e.g. "Checker Approved") + `.ap-ev-date`, optionally
   *   an `.ap-ev-ref` container number.
   * - User notes: `.ap-note-text` + `.ap-ev-date` only — no module, no status.
   *
   * This returns ONLY the module transactions, so callers can assert that
   * every one carries a module/status/date without a note entry (correctly
   * having neither) failing the assertion. Use `readNotes()` for note
   * entries. Each sub-field is still read count-checked rather than via a
   * blind `innerText()`.
   */
  async readTransactions(): Promise<Array<{ module: string; status: string; date: string }>> {
    const items = this.repository.locator('ASSET_PROFILE.TX_LIST_ITEM');
    const count = await items.count();
    const transactions: Array<{ module: string; status: string; date: string }> = [];

    for (let index = 0; index < count; index += 1) {
      const item = items.nth(index);
      const moduleLocator = this.repository.locator('ASSET_PROFILE.TX_MODULE', { scope: item });

      if ((await moduleLocator.count()) === 0) {
        continue;
      }

      transactions.push({
        module: await this.readOptionalText(moduleLocator),
        status: await this.readOptionalText(this.repository.locator('ASSET_PROFILE.TX_STATUS', { scope: item })),
        date: await this.readOptionalText(this.repository.locator('ASSET_PROFILE.TX_DATE', { scope: item })),
      });
    }

    return transactions;
  }

  /** Note entries in the same timeline (`.ap-note-text` + date, no module/status). */
  async readNotes(): Promise<Array<{ text: string; date: string }>> {
    const items = this.repository.locator('ASSET_PROFILE.TX_LIST_ITEM');
    const count = await items.count();
    const notes: Array<{ text: string; date: string }> = [];

    for (let index = 0; index < count; index += 1) {
      const item = items.nth(index);
      const noteLocator = this.repository.locator('ASSET_PROFILE.NOTE_TEXT', { scope: item });

      if ((await noteLocator.count()) === 0) {
        continue;
      }

      notes.push({
        text: await this.readOptionalText(noteLocator),
        date: await this.readOptionalText(this.repository.locator('ASSET_PROFILE.TX_DATE', { scope: item })),
      });
    }

    return notes;
  }

  private async readOptionalText(locator: Locator): Promise<string> {
    const count = await locator.count();

    if (count === 0) {
      return '';
    }

    return (await locator.first().innerText()).trim();
  }

  async isNotesEmptyStateVisible(): Promise<boolean> {
    return this.notesEmptyState().isVisible();
  }

  async readSearchInputValues(): Promise<{ fixedAssetNumber: string; newReference: string; oldReference: string }> {
    return {
      fixedAssetNumber: await this.fixedAssetNumberInput().inputValue(),
      newReference: await this.newReferenceNumberInput().inputValue(),
      oldReference: await this.oldReferenceNumberInput().inputValue(),
    };
  }

  // ─── Helpers (private) ──────────────────────────────────

  private fixedAssetNumberInput(): Locator {
    return this.repository.locator('ASSET_PROFILE.SEARCH.FIXED_ASSET_NUMBER_INPUT');
  }

  private newReferenceNumberInput(): Locator {
    return this.repository.locator('ASSET_PROFILE.SEARCH.NEW_REFERENCE_NUMBER_INPUT');
  }

  private oldReferenceNumberInput(): Locator {
    return this.repository.locator('ASSET_PROFILE.SEARCH.OLD_REFERENCE_NUMBER_INPUT');
  }

  private searchButton(): Locator {
    return this.repository.locator('ASSET_PROFILE.SEARCH.SEARCH_BUTTON');
  }

  private clearButton(): Locator {
    return this.repository.locator('ASSET_PROFILE.SEARCH.CLEAR_BUTTON');
  }

  private hero(): Locator {
    return this.repository.locator('ASSET_PROFILE.HERO.ROOT');
  }

  private heroTitle(): Locator {
    return this.repository.locator('ASSET_PROFILE.HERO.TITLE', { scope: this.hero() });
  }

  private heroFixedAssetNumber(): Locator {
    return this.repository.locator('ASSET_PROFILE.HERO.FIXED_ASSET_NUMBER', { scope: this.hero() });
  }

  private heroStatus(): Locator {
    return this.repository.locator('ASSET_PROFILE.HERO.STATUS_TAG', { scope: this.hero() });
  }

  private heroCategory(): Locator {
    return this.repository.locator('ASSET_PROFILE.HERO.CATEGORY', { scope: this.hero() });
  }

  private section(heading: ProfileSection): Locator {
    return this.repository.locator('ASSET_PROFILE.SECTION_BY_HEADING', { parameters: { heading } });
  }

  private emptyState(): Locator {
    return this.repository.locator('ASSET_PROFILE.EMPTY_STATE');
  }

  private notesEmptyState(): Locator {
    return this.repository.locator('ASSET_PROFILE.NOTES_EMPTY_STATE');
  }
}
