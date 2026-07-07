import { expect, type Locator, type Page } from '@playwright/test';
import { LocatorRepository } from '../../utils/locatorRepository';

/**
 * Base class for every D365 CRM page object.
 *
 * Owns the shared readiness/navigation mechanics so entity pages never
 * duplicate spinner waits, grid waits, or area switching (skill 23).
 * Long timeouts are intentional — on-prem D365 is slow: grids up to 120s,
 * records 30–60s. Do not "optimize" them down.
 */
export abstract class BaseCrmPage {
  protected readonly repository: LocatorRepository;

  protected constructor(protected readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  // ─── Readiness helpers ───────────────────────────────────────────────────

  protected async waitForDynamicsReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // D365 shows a spinner during navigation; ignore if it never appears.
    await this.page
      .locator('[data-id="LoadingSpinner"], .ms-Spinner')
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => { /* spinner may not appear on every navigation */ });
  }

  protected async waitForGrid(timeout = 120_000): Promise<void> {
    await this.waitForDynamicsReady();
    await this.firstDataRow().waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait until an opened record form is usable: Dynamics is idle and the
   * form's identifying locator is visible. Always pass both — the entity
   * name makes the failure message actionable.
   */
  protected async waitForRecordReady(options: {
    entityName: string;
    expectedFormLocator: Locator;
    timeout?: number;
  }): Promise<void> {
    await this.waitForDynamicsReady();
    await expect(
      options.expectedFormLocator,
      `${options.entityName} record form should render its identifying field`
    ).toBeVisible({ timeout: options.timeout ?? 60_000 });
  }

  protected firstDataRow(): Locator {
    // Row 1 is the header; row 2 is the first data row — the same aria-label
    // pattern is used by the D365 grid regardless of entity.
    return this.page.locator('[aria-label="Select row 2"]');
  }

  // ─── Area switching ──────────────────────────────────────────────────────

  /**
   * Switch app area via the area switcher. The target item's locator lives in
   * `docs/analysis/locator-repository.json` — pass its element id, never an
   * inline `data-id` (skill 24).
   */
  protected async switchToArea(areaItemElementId: string): Promise<void> {
    const switcher = this.page
      .locator('#areaSwitcherId')
      .or(this.page.getByRole('button', { name: /change area/i }))
      .first();
    await switcher.waitFor({ state: 'visible', timeout: 60_000 });
    await switcher.click();

    const target = this.repository.locator(areaItemElementId);
    await target.waitFor({ state: 'visible', timeout: 10_000 });
    await target.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
