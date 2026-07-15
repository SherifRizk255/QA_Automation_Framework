import type { Page } from '@playwright/test';
import { BetweenMyAccountsTransferLogPage } from '../../../pages/transfers/crm/BetweenMyAccountsTransferLogPage';

type TransferLogPageFactory = () => Promise<Page>;

type TransferLogValidation = {
  amount: string;
  internetBankingUser: string;
};

export class TransferLogValidator implements PromiseLike<void> {
  private transferLogPage?: BetweenMyAccountsTransferLogPage;
  private validationSequence: Promise<void> = Promise.resolve();

  constructor(private readonly openTransferLogPage: TransferLogPageFactory) {}

  openLatest(): this {
    return this.enqueue(async () => {
      const logPage = await this.betweenMyAccountsTransferLogPage();
      await logPage.openLatestLogRecord();
    });
  }

  expectStatusCompleted(): this {
    return this.enqueue(async () => {
      const logPage = this.currentTransferLogPage();
      await logPage.assertStatusReasonCompleted();
    });
  }

  expectTransferTypeBetweenMyAccounts(): this {
    return this.enqueue(async () => {
      const logPage = this.currentTransferLogPage();
      await logPage.assertTransferTypeBetweenMyAccounts();
    });
  }

  expectAmount(expectedAmount: string): this {
    return this.enqueue(async () => {
      const logPage = this.currentTransferLogPage();
      await logPage.assertLogAmount(expectedAmount);
    });
  }

  expectInternetBankingUser(expectedUser: string): this {
    return this.enqueue(async () => {
      const logPage = this.currentTransferLogPage();
      await logPage.assertInternetBankingUser(expectedUser);
    });
  }

  validateTransferLog(validation: TransferLogValidation): this {
    return this
      .expectStatusCompleted()
      .expectTransferTypeBetweenMyAccounts()
      .expectAmount(validation.amount)
      .expectInternetBankingUser(validation.internetBankingUser);
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.validationSequence.then(onfulfilled, onrejected);
  }

  private enqueue(action: () => Promise<void>): this {
    this.validationSequence = this.validationSequence.then(action);
    return this;
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
