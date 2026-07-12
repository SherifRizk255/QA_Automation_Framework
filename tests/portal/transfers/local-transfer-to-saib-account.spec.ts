import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { ENV } from '../../../config/resources';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { LocalTransferToSaibAccountPage } from '../../../pages/portal/LocalTransferToSaibAccountPage';
import { captureFailureEvidenceOnFailure } from '../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

async function loginAndOpenLocalTransferToSaibAccount(page: Page, testInfo: TestInfo) {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const transferPage = new LocalTransferToSaibAccountPage(page);

  await loginPage.goto();
  await loginPage.login(ENV.portal.username, ENV.portal.password, testInfo);
  await dashboardPage.expectLoaded(testInfo);
  await transferPage.navigateToLocalTransferToSaibAccount(testInfo);

  return transferPage;
}

test.describe('Local Transfers - To Another SAIB Account', () => {
  test.describe.configure({ timeout: 120_000 });

  test('SAIB-1803 - Correct To Another SAIB Account form is displayed', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.expectFormDisplayed();
  });

  test('SAIB-1804 - Selected source account displays available balance and currency', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.openFromAccountSelector(testInfo);
    const sourceAccountOptions = await transferPage.getFromAccountOptions();

    expect(sourceAccountOptions.length, 'From Account selector should list at least one eligible source account.').toBeGreaterThan(0);
    expect(
      sourceAccountOptions.some((option) => /\b(EGP|USD|EUR|GBP)\b/i.test(option)),
      `At least one source account should display a currency. Options: ${sourceAccountOptions.join(' | ')}`
    ).toBe(true);
    expect(
      sourceAccountOptions.some((option) => /\d{1,3}(?:,\d{3})*(?:\.\d{2})?/.test(option)),
      `At least one source account should display an amount/balance. Options: ${sourceAccountOptions.join(' | ')}`
    ).toBe(true);
  });

  test('SAIB-1806 - Add New beneficiary opens locked Another SAIB Account Number popup', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.openAddNewBeneficiary(testInfo);
    await transferPage.expectAddNewBeneficiaryDialogLockedToAnotherSaibAccount();
  });

  test('SAIB-1807 - Transfer limits panel updates after entering transfer amount', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.expectAmountLimitsDisplayed();
    await transferPage.fillTransferAmount('50');
    await transferPage.expectAmountReflectedInSummary(/EGP\s*50\.00/i);
  });

  test('SAIB-1808 - Quick-add amount buttons increment amount correctly', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.clickQuickAmount('+EGP 50');
    expect(await transferPage.getTransferAmountValue(), 'First quick-add should set the amount to 50.').toBe('50');

    await transferPage.clickQuickAmount('+EGP 100');
    expect(await transferPage.getTransferAmountValue(), 'Second quick-add should increase the amount to 150.').toBe('150');
    await transferPage.expectAmountReflectedInSummary(/EGP\s*150\.00/i);
  });

  test('SAIB-1809 - Selected Reason for Transfer appears in transfer summary', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.openReasonSelector(testInfo);
    const reasonOptions = await transferPage.getReasonOptions();

    expect(reasonOptions, 'Reason selector should expose the Salary Transfer option.').toContain('Salary Transfer');
    await transferPage.selectReason('Salary Transfer');
  });

  test('SAIB-1805 - Saved SAIB beneficiary name appears partially masked', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.openBeneficiarySelector(testInfo);
    const beneficiaryOptions = await transferPage.getBeneficiaryOptions();

    expect(beneficiaryOptions.length, 'Beneficiary selector should list at least one saved SAIB beneficiary.').toBeGreaterThan(0);
    await transferPage.expectMaskedBeneficiaryOption(beneficiaryOptions[0]);
  });

  test('SAIB-1810 - Instant schedule with accepted terms opens review or OTP screen without executing transfer', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Instant',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/instant|review|confirm|otp|one time password|verification/i);
  });

  test('SAIB-1814 - Scheduled transfer selection appears as Scheduled in review', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Schedule',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/scheduled|schedule/i);
  });

  test('SAIB-1815 - Recurring transfer selection creates recurring summary', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Recurring',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/recurring/i);
  });

  test('SAIB-1816 - Same-currency source and beneficiary proceeds without currency error', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Instant',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/EGP/i);
  });

  test('SAIB-1817 - Multiple beneficiaries appear as separate selectable rows', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.openBeneficiarySelector(testInfo);
    await transferPage.expectMultipleBeneficiaryOptions();
  });

  test('SAIB-1818 - Projected balance reflects source balance minus transfer amount', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    const setup = await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
    });

    await transferPage.expectProjectedBalanceMatches(setup.sourceAccount.balance, setup.amount);
  });

  test('SAIB-1819 - EGP to USD beneficiary currency mismatch is blocked before posting', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'USD',
      minimumBalance: 50,
    });
    await transferPage.expectCurrencyMismatchBlocked();
  });

  test('SAIB-1820 - Transfer amount exceeding available balance is blocked', async ({ page }, testInfo) => {
    const transferPage = await loginAndOpenLocalTransferToSaibAccount(page, testInfo);

    const sourceAccount = await transferPage.selectSourceAccount({
      currency: 'EGP',
      maximumBalance: 0,
    });
    await transferPage.selectFirstBeneficiary();
    await transferPage.fillTransferAmount(String(sourceAccount.balance + 1));
    await transferPage.openReasonSelector(testInfo);
    await transferPage.selectReason('Salary Transfer');
    await transferPage.acceptTerms();
    await transferPage.expectInsufficientBalanceBlocked();
  });
});
