import { test } from '@playwright/test';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { AccountsSummaryPage } from '../../../pages/portal/accounts/AccountsSummaryPage.ts';
import { AccountDetailsPage } from '../../../pages/portal/accounts/AccountDetailsPage.ts';
import { AccountStatementsPage } from '../../../pages/portal/accounts/AccountStatementsPage.ts';
import { handleFailureEvidence } from '../../../utils/failureHandler.js';

test.describe('Accounts Management - Account Statements', () => {
  test('AM-TC-013/014/015/016 - Account statements are opened from first account details', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const accountsSummaryPage = new AccountsSummaryPage(page);
    const accountDetailsPage = new AccountDetailsPage(page);
    const accountStatementsPage = new AccountStatementsPage(page);

    try {
      await loginPage.goto();
      await loginPage.login(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, testInfo);
      await dashboardPage.expectLoaded(testInfo);
      await accountsSummaryPage.goto(testInfo);
      await accountsSummaryPage.openFirstAccountDetails();
      await accountDetailsPage.openStatements();
      await accountStatementsPage.assertLoaded();
      await accountStatementsPage.validateFiltersIfAvailable(testInfo);
      await accountStatementsPage.validateDownloadIfAvailable(testInfo);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'AM-TC-013-account-statements');
      throw error;
    }
  });
});
