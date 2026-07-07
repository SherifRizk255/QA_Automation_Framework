import { expect, type Page } from '@playwright/test';
import { BaseCrmPage } from './BaseCrmPage';

export class SmsLogsPage extends BaseCrmPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Assertions ──────────────────────────────────────────────────────────

  async expectActiveSmsLogsLoaded(timeout = 60_000): Promise<void> {
    await expect(this.repository.locator('CRM.SMS_LOGS.ACTIVE_HEADING')).toBeVisible({ timeout });
  }

  async expectMessageDetailsSectionVisible(timeout = 90_000): Promise<void> {
    await expect(this.repository.locator('CRM.SMS_LOGS.MESSAGE_DETAILS_SECTION')).toBeVisible({ timeout });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  async openFirstRecord(): Promise<void> {
    await this.repository.locator('CRM.SMS_LOGS.FIRST_ROW_CHECKBOX').dblclick();
  }
}
