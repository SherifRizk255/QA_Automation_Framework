import 'dotenv/config';
import { ENV } from '../../../config/resources';
import { test, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LoginPage } from '../../../pages/portal/LoginPage';
import { DashboardPage } from '../../../pages/portal/DashboardPage';
import { TransferBetweenOwnAccountsPage } from '../../../pages/portal/TransferBetweenOwnAccountsPage';

// Skill 21 — mandatory Allure metadata for every test in this suite.
test.beforeEach(async () => {
  await allure.feature('Between My Accounts Transfer');
  await allure.story('Transfer Validations');
  await allure.severity('critical');
});

async function loginAndNavigateToBMA(page: Page): Promise<TransferBetweenOwnAccountsPage> {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const transferPage = new TransferBetweenOwnAccountsPage(page);
  await loginPage.goto();
  await loginPage.login(ENV.portal.username, ENV.portal.password);
  await dashboardPage.expectLoaded();
  await transferPage.navigateToTransferBetweenOwnAccounts();
  return transferPage;
}

test.describe('Portal — Between My Accounts Transfer Validations', () => {
  test.describe.configure({ timeout: 120_000 });

  // ── TC-BMA-001 ────────────────────────────────────────────────────────────

  test('TC-BMA-001 | To Account picker excludes the pre-selected source account', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);
    const fromAccountNumber = await transferPage.getSelectedFromAccountNumber();

    await transferPage.openToAccountDropdown();
    await transferPage.assertToAccountExcludesSourceAccount(fromAccountNumber);
  });

  // ── TC-BMA-002 ────────────────────────────────────────────────────────────

  test('TC-BMA-002 | From Account entries display masked number, account type, and balance', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    await transferPage.openFromAccountDropdown();
    const fromOptions = await transferPage.getFromAccountOptions();

    await transferPage.verifyFromAccountEntriesHaveRequiredDetails(fromOptions);
  });

  // ── TC-BMA-003 ────────────────────────────────────────────────────────────

  test('TC-BMA-003 | To Account entries display account number, account type, and currency', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    await transferPage.openToAccountDropdown();
    const toOptions = await transferPage.getToAccountOptions();

    await transferPage.verifyToAccountEntriesHaveRequiredDetails(toOptions);
  });

  // ── TC-BMA-004 ────────────────────────────────────────────────────────────

  test('TC-BMA-004 | Every From Account entry is labelled with its currency', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    await transferPage.openFromAccountDropdown();
    const foundCurrencies = await transferPage.assertAllFromEntriesShowCurrency();

    // Report which currencies are present for this test user.
    console.log(`[TC-BMA-004] Currencies present in From Account dropdown: ${foundCurrencies.join(', ')}`);
  });

  // ── TC-BMA-005 ────────────────────────────────────────────────────────────

  test('TC-BMA-005 | Changing From Account to the current To selection resets the To field', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    const fromText = await transferPage.getSelectedFromAccountText();
    const selectedToNumber = await transferPage.selectToAccount(fromText);

    await transferPage.changeFromAccount(selectedToNumber);
    await transferPage.assertToAccountIsReset();
  });

  // ── TC-BMA-006 ────────────────────────────────────────────────────────────

  test('TC-BMA-006 | Transfer is rejected when amount exceeds the source account balance', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    const balance = await transferPage.getFromAccountBalance();
    const fromText = await transferPage.getSelectedFromAccountText();
    await transferPage.selectToAccount(fromText);
    await transferPage.enterAmount(balance + 1);

    await transferPage.attemptConfirmTransfer();
    await transferPage.assertInsufficientFundsError();
  });

  // ── TC-BMA-007 ────────────────────────────────────────────────────────────

  test('TC-BMA-007 | Transfer is blocked when amount is zero (below minimum EGP 1.00)', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    await transferPage.enterAmount('0');
    await transferPage.assertConfirmBlockedByMinimumAmount();
  });

  // ── TC-BMA-008 ────────────────────────────────────────────────────────────

  test('TC-BMA-008 | Required-field validation fires when no source account is selected', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    // The portal pre-selects the first account as From on load.
    // Attempt to deselect it: open the From picker then dismiss with Escape.
    await transferPage.openFromAccountDropdown();
    await page.keyboard.press('Escape');

    // With no valid From selection, attempting to confirm must trigger a validation error.
    await transferPage.attemptConfirmTransfer();
    await transferPage.assertFromAccountRequiredError();
  });

  // ── TC-BMA-009 ────────────────────────────────────────────────────────────

  test('TC-BMA-009 | Negative amount is rejected by the amount input', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    await transferPage.enterAmount('-100');
    await transferPage.assertNegativeAmountRejected();
  });

  // ── TC-BMA-011 ────────────────────────────────────────────────────────────

  test('TC-BMA-011 | INSTANT schedule selection renders no extra date, time, or frequency fields', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    await transferPage.selectInstantSchedule();
    await transferPage.assertInstantScheduleShowsNoExtraFields();
  });

  // ── TC-BMA-012 ────────────────────────────────────────────────────────────

  test('TC-BMA-012 | Cancelling the transfer navigates back without committing a transaction', async ({ page }) => {
    const transferPage = await loginAndNavigateToBMA(page);

    const fromText = await transferPage.getSelectedFromAccountText();
    await transferPage.selectToAccount(fromText);
    await transferPage.enterAmount('50');

    await transferPage.clickCancelTransfer();
    await transferPage.assertNavigatedBackFromTransfer();
  });

  // ── TC-BMA-010 ── RUNS LAST — drains source account balance to zero ────────

  test('TC-BMA-010 | Transfer of exact available balance succeeds and drains source to zero', async ({ page }) => {
    // This test runs last because it drains the source account to zero.
    // All other tests requiring a positive balance must complete before this one.
    const transferPage = await loginAndNavigateToBMA(page);

    const balanceBefore = await transferPage.getFromAccountBalance();
    const fromText = await transferPage.getSelectedFromAccountText();
    const fromAccountNumber = await transferPage.getSelectedFromAccountNumber();

    console.log(`[TC-BMA-010] Starting balance: EGP ${balanceBefore.toLocaleString('en-EG', { minimumFractionDigits: 2 })} on account ${fromAccountNumber}`);

    await transferPage.selectToAccount(fromText);
    await transferPage.enterAmount(balanceBefore);

    await transferPage.clickConfirm();
    await transferPage.assertSummaryAmount(String(balanceBefore));
    await transferPage.clickConfirmOnSummary();
    await transferPage.assertTransferSuccessful();

    console.log(`[TC-BMA-010] Transfer of EGP ${balanceBefore.toLocaleString('en-EG', { minimumFractionDigits: 2 })} from ${fromAccountNumber} completed. Source balance expected: EGP 0.00`);
  });
});
