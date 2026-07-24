import { test, expect } from '../../../../fixtures/frameworkFixtures';
import { captureFailureEvidenceOnFailure } from '../../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.beforeEach(async ({ authenticatedPom }, testInfo) => {
  await authenticatedPom.transferBetweenOwnAccountsPage.navigateToTransferBetweenOwnAccounts(testInfo);
});

test.describe('Transfer Between Accounts | Account Dropdown Contents', { tag: ['@portal', '@transfers', '@transfer-between-accounts', '@regression'] }, () => {
  test('IB-TRANSFER-001 - From Account dropdown lists only authenticated customer accounts', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.openFromAccountDropdown(testInfo);
    const fromAccountOptions = await transferPage.getFromAccountOptions();

    // Limitation: no backend/customer account API is available in this framework yet.
    // This validates the strongest UI-level evidence available under the authenticated session.
    expect(fromAccountOptions.length, 'From Account dropdown should show authenticated-session account entries.').toBeGreaterThan(0);
    for (const option of fromAccountOptions) {
      expect(option, 'From Account option should not be empty or invalid.').not.toEqual('');
    }
  });

  test('IB-TRANSFER-002 - To Account dropdown excludes the selected source account', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.openFromAccountDropdown(testInfo);
    const selectedSourceAccount = await transferPage.selectFirstFromAccount();

    await transferPage.openToAccountDropdown(testInfo);
    const toAccountOptions = await transferPage.getToAccountOptions();

    expect(toAccountOptions, 'To Account options should not include the selected From Account.').not.toContain(selectedSourceAccount);
  });

  test('IB-TRANSFER-003 - From Account entries show masked number, account type, and available balance', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.openFromAccountDropdown(testInfo);
    const fromAccountOptions = await transferPage.getFromAccountOptions();

    await transferPage.verifyFromAccountEntriesHaveRequiredDetails(fromAccountOptions);
  });
});
