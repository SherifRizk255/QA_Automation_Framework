import { test, expect } from '../../../../fixtures/frameworkFixtures';
import { captureFailureEvidenceOnFailure } from '../../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.beforeEach(async ({ authenticatedPom }, testInfo) => {
  await authenticatedPom.localTransferToSaibAccountPage.navigateToLocalTransferToSaibAccount(testInfo);
});

test.describe('Local Transfers - To Another SAIB Account | Schedules, Balances, and Currency Rules', { tag: ['@portal', '@transfers', '@local-transfer-to-saib-account', '@regression'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('SAIB-1814 - Scheduled transfer selection appears as Scheduled in review', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Schedule',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/scheduled|schedule/i);
  });

  test('SAIB-1815 - Recurring transfer selection creates recurring summary', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Recurring',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/recurring/i);
  });

  test('SAIB-1816 - Same-currency source and beneficiary proceeds without currency error', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Instant',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/EGP/i);
  });

  test('SAIB-1817 - Multiple beneficiaries appear as separate selectable rows', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.openBeneficiarySelector(testInfo);
    await transferPage.expectMultipleBeneficiaryOptions();
  });

  test('SAIB-1818 - Projected balance reflects source balance minus transfer amount', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    const setup = await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
    });

    await transferPage.expectProjectedBalanceMatches(setup.sourceAccount.balance, setup.amount);
  });

  test('SAIB-1819 - EGP to USD beneficiary currency mismatch is blocked before posting', { tag: ['@negative'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'USD',
      minimumBalance: 50,
    });
    await transferPage.expectCurrencyMismatchBlocked();
  });

  test('SAIB-1820 - Transfer amount exceeding available balance is blocked', { tag: ['@negative'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

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
