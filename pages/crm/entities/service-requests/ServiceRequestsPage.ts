import { expect, type Page } from '@playwright/test';
import { BaseCrmPage } from '../../BaseCrmPage';

export class ServiceRequestsPage extends BaseCrmPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async switchToServiceRequests(): Promise<void> {
    await this.switchToArea('CRM.SERVICE_REQUESTS.AREA_ITEM');
  }

  async navigateToServiceRequests(): Promise<void> {
    const entity = this.repository.locator('CRM.SERVICE_REQUESTS.SITEMAP_ENTITY');
    await entity.waitFor({ state: 'visible', timeout: 30_000 });
    await entity.click();
    await this.waitForGrid();
  }

  async openFirstRecord(): Promise<void> {
    const firstRow = this.page.locator('[role="row"][aria-rowindex="2"][aria-label="Data"]');
    const requestCode = firstRow.getByText(/^REQ-/).first();
    await requestCode.waitFor({ state: 'visible', timeout: 60_000 });
    await requestCode.click();
    await this.waitForDynamicsReady();
    await this.page.keyboard.press('Enter');
    await expect(
      this.repository.locator('CRM.SERVICE_REQUESTS.RECORD_REQUEST_FIELD')
    ).toBeVisible({ timeout: 60_000 });
  }

  // ─── Assertions ─────────────────────────────────────────────────────────────

  async assertCifVisible(): Promise<void> {
    await this.assertTextAcrossFrames(/^CIF$/);
  }

  async assertRequestFieldVisible(): Promise<void> {
    await expect(
      this.repository.locator('CRM.SERVICE_REQUESTS.RECORD_REQUEST_FIELD')
    ).toBeVisible({ timeout: 30_000 });
  }

  async assertStatusReasonIsSubmitted(): Promise<void> {
    await expect(
      this.repository.locator('CRM.SERVICE_REQUESTS.STATUS_REASON_LABEL')
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      this.repository.locator('CRM.SERVICE_REQUESTS.SUBMITTED_STATUS')
    ).toBeVisible({ timeout: 30_000 });
  }

  async assertFirstRecordFields(): Promise<void> {
    await expect(
      this.repository.locator('CRM.SERVICE_REQUESTS.RECORD_REQUEST_FIELD')
    ).toBeVisible({ timeout: 60_000 });
    await this.assertCifVisible();
    await this.assertRequestFieldVisible();
    await this.assertStatusReasonIsSubmitted();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────
  // Readiness/grid waits live in BaseCrmPage — do not re-implement here.

  // D365 record forms render some field labels inside iframes. This helper
  // checks the main frame first; if the pattern is not found there it walks
  // all child frames before falling back to a failing main-frame assertion.
  private async assertTextAcrossFrames(pattern: RegExp): Promise<void> {
    const inMain = await this.page.getByText(pattern).count().catch(() => 0);
    if (inMain > 0) {
      await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 30_000 });
      return;
    }
    for (const frame of this.page.frames()) {
      if (frame === this.page.mainFrame()) continue;
      try {
        const inFrame = await frame.getByText(pattern).count().catch(() => 0);
        if (inFrame > 0) return;
      } catch {
        // Frame may have navigated away; skip it.
      }
    }
    // Let Playwright produce a clear failure message via the main frame.
    await expect(this.page.getByText(pattern)).toBeVisible({ timeout: 5_000 });
  }
}
