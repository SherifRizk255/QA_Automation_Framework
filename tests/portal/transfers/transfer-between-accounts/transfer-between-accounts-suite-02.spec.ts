import { test } from '../../../../fixtures/frameworkFixtures';
import * as allure from 'allure-js-commons';

// Skill 21 — mandatory Allure metadata for every test in this suite.
test.beforeEach(async () => {
  await allure.feature('Between My Accounts Transfer');
  await allure.story('Transfer Validations');
  await allure.severity('critical');
});

test.beforeEach(async ({ authenticatedPom }) => {
  await authenticatedPom.transferBetweenOwnAccountsPage.navigateToTransferBetweenOwnAccounts();
});

test.describe('Transfer Between Accounts | Account Pickers and Amount Validations', { tag: ['@portal', '@transfers', '@transfer-between-accounts', '@regression', '@validation'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  // ── TC-BMA-001 ────────────────────────────────────────────────────────────

  test('TC-BMA-001 | To Account picker excludes the pre-selected source account', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;
    const fromAccountNumber = await transferPage.getSelectedFromAccountNumber();

    await transferPage.openToAccountDropdown();
    await transferPage.assertToAccountExcludesSourceAccount(fromAccountNumber);
  });

  // ── TC-BMA-002 ────────────────────────────────────────────────────────────

  test('TC-BMA-002 | From Account entries display masked number, account type, and balance', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.openFromAccountDropdown();
    const fromOptions = await transferPage.getFromAccountOptions();

    await transferPage.verifyFromAccountEntriesHaveRequiredDetails(fromOptions);
  });

  // ── TC-BMA-003 ────────────────────────────────────────────────────────────

  test('TC-BMA-003 | To Account entries display account number, account type, and currency', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.openToAccountDropdown();
    const toOptions = await transferPage.getToAccountOptions();

    await transferPage.verifyToAccountEntriesHaveRequiredDetails(toOptions);
  });

  // ── TC-BMA-004 ────────────────────────────────────────────────────────────

  test('TC-BMA-004 | Every From Account entry is labelled with its currency', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.openFromAccountDropdown();
    const foundCurrencies = await transferPage.assertAllFromEntriesShowCurrency();

    // Report which currencies are present for this test user.
    console.log(`[TC-BMA-004] Currencies present in From Account dropdown: ${foundCurrencies.join(', ')}`);
  });

  // ── TC-BMA-005 ────────────────────────────────────────────────────────────

  test('TC-BMA-005 | Changing From Account to the current To selection resets the To field', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    const fromText = await transferPage.getSelectedFromAccountText();
    const selectedToNumber = await transferPage.selectToAccount(fromText);

    await transferPage.changeFromAccount(selectedToNumber);
    await transferPage.assertToAccountIsReset();
  });

  // ── TC-BMA-006 ────────────────────────────────────────────────────────────

  test('TC-BMA-006 | Transfer is rejected when amount exceeds the source account balance', { tag: ['@negative'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    const balance = await transferPage.getFromAccountBalance();
    const fromText = await transferPage.getSelectedFromAccountText();
    await transferPage.selectToAccount(fromText);
    await transferPage.enterAmount(balance + 1);

    await transferPage.attemptConfirmTransfer();
    await transferPage.assertInsufficientFundsError();
  });

  // ── TC-BMA-007 ────────────────────────────────────────────────────────────

  test('TC-BMA-007 | Transfer is blocked when amount is zero (below minimum EGP 1.00)', { tag: ['@negative'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.enterAmount('0');
    await transferPage.assertConfirmBlockedByMinimumAmount();
  });

  // ── TC-BMA-008 ────────────────────────────────────────────────────────────

  test('TC-BMA-008 | Required-field validation fires when no source account is selected', { tag: ['@negative'] }, async ({ authenticatedPom, page }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    // The portal pre-selects the first account as From on load.
    // Attempt to deselect it: open the From picker then dismiss with Escape.
    await transferPage.openFromAccountDropdown();
    await page.keyboard.press('Escape');

    // With no valid From selection, attempting to confirm must trigger a validation error.
    await transferPage.attemptConfirmTransfer();
    await transferPage.assertFromAccountRequiredError();
  });

  // ── TC-BMA-009 ────────────────────────────────────────────────────────────

  test('TC-BMA-009 | Negative amount is rejected by the amount input', { tag: ['@negative'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.enterAmount('-100');
    await transferPage.assertNegativeAmountRejected();
  });
});
