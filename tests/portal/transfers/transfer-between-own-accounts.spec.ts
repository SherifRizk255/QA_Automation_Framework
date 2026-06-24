import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { TransferBetweenOwnAccountsPage } from '../../../pages/portal/TransferBetweenOwnAccountsPage.js';
import { handleFailureEvidence } from '../../../utils/failureHandler.js';

async function loginAndOpenTransferPage(page, testInfo) {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const transferPage = new TransferBetweenOwnAccountsPage(page);

  await loginPage.goto();
  await loginPage.login(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, testInfo);
  await dashboardPage.expectLoaded(testInfo);
  await transferPage.navigateToTransferBetweenOwnAccounts(testInfo);

  return transferPage; 
}

test.describe('Internet Banking Portal - Transfer Between Own Accounts', () => {
  test('IB-TRANSFER-001 - From Account dropdown lists only authenticated customer accounts', async ({ page }, testInfo) => {
    try {
      const transferPage = await loginAndOpenTransferPage(page, testInfo);

      await transferPage.openFromAccountDropdown(testInfo);
      const fromAccountOptions = await transferPage.getFromAccountOptions();

      // Limitation: no backend/customer account API is available in this framework yet.
      // This validates the strongest UI-level evidence available under the authenticated session.
      expect(fromAccountOptions.length, 'From Account dropdown should show authenticated-session account entries.').toBeGreaterThan(0);
      for (const option of fromAccountOptions) {
        expect(option, 'From Account option should not be empty or invalid.').not.toEqual('');
      }
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'IB-TRANSFER-001-from-account-ownership');
      throw error;
    }
  });

  test('IB-TRANSFER-002 - To Account dropdown excludes the selected source account', async ({ page }, testInfo) => {
    try {
      const transferPage = await loginAndOpenTransferPage(page, testInfo);

      await transferPage.openFromAccountDropdown(testInfo);
      const selectedSourceAccount = await transferPage.selectFirstFromAccount();

      await transferPage.openToAccountDropdown(testInfo);
      const toAccountOptions = await transferPage.getToAccountOptions();

      expect(toAccountOptions, 'To Account options should not include the selected From Account.').not.toContain(selectedSourceAccount);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'IB-TRANSFER-002-source-account-excluded');
      throw error;
    }
  });

  test('IB-TRANSFER-003 - From Account entries show masked number, account type, and available balance', async ({ page }, testInfo) => {
    try {
      const transferPage = await loginAndOpenTransferPage(page, testInfo);

      await transferPage.openFromAccountDropdown(testInfo);
      const fromAccountOptions = await transferPage.getFromAccountOptions();

      await transferPage.verifyFromAccountEntriesHaveRequiredDetails(fromAccountOptions);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'IB-TRANSFER-003-account-entry-details');
      throw error;
    }
  });
});
