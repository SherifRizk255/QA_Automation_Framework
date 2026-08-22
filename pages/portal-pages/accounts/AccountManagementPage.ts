import { expect, type Page, type TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { portalHashRoute, ROUTES } from '../../../config/resources.js';
import { LocatorRepository } from '../../../utils/locatorRepository.js';
import { AccountManagementApiObserver } from '../../../utils/portal/accounts/AccountManagementApiObserver.js';
import type {
  AccountSelectionApiCapture,
  AccountStatementTransaction,
} from '../../../utils/portal/accounts/accountManagementModels.js';
import {
  formatOpeningDate,
  normalizeAccountName,
  normalizeAccountText,
  normalizeBranchName,
  normalizeIban,
} from '../../../utils/portal/accounts/accountDetailsNormalization.js';
import {
  apiMoney,
  displayedMoney,
  expectedDisplayedAmount,
  normalizeDate,
  normalizeIdentity,
  normalizeText,
  parseNumber,
} from '../../../utils/portal/accounts/transactionNormalization.js';
import {
  AccountDetailsComponent,
  type AccountDetailsUi,
} from '../../components/portal/accounts/AccountDetailsComponent.js';
import {
  AccountSelectorComponent,
} from '../../components/portal/accounts/AccountSelectorComponent.js';
import {
  TransactionListComponent,
  type TransactionRowUi,
} from '../../components/portal/accounts/TransactionListComponent.js';
import { TransactionDetailsComponent } from '../../components/portal/accounts/TransactionDetailsComponent.js';
import { PortalLoadingComponent } from '../../components/portal/loading/PortalLoadingComponent.js';

export interface SelectedAccountContext {
  readonly selectedAccountIdentity: string;
  readonly api: AccountSelectionApiCapture;
}

function transactionKey(row: TransactionRowUi): string {
  return [
    normalizeText(row.reference),
    normalizeDate(row.postingDate, 'Transaction date'),
    normalizeText(row.amount),
    normalizeText(row.description),
  ].join('|');
}

function chooseTransaction(rows: readonly TransactionRowUi[]): TransactionRowUi {
  const completeRows = rows.filter((row) =>
    row.reference && row.description && row.postingDate && row.amount
  );
  if (completeRows.length === 0) {
    throw new Error('TEST_DATA: no transaction has a complete visible identity.');
  }
  const sortedRows = [...completeRows].sort((left, right) =>
    transactionKey(left).localeCompare(transactionKey(right), 'en')
  );
  if (
    sortedRows.some((row, index) =>
      index > 0 && transactionKey(row) === transactionKey(sortedRows[index - 1])
    )
  ) {
    throw new Error('TEST_DATA: visible transaction identity is duplicated.');
  }
  return sortedRows[0];
}

function findApiTransaction(
  selected: TransactionRowUi,
  transactions: readonly AccountStatementTransaction[]
): AccountStatementTransaction {
  const referenceMatches = transactions.filter(
    (transaction) => transaction.reference === normalizeText(selected.reference)
  );
  if (referenceMatches.length === 1) return referenceMatches[0];

  const uiMoney = displayedMoney(selected.amount);
  const matches = transactions.filter((transaction) => {
    const money = apiMoney(transaction);
    return transaction.reference === normalizeText(selected.reference)
      && transaction.description === normalizeText(selected.description)
      && normalizeDate(transaction.valueDate, 'API transaction date')
        === normalizeDate(selected.postingDate, 'UI transaction date')
      && money.amount === uiMoney.amount
      && money.currency === uiMoney.currency
      && money.direction === uiMoney.direction;
  });
  if (matches.length !== 1) {
    throw new Error(`APP_VALIDATION: UI transaction matched ${matches.length} API records.`);
  }
  return matches[0];
}

export class AccountManagementPage {
  private readonly repository: LocatorRepository;
  private readonly observer: AccountManagementApiObserver;
  private readonly loading: PortalLoadingComponent;

  constructor(
    private readonly page: Page,
    private readonly testInfo?: TestInfo
  ) {
    this.repository = new LocatorRepository(page);
    this.observer = new AccountManagementApiObserver(page);
    this.loading = new PortalLoadingComponent(page);
  }

  private get selector(): AccountSelectorComponent {
    return new AccountSelectorComponent(this.page, this.repository);
  }

  private get accountDetails(): AccountDetailsComponent {
    return new AccountDetailsComponent(this.repository);
  }

  private get transactions(): TransactionListComponent {
    return new TransactionListComponent(this.repository);
  }

  private get transactionDetails(): TransactionDetailsComponent {
    return new TransactionDetailsComponent(this.repository);
  }

  async verifyRealTimeAccountDetails(): Promise<void> {
    await allure.step('Open Accounts and verify real-time Account Details', async () => {
      const capture = await this.observer.captureAccountDetails(() => this.openAccounts());
      const ui = await this.accountDetails.read();
      const productName = await this.selector.getSelectedProductName();
      const api = capture.details;

      expect(normalizeIdentity(ui.accountNumber)).toBe(normalizeIdentity(api.accountNumber));
      expect(normalizeIdentity(capture.request.accountNumber)).toBe(
        normalizeIdentity(api.accountNumber)
      );
      expect(normalizeIban(ui.iban)).toBe(normalizeIban(api.iban));
      expect(normalizeIban(ui.iban)).toMatch(/^[A-Z]{2}[A-Z0-9]+$/);
      expect(normalizeAccountName(productName)).toBe(normalizeAccountName(api.productName));
      expect(normalizeAccountName(ui.accountType)).toBe(normalizeAccountName(api.accountType));
      expect(ui.currency).toBe(api.currency);
      this.expectMoney(ui.availableBalance, api.availableBalance, 'Available Balance');
      this.expectMoney(ui.actualBalance, api.actualBalance, 'Actual Balance');
      this.expectMoney(ui.holdBalance, api.holdBalance, 'Hold Balance');
      expect(ui.status).toBe(api.status);
      expect(ui.openingDate).toBe(formatOpeningDate(api.openingDate));
      expect(normalizeBranchName(ui.branchName)).toBe(normalizeBranchName(api.branchName));
      this.expectCollateral(ui, api.collateralAmount);

      await allure.attachment('account-details-api-ui-comparison', JSON.stringify({
        accountIdentity: this.mask(api.accountNumber),
        fields: {
          accountNumber: 'PASS',
          iban: 'PASS',
          productName: 'PASS',
          accountType: 'PASS',
          currency: 'PASS',
          availableBalance: 'PASS',
          actualBalance: 'PASS',
          holdBalance: 'PASS',
          status: 'PASS',
          openingDate: 'PASS',
          branch: 'PASS',
          collateralAmount: api.collateralAmount ? 'PASS' : 'NOT_APPLICABLE',
        },
      }, null, 2), 'application/json');
    });
  }

  async establishSelectedAccountContext(): Promise<SelectedAccountContext> {
    return allure.step('Phase 1 - establish and validate selected account context', async () => {
      const initialApi = await this.observer.captureAccountSelection(
        () => this.openAccounts()
      );
      await this.loading.waitForCompletion();
      const currentUi = await this.accountDetails.read();
      this.expectAccountCorrelation(currentUi.accountNumber, initialApi);

      const attempts: Array<{ account: string; transactionCount: number }> = [{
        account: this.mask(currentUi.accountNumber),
        transactionCount: initialApi.transactions.length,
      }];
      if (initialApi.transactions.length > 0) {
        await this.attachAccountSearch(attempts);
        return {
          selectedAccountIdentity: currentUi.accountNumber,
          api: initialApi,
        };
      }

      const firstOptions = await this.selector.openAndReadOptions();
      const candidateIdentities = firstOptions
        .filter((option) =>
          option.enabled
          && normalizeIdentity(option.accountIdentity)
            !== normalizeIdentity(currentUi.accountNumber)
        )
        .map((option) => option.accountIdentity)
        .sort((left, right) =>
          normalizeIdentity(left).localeCompare(normalizeIdentity(right), 'en')
        );

      for (let index = 0; index < candidateIdentities.length; index += 1) {
        const options = index === 0
          ? firstOptions
          : await this.selector.openAndReadOptions();
        const selectedAccount = options.find((option) =>
          normalizeIdentity(option.accountIdentity)
            === normalizeIdentity(candidateIdentities[index])
        );
        if (!selectedAccount) {
          throw new Error('APP_UI: account option disappeared during account iteration.');
        }

        const api = await this.observer.captureAccountSelection(
          () => this.selector.select(selectedAccount)
        );
        await this.loading.waitForCompletion();
        this.expectAccountCorrelation(selectedAccount.accountIdentity, api);
        attempts.push({
          account: this.mask(selectedAccount.accountIdentity),
          transactionCount: api.transactions.length,
        });

        if (api.transactions.length > 0) {
          await this.attachAccountSearch(attempts);
          return {
            selectedAccountIdentity: selectedAccount.accountIdentity,
            api,
          };
        }
      }

      await this.attachAccountSearch(attempts);
      throw new Error(
        `TEST_DATA: all ${attempts.length} enabled accounts returned no recent transactions.`
      );
    });
  }

  async validateTransactionDrillDown(context: SelectedAccountContext): Promise<void> {
    await allure.step('Phase 2 - validate transaction-history drill-down details', async () => {
      const rows = await this.transactions.readRows();
      if (rows.length === 0) {
        throw new Error(
          'APP_UI: accountstatement returned transactions but the UI shows no recent transaction rows.'
        );
      }
      const selectedRow = chooseTransaction(rows);
      await this.transactions.openDetails(selectedRow);
      const ui = await this.transactionDetails.read();
      const api = findApiTransaction(selectedRow, context.api.transactions);

      expect(normalizeText(ui.reference)).toBe(api.reference);
      expect(normalizeText(ui.description)).toBe(api.description);
      expect(displayedMoney(ui.amount)).toEqual(apiMoney(api));
      expect(ui.amount).toBe(expectedDisplayedAmount(api));
      expect(normalizeDate(ui.postingDate, 'Posting Date')).toBe(
        normalizeDate(api.postingDate, 'API Posting Date')
      );
      expect(normalizeDate(ui.valueDate, 'Value Date')).toBe(
        normalizeDate(api.valueDate, 'API Value Date')
      );

      if (!api.runningBalance) {
        throw new Error('APP_VALIDATION: accountstatement has no running balance.');
      }
      if (!ui.runningBalance) {
        throw new Error('APP_UI: transaction details is missing Running Balance.');
      }
      expect(parseNumber(ui.runningBalance, 'UI Running Balance')).toBe(
        parseNumber(api.runningBalance, 'API Running Balance')
      );

      if (api.partyName) {
        expect(ui.partyName).toBeDefined();
        expect(normalizeText(ui.partyName as string)).toBe(api.partyName);
      } else {
        expect(ui.partyName).toBeUndefined();
      }

      await this.testInfo?.attach('transaction-details', {
        body: await this.page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  }

  private async openAccounts(): Promise<void> {
    const navigation = this.repository.locator('PORTAL.DASHBOARD.NAV.ACCOUNTS');
    await expect(navigation).toBeVisible();
    await expect(navigation).toBeEnabled();
    await navigation.click();
    await this.loading.waitForCompletion();
    await expect(this.page).toHaveURL(
      portalHashRoute(ROUTES.portal.accounts, this.page.url())
    );
    await expect(
      this.repository.locator('PORTAL.DASHBOARD.DESTINATION.ACCOUNTS_HEADING')
    ).toBeVisible();
  }

  private expectAccountCorrelation(
    uiAccountIdentity: string,
    api: AccountSelectionApiCapture
  ): void {
    const expected = normalizeIdentity(uiAccountIdentity);
    expect(normalizeIdentity(api.details.request.accountNumber)).toBe(expected);
    expect(normalizeIdentity(api.details.details.accountNumber)).toBe(expected);
    expect(normalizeIdentity(api.statementRequest.accountNumber)).toBe(expected);
  }

  private async attachAccountSearch(
    attempts: ReadonlyArray<{ account: string; transactionCount: number }>
  ): Promise<void> {
    await allure.attachment(
      'account-iteration-results',
      JSON.stringify(attempts, null, 2),
      'application/json'
    );
  }

  private expectMoney(actual: string, expected: string, field: string): void {
    expect(parseNumber(actual, `UI ${field}`)).toBe(parseNumber(expected, `API ${field}`));
    expect(actual, `${field} must display two decimals.`).toMatch(
      /^-?\d{1,3}(?:,\d{3})*\.\d{2}$/
    );
  }

  private expectCollateral(ui: AccountDetailsUi, expected?: string): void {
    if (!expected) {
      expect(ui.collateralAmount).toBeUndefined();
      return;
    }
    expect(ui.collateralAmount).toBeDefined();
    expect(parseNumber(ui.collateralAmount as string, 'UI Collateral Amount')).toBe(
      parseNumber(expected, 'API Collateral Amount')
    );
  }

  private mask(value: string): string {
    const identity = normalizeIdentity(value);
    return identity.length <= 4 ? '****' : `****${identity.slice(-4)}`;
  }
}
