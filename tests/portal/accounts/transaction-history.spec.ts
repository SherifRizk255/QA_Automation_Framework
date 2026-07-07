import { test, expect } from '@playwright/test';
import { ENV } from '../../../config/resources';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { AccountsSummaryPage } from '../../../pages/portal/accounts/AccountsSummaryPage.ts';
import { TransactionHistoryPage } from '../../../pages/portal/accounts/TransactionHistoryPage.ts';
import { handleFailureEvidence } from '../../../utils/failureHandler.js';

test.describe('Accounts Management - Transaction History', () => {
  test('AM-TC-009/010 - Recent transactions display with basic details', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const accountsSummaryPage = new AccountsSummaryPage(page);
    const transactionHistoryPage = new TransactionHistoryPage(page);

    try {
      await loginPage.goto();
      await loginPage.login(ENV.portal.username, ENV.portal.password, testInfo);
      await dashboardPage.expectLoaded(testInfo);
      await accountsSummaryPage.goto(testInfo);
      await transactionHistoryPage.expectRecentTransactionsExperienceVisible();

      if (await transactionHistoryPage.isEmptyStateVisible()) {
        testInfo.annotations.push({
          type: 'data-dependent coverage',
          description: 'No recent transactions were available for the current test user during this run.',
        });
        test.skip(true, 'No recent transactions are available for the current test user.');
      }

      await transactionHistoryPage.expectRecentTransactionsTableVisible();
      await transactionHistoryPage.expectAtLeastOneTransactionRowWhenTablePopulated();

      const amounts = await transactionHistoryPage.getAmountTexts();
      const { hasDebit, hasCredit } = transactionHistoryPage.hasDebitAndCredit(amounts);

      if (!hasDebit || !hasCredit) {
        testInfo.annotations.push({
          type: 'data-dependent coverage',
          description: 'Current account data did not expose both debit and credit amounts during this run.',
        });
      }

      expect(amounts.length, 'At least one amount should be visible without logging sensitive transaction content.').toBeGreaterThan(0);
    } catch (error) {
      if (error instanceof Error && /test is skipped|test\.skip/i.test(error.message)) {
        throw error;
      }

      await handleFailureEvidence(page, testInfo, 'AM-TC-009-transaction-history');
      throw error;
    }
  });
});
