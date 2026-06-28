import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';
import { InstantTransferPage } from '../../../pages/portal/InstantTransferPage';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { instantTransferBlockedCases, instantTransferTestData } from '../../../data/portal/instantTransferTestData';
import { handleFailureEvidence } from '../../../utils/failureHandler.js';

async function loginAndOpenInstantTransfer(page, testInfo) {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const instantTransferPage = new InstantTransferPage(page);

  await loginPage.goto();
  await loginPage.login(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, testInfo);
  await dashboardPage.expectLoaded(testInfo);
  await instantTransferPage.navigateToInstantTransfer(testInfo);

  return instantTransferPage;
}

test.describe('Local Transfers - Instant Transfer', () => {
  test.describe.configure({ timeout: 120000 });

  test('SAIB-2184 - Instant Transfer page displays all transfer method tiles', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.expectMethodTilesDisplayed();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2184-instant-transfer-method-tiles');
      throw error;
    }
  });

  test('SAIB-2185 - Selecting a transfer method resets the beneficiary identifier field', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.expectMethodSelectionClearsBeneficiary('Mobile Number', 'Card Number');
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2185-instant-transfer-method-switch-clears-beneficiary');
      throw error;
    }
  });

  test('SAIB-2186 - Mobile beneficiary entries do not appear after switching to Card Number', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.expectMobileBeneficiaryNotVisibleAfterSwitchToCard(testInfo);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2186-instant-transfer-beneficiary-method-filter');
      throw error;
    }
  });

  test('SAIB-2187 - Switching between transfer methods clears entered beneficiary identifier', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.expectMethodSelectionClearsBeneficiary('Payment Address', 'Wallet');
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2187-instant-transfer-any-method-switch-clears-beneficiary');
      throw error;
    }
  });

  test('SAIB-2188 - Instant Transfer enforces EGP-only currency controls', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.expectEgpOnlyCurrency();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2188-instant-transfer-egp-only');
      throw error;
    }
  });

  test('SAIB-2190 - Add Beneficiary popup locks beneficiary type to Instant Transfer', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Mobile Number', testInfo);
      await instantTransferPage.expectAddBeneficiaryLockedToInstantTransfer();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2190-instant-transfer-add-beneficiary-type');
      throw error;
    }
  });

  test('SAIB-2191 - Add Beneficiary popup reflects the active transfer method', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Card Number', testInfo);
      await instantTransferPage.expectAddBeneficiaryMethod('Card Number');
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2191-instant-transfer-add-beneficiary-active-method');
      throw error;
    }
  });

  test('SAIB-2192 - Nickname is mandatory in Add Beneficiary popup', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Mobile Number', testInfo);
      await instantTransferPage.expectNicknameRequired();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2192-instant-transfer-nickname-required');
      throw error;
    }
  });

  test('SAIB-2198 - Cancel closes Add Beneficiary popup without changing transfer form', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Mobile Number', testInfo);
      await instantTransferPage.cancelAddBeneficiary();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2198-instant-transfer-cancel-add-beneficiary');
      throw error;
    }
  });

  test('SAIB-2203 - Invalid mobile number format is blocked', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Mobile Number', testInfo);
      await instantTransferPage.expectInvalidMobileFormat(instantTransferTestData.mobile.invalidNonNumeric);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2203-instant-transfer-invalid-mobile-format');
      throw error;
    }
  });

  test('SAIB-2206 - Mobile Number Add Beneficiary telephone field is mandatory', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Mobile Number', testInfo);
      await instantTransferPage.expectMethodFieldRequired('Mobile Number');
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2206-instant-transfer-phone-required');
      throw error;
    }
  });

  test('SAIB-2207 - Card number fewer than 16 digits is rejected', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Card Number', testInfo);
      await instantTransferPage.expectCardNumberValidation(instantTransferTestData.card.fewerThan16Digits);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2207-instant-transfer-short-card-number');
      throw error;
    }
  });

  test('SAIB-2208 - Card number input enforces 16 digit maximum length', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Card Number', testInfo);
      await instantTransferPage.expectCardNumberValidation(instantTransferTestData.card.moreThan16Digits, /^\d{0,16}$/);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2208-instant-transfer-card-max-length');
      throw error;
    }
  });

  test('SAIB-2209 - Card number field accepts numeric input only', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Card Number', testInfo);
      await instantTransferPage.expectCardNumberValidation(instantTransferTestData.card.nonNumeric, /^\d*$/);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2209-instant-transfer-card-numeric-only');
      throw error;
    }
  });

  test('SAIB-2211 - Bank Account method exposes mandatory account number and bank name fields', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Bank Account', testInfo);
      await instantTransferPage.expectBankAccountFieldsRequired();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2211-instant-transfer-bank-account-required-fields');
      throw error;
    }
  });

  test('SAIB-2212 - Payment Address field accepts uppercase alphanumeric IBAN up to 35 characters', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIbanFieldVisibleAndMaxLength(instantTransferTestData.iban.validUppercaseMax35);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2212-instant-transfer-iban-uppercase-max');
      throw error;
    }
  });

  test('SAIB-2213 - IBAN exceeding 35 characters is truncated or blocked', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIbanFieldVisibleAndMaxLength(instantTransferTestData.iban.moreThan35Characters);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2213-instant-transfer-iban-max-length');
      throw error;
    }
  });

  test('SAIB-2214 - Lowercase IBAN is rejected', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIbanValidation(instantTransferTestData.iban.lowercase);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2214-instant-transfer-lowercase-iban');
      throw error;
    }
  });

  test('SAIB-2215 - IBAN with spaces or hyphens is rejected', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIbanValidation(instantTransferTestData.iban.specialCharacters);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2215-instant-transfer-iban-special-characters');
      throw error;
    }
  });

  test('SAIB-2216 - Bank Account number enforces 35 digit maximum length', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Bank Account', testInfo);
      await instantTransferPage.expectBankAccountMaxLength(instantTransferTestData.bankAccount.moreThan35Digits);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2216-instant-transfer-bank-account-max-length');
      throw error;
    }
  });

  test('SAIB-2217 - Bank name is mandatory for Bank Account method', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Bank Account', testInfo);
      await instantTransferPage.expectBankAccountFieldsRequired();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2217-instant-transfer-bank-name-required');
      throw error;
    }
  });

  test('SAIB-2218 - Bank Account and IBAN beneficiary lists are isolated by sub-method', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.expectMethodSelectionClearsBeneficiary('Bank Account', 'Payment Address');
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2218-instant-transfer-bank-iban-list-isolation');
      throw error;
    }
  });

  test('SAIB-2220 - IPA prefix shorter than five characters is rejected', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIpaValidation(instantTransferTestData.ipa.prefixTooShort, /ipa prefix.*least 5|payment address|invalid/i);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2220-instant-transfer-short-ipa-prefix');
      throw error;
    }
  });

  test('SAIB-2221 - IPA prefix longer than 25 characters is rejected', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIpaValidation(instantTransferTestData.ipa.prefixTooLong, /ipa prefix.*25|not exceed 25|payment address|invalid/i);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2221-instant-transfer-long-ipa-prefix');
      throw error;
    }
  });

  test('SAIB-2222 - IPA total length is capped at 30 characters', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIpaValidation(instantTransferTestData.ipa.totalTooLong, /30 characters|payment address|invalid/i);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2222-instant-transfer-ipa-total-length');
      throw error;
    }
  });

  test('SAIB-2223 - IPA input stores or validates case-insensitively', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIpaValidation(instantTransferTestData.ipa.mixedCase, /payment address|ipa|invalid|lowercase/i);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2223-instant-transfer-ipa-case-handling');
      throw error;
    }
  });

  test('SAIB-2225 - IPA with unsupported characters is rejected', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectIpaValidation(instantTransferTestData.ipa.unsupportedCharacters, /unsupported characters|payment address|invalid/i);
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2225-instant-transfer-ipa-unsupported-characters');
      throw error;
    }
  });

  test('SAIB-2229 - Blank Payment Address is mandatory', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Payment Address', testInfo);
      await instantTransferPage.expectMethodFieldRequired('Payment Address');
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2229-instant-transfer-payment-address-required');
      throw error;
    }
  });

  test('SAIB-2232 - Blank Wallet number is mandatory', async ({ page }, testInfo) => {
    try {
      const instantTransferPage = await loginAndOpenInstantTransfer(page, testInfo);

      await instantTransferPage.openAddBeneficiaryForMethod('Wallet', testInfo);
      await instantTransferPage.expectWalletRequired();
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'SAIB-2232-instant-transfer-wallet-required');
      throw error;
    }
  });

  for (const blockedCase of instantTransferBlockedCases) {
    test(`${blockedCase.id} - blocked by OTP, transaction posting, API tampering, or unavailable controlled IPN data`, async () => {
      test.skip(true, blockedCase.reason);
      expect(blockedCase.reason).not.toEqual('');
    });
  }
});
