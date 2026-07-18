import type { Page } from '@playwright/test';
import { BetweenMyAccountsTransferLogPage } from '../../../pages/crm/transfer-entities/BetweenMyAccountsTransferLogPage';

type TransferLogPageFactory = () => Promise<Page>;

type TransferLogValidation = {
  amount: string;
  internetBankingUser: string;
};

export class TransferLogValidator {
  private transferLogPage?: BetweenMyAccountsTransferLogPage;

  constructor(private readonly openTransferLogPage: TransferLogPageFactory) {}

  async openLatest(): Promise<void> {
    const logPage = await this.betweenMyAccountsTransferLogPage();
    await logPage.openLatestLogRecord();
  }

  async expectStatusCompleted(): Promise<void> {
    const logPage = this.currentTransferLogPage();
    await logPage.assertStatusReasonCompleted();
  }

  async expectTransferTypeBetweenMyAccounts(): Promise<void> {
    const logPage = this.currentTransferLogPage();
    await logPage.assertTransferTypeBetweenMyAccounts();
  }

  async expectAmount(expectedAmount: string): Promise<void> {
    const logPage = this.currentTransferLogPage();
    await logPage.assertLogAmount(expectedAmount);
  }

  async expectInternetBankingUser(expectedUser: string): Promise<void> {
    const logPage = this.currentTransferLogPage();
    await logPage.assertInternetBankingUser(expectedUser);
  }

  async validateTransferLog(validation: TransferLogValidation): Promise<void> {
    await this.expectStatusCompleted();
    await this.expectTransferTypeBetweenMyAccounts();
    await this.expectAmount(validation.amount);
    await this.expectInternetBankingUser(validation.internetBankingUser);
  }

  private async betweenMyAccountsTransferLogPage(): Promise<BetweenMyAccountsTransferLogPage> {
    if (!this.transferLogPage) {
      const crmPage = await this.openTransferLogPage();
      this.transferLogPage = new BetweenMyAccountsTransferLogPage(crmPage);
    }

    return this.transferLogPage;
  }

  private currentTransferLogPage(): BetweenMyAccountsTransferLogPage {
    if (!this.transferLogPage) {
      throw new Error('Open latest transfer log before validating CRM transfer fields.');
    }

    return this.transferLogPage;
  }
}
