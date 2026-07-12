import { expect, type Locator, type Page } from '@playwright/test';

export class TransactionHistoryPage {
  readonly page: Page;
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionsTable: Locator;
  readonly transactionRows: Locator;
  readonly referenceHeader: Locator;
  readonly transactionDateHeader: Locator;
  readonly amountHeader: Locator;
  readonly emptyTransactionState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recentTransactionsHeading = page.getByText(/recent transactions/i).first();
    this.recentTransactionsTable = page
      .getByRole('table')
      .filter({ hasText: /Reference Number/i })
      .filter({ hasText: /Transaction Date/i })
      .filter({ hasText: /Amount/i })
      .first();
    // Real <table> markup — getAmountTexts reads tbody cells, proven by passing runs.
    this.transactionRows = this.recentTransactionsTable.locator('tbody tr').filter({ hasText: /\d|[+-]/ });
    this.referenceHeader = page.getByRole('columnheader', { name: /reference number/i });
    this.transactionDateHeader = page.getByRole('columnheader', { name: /transaction date/i });
    this.amountHeader = page.getByRole('columnheader', { name: /^amount$/i });
    this.emptyTransactionState = page.getByText(/no latest transactions found|no recent transactions found|no transactions found/i);
  }

  async expectRecentTransactionsExperienceVisible() {
    await expect(this.recentTransactionsHeading, 'Recent Transactions heading should be visible.').toBeVisible();
  }

  async isEmptyStateVisible() {
    return this.emptyTransactionState.isVisible().catch(() => false);
  }

  async expectRecentTransactionsTableVisible() {
    await expect(this.recentTransactionsTable, 'Recent Transactions table should be visible.').toBeVisible();
    await expect(this.referenceHeader, 'Reference Number column should be visible.').toBeVisible();
    await expect(this.transactionDateHeader, 'Transaction Date column should be visible.').toBeVisible();
    await expect(this.amountHeader, 'Amount column should be visible.').toBeVisible();
  }

  async expectAtLeastOneTransactionRowWhenTablePopulated() {
    const rowCount = await this.transactionRows.count();
    expect(rowCount, 'Recent Transactions should show at least one populated row for the current test user.').toBeGreaterThan(0);
  }

  async getAmountTexts() {
    return this.recentTransactionsTable
      .locator('tbody tr td:last-child')
      .evaluateAll((cells) => cells.map((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean));
  }

  hasDebitAndCredit(amounts: string[]) {
    const hasDebit = amounts.some((amount) => /^-/.test(amount) || /\bdebit\b/i.test(amount));
    const hasCredit = amounts.some((amount) => /^\+/.test(amount) || /\bcredit\b/i.test(amount));
    return { hasDebit, hasCredit };
  }
}
