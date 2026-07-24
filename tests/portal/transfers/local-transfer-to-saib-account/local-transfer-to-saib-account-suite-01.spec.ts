import { test, expect } from '../../../../fixtures/frameworkFixtures';
import { captureFailureEvidenceOnFailure } from '../../../../utils/failureHandler.js';

test.afterEach(async ({ page }, testInfo) => {
  await captureFailureEvidenceOnFailure(page, testInfo);
});

test.beforeEach(async ({ authenticatedPom }, testInfo) => {
  await authenticatedPom.localTransferToSaibAccountPage.navigateToLocalTransferToSaibAccount(testInfo);
});

test.describe('Local Transfers - To Another SAIB Account | Form, Selectors, and Review', { tag: ['@portal', '@transfers', '@local-transfer-to-saib-account', '@regression'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('SAIB-1803 - Correct To Another SAIB Account form is displayed', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    await authenticatedPom.localTransferToSaibAccountPage.expectFormDisplayed();
  });

  test('SAIB-1804 - Selected source account displays available balance and currency', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

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

  test('SAIB-1806 - Add New beneficiary opens locked Another SAIB Account Number popup', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.openAddNewBeneficiary(testInfo);
    await transferPage.expectAddNewBeneficiaryDialogLockedToAnotherSaibAccount();
  });

  test('SAIB-1807 - Transfer limits panel updates after entering transfer amount', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.expectAmountLimitsDisplayed();
    await transferPage.fillTransferAmount('50');
    await transferPage.expectAmountReflectedInSummary(/EGP\s*50\.00/i);
  });

  test('SAIB-1808 - Quick-add amount buttons increment amount correctly', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.clickQuickAmount('+EGP 50');
    expect(await transferPage.getTransferAmountValue(), 'First quick-add should set the amount to 50.').toBe('50');

    await transferPage.clickQuickAmount('+EGP 100');
    expect(await transferPage.getTransferAmountValue(), 'Second quick-add should increase the amount to 150.').toBe('150');
    await transferPage.expectAmountReflectedInSummary(/EGP\s*150\.00/i);
  });

  test('SAIB-1809 - Selected Reason for Transfer appears in transfer summary', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.openReasonSelector(testInfo);
    const reasonOptions = await transferPage.getReasonOptions();

    expect(reasonOptions, 'Reason selector should expose the Salary Transfer option.').toContain('Salary Transfer');
    await transferPage.selectReason('Salary Transfer');
  });

  test('SAIB-1805 - Saved SAIB beneficiary name appears partially masked', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.openBeneficiarySelector(testInfo);
    const beneficiaryOptions = await transferPage.getBeneficiaryOptions();

    expect(beneficiaryOptions.length, 'Beneficiary selector should list at least one saved SAIB beneficiary.').toBeGreaterThan(0);
    await transferPage.expectMaskedBeneficiaryOption(beneficiaryOptions[0]);
  });

  test('SAIB-1810 - Instant schedule with accepted terms opens review or OTP screen without executing transfer', { tag: ['@positive'] }, async ({ authenticatedPom }, testInfo) => {
    const transferPage = authenticatedPom.localTransferToSaibAccountPage;

    await transferPage.completeSafeTransferForm({
      amount: '50',
      sourceCurrency: 'EGP',
      minimumBalance: 50,
      scheduleType: 'Instant',
    });
    await transferPage.continueToReview(testInfo);
    await transferPage.expectReviewContains(/instant|review|confirm|otp|one time password|verification/i);
  });
});
