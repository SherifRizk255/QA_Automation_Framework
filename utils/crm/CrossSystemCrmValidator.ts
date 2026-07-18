import type { Browser, BrowserContext, Page } from '@playwright/test';
import { ENV, ROUTES } from '../../config/resources';
import { TransferLogValidator } from './validators/TransferLogValidator';

export class CrossSystemCrmValidator {
  private crmContext?: BrowserContext;
  private crmPage?: Page;
  private transferLogValidator?: TransferLogValidator;

  constructor(private readonly browser: Browser) {}

  transferLogs(): TransferLogValidator {
    if (!this.transferLogValidator) {
      this.transferLogValidator = new TransferLogValidator(async () => {
        return this.openCrmPage(ROUTES.crm.betweenMyAccountsTransferLog);
      });
    }

    return this.transferLogValidator;
  }

  async validateBetweenMyAccountsTransfer(validation: {
    amount: string;
    internetBankingUser: string;
  }): Promise<void> {
    const transferLogs = this.transferLogs();

    await transferLogs.openLatest();
    await transferLogs.validateTransferLog(validation);
  }

  async close(): Promise<void> {
    await this.crmContext?.close();
    this.crmContext = undefined;
    this.crmPage = undefined;
    this.transferLogValidator = undefined;
  }

  // Helpers

  private async openCrmPage(url: string): Promise<Page> {
    const crmPage = await this.validationPage();
    await crmPage.goto(url, { waitUntil: 'domcontentloaded' });
    return crmPage;
  }

  private async validationPage(): Promise<Page> {
    if (!this.crmPage) {
      this.crmContext = await this.browser.newContext({
        httpCredentials: {
          username: ENV.crm.username,
          password: ENV.crm.password,
          origin: ENV.crm.origin,
        },
        ignoreHTTPSErrors: true,
      });
      this.crmPage = await this.crmContext.newPage();
    }

    return this.crmPage;
  }
}
