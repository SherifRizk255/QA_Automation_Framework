import { test } from '../../../../fixtures/frameworkFixtures';
import { captureFailureEvidenceOnFailure } from '../../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Accounts Management - Account Summary', { tag: ['@portal', '@accounts', '@accounts-summary', '@smoke', '@positive'] }, () => {
  test('AM-TC-001/002/003 - Accounts summary displays linked accounts with identifiers and balances', async ({ authenticatedPom }, testInfo) => {
    await authenticatedPom.accountsSummaryPage.goto(testInfo);
    await authenticatedPom.accountsSummaryPage.expectSummaryControlsVisible();
    await authenticatedPom.accountsSummaryPage.expectVisibleAccountsHaveIdentifiersAndBalances();
    await authenticatedPom.accountsSummaryPage.expectLoadMoreIfPresent();
  });
});
