import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../../../../config/resources';
import { extractBusinessValue } from '../../../../utils/businessValueExtractor';
import { BaseCrmPage } from '../../BaseCrmPage';
import * as allure from 'allure-js-commons';

const OTP_PATTERN = /\b\d{6}\b/;

export class SmsLogsPage extends BaseCrmPage {
  constructor(page: Page) {
    super(page);
  }

  // --- Navigation -------------------------------------------------------------

  async navigateToSmsLogs(): Promise<void> {
    await allure.step('Navigate to SMS Logs entity list', async () => {
      await this.page.goto(ROUTES.crm.smsLogs, { waitUntil: 'domcontentloaded' });
      await this.waitForGrid();
    });
  }

  async openLatestLogRecord(): Promise<void> {
    await allure.step('Open latest SMS Log record', async () => {
      // The CRM SMS Logs view is expected to show the latest record as the first data row.
      await this.waitForGrid();
      const latestRecordRow = this.repository.locator('CRM.SMS_LOGS.FIRST_ROW_CHECKBOX');
      await latestRecordRow.click();
      await this.page.keyboard.press('Enter');
      await this.waitForRecordReady({
        entityName: 'SMS Log',
        expectedFormLocator: this.repository.locator('CRM.SMS_LOGS.MESSAGE_DETAILS_SECTION'),
      });
    });
  }

  // --- Actions ---------------------------------------------------------------

  async getLatestOtp(pattern: RegExp = OTP_PATTERN): Promise<string> {
    return allure.step('Get latest OTP from SMS Log Message Details', async () => {
      await this.assertMessageDetailsSectionVisible();
      return extractBusinessValue({
        source: this.messageDetailsField(),
        pattern,
        description: 'SMS Log Message Details',
      });
    });
  }

  // --- Assertions -------------------------------------------------------------

  async assertActiveSmsLogsLoaded(): Promise<void> {
    await allure.step('Assert Active SMS Logs page is loaded', async () => {
      await expect(this.repository.locator('CRM.SMS_LOGS.ACTIVE_HEADING')).toBeVisible({
        timeout: 60_000,
      });
    });
  }

  async assertMessageDetailsSectionVisible(): Promise<void> {
    await allure.step('Assert Message Details section is visible', async () => {
      await expect(this.repository.locator('CRM.SMS_LOGS.MESSAGE_DETAILS_SECTION')).toBeVisible({
        timeout: 90_000,
      });
    });
  }

  // --- Helpers ---------------------------------------------------------------
  // Readiness/grid waits live in BaseCrmPage - do not re-implement here.

  private messageDetailsField(): Locator {
    return this.repository.locator('CRM.SMS_LOGS.MESSAGE_DETAILS_VALUE');
  }
}
