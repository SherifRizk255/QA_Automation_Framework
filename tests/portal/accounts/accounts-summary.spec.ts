import { test } from '@playwright/test';
import { ENV } from '../../../config/resources';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { AccountsSummaryPage } from '../../../pages/portal/accounts/AccountsSummaryPage.ts';
import { captureFailureEvidenceOnFailure } from '../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.describe('Accounts Management - Account Summary', () => {
  test('AM-TC-001/002/003 - Accounts summary displays linked accounts with identifiers and balances', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const accountsSummaryPage = new AccountsSummaryPage(page);

    await loginPage.goto();
    await loginPage.login(ENV.portal.username, ENV.portal.password, testInfo);
    await dashboardPage.expectLoaded(testInfo);
    await accountsSummaryPage.goto(testInfo);
    await accountsSummaryPage.expectSummaryControlsVisible();
    await accountsSummaryPage.expectVisibleAccountsHaveIdentifiersAndBalances();
    await accountsSummaryPage.expectLoadMoreIfPresent();
  });
});
