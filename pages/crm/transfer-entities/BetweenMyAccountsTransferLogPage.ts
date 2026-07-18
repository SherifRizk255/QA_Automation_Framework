import { expect, type Page } from '@playwright/test';
import { BaseCrmPage } from '../../crm/BaseCrmPage';
import * as allure from 'allure-js-commons';

export class BetweenMyAccountsTransferLogPage extends BaseCrmPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async openLatestLogRecord(): Promise<void> {
    await allure.step(
      'Open latest Between My Accounts transfer log record',
      async () => {
        // Preserve refresh recovery for an initially empty or slow CRM grid.
        await expect(async () => {
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.waitForGrid(30_000);
        }).toPass({
          timeout: 120_000,
          intervals: [10_000],
        });

        const latestRecordRow = this.firstDataRow();
        await latestRecordRow.dblclick();

        await this.waitForRecordReady({
          entityName: 'Between My Accounts Transfer Log',
          expectedFormLocator: this.repository.locator(
            'CRM.BETWEEN_MY_ACCOUNTS_LOG.TRANSFER_TYPE_VALUE'
          ),
        });
      }
    );
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertStatusReasonCompleted(): Promise<void> {
    await allure.step(
      'Assert transfer log status reason is Completed',
      async () => {
        const completedStatusIndicator = this.repository.locator(
          'CRM.BETWEEN_MY_ACCOUNTS_LOG.STATUS_COMPLETED'
        );
        await expect(completedStatusIndicator).toBeVisible({
          timeout: 30_000,
        });
      }
    );
  }

  async assertTransferTypeBetweenMyAccounts(): Promise<void> {
    await allure.step(
      'Assert transfer type is Between My Accounts',
      async () => {
        const betweenMyAccountsTransferType = this.repository.locator(
          'CRM.BETWEEN_MY_ACCOUNTS_LOG.TRANSFER_TYPE_VALUE'
        );

        await expect(betweenMyAccountsTransferType).toBeVisible({
          timeout: 30_000,
        });
      }
    );
  }

  async assertLogAmount(expectedAmount: string): Promise<void> {
    await allure.step(
      `Assert transfer log amount equals "${expectedAmount}"`,
      async () => {
        const amountFieldContainer = this.repository.locator(
          'CRM_TRANSFER_RECORD.AMOUNT_FIELD'
        );

        // D365 renders lower form controls when their section enters the viewport.
        await amountFieldContainer.scrollIntoViewIfNeeded();

        const amountField = amountFieldContainer.getByRole('textbox');
        await expect(amountField).toBeVisible({
          timeout: 30_000,
        });

        const escapedExpectedAmount = expectedAmount.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );
        const optionalDecimalSuffix = expectedAmount.includes('.')
          ? ''
          : '(?:\\.00)?';

        await expect(amountField).toHaveValue(
          new RegExp(`^${escapedExpectedAmount}${optionalDecimalSuffix}$`),
          {
            timeout: 30_000,
          }
        );
      }
    );
  }

  async assertInternetBankingUser(expectedUser: string): Promise<void> {
    await allure.step(
      `Assert internet banking user is "${expectedUser}"`,
      async () => {
        // Internet Banking User is a D365 lookup field rendered as a clickable link.
        await expect(
          this.page.getByRole('link', { name: expectedUser, exact: true })
        ).toBeVisible({ timeout: 30_000 });
      }
    );
  }
}
