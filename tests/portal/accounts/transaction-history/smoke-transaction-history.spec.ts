import { test, expect } from '../../../../fixtures/frameworkFixtures';
import { captureFailureEvidenceOnFailure } from '../../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Accounts Management - Transaction History', { tag: ['@portal', '@accounts', '@transaction-history', '@smoke', '@positive'] }, () => {
  test('AM-TC-009/010 - Recent transactions display with basic details', async ({ authenticatedPom }, testInfo) => {
    const transactionHistoryPage = authenticatedPom.transactionHistoryPage;

    await authenticatedPom.accountsSummaryPage.goto(testInfo);
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
  });
});
