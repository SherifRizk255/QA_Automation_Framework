import { expect, type Page } from '@playwright/test';
import { LocatorRepository } from '../../utils/locatorRepository';

export class SmsLogsPage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  async expectActiveSmsLogsLoaded(timeout = 60_000): Promise<void> {
    await expect(this.repository.locator('CRM.SMS_LOGS.ACTIVE_HEADING')).toBeVisible({ timeout });
  }

  async openFirstRecord(): Promise<void> {
    await this.repository.locator('CRM.SMS_LOGS.FIRST_ROW_CHECKBOX').dblclick();
  }

  async expectMessageDetailsSectionVisible(timeout = 90_000): Promise<void> {
    await expect(this.repository.locator('CRM.SMS_LOGS.MESSAGE_DETAILS_SECTION')).toBeVisible({ timeout });
  }
}
