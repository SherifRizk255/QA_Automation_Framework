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

test.describe('Transfer Between Accounts | Schedule, Cancel, and Exact-Balance Transfer', { tag: ['@portal', '@transfers', '@transfer-between-accounts', '@regression', '@validation'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  // ── TC-BMA-011 ────────────────────────────────────────────────────────────

  test('TC-BMA-011 | INSTANT schedule selection renders no extra date, time, or frequency fields', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    await transferPage.selectInstantSchedule();
    await transferPage.assertInstantScheduleShowsNoExtraFields();
  });

  // ── TC-BMA-012 ────────────────────────────────────────────────────────────

  test('TC-BMA-012 | Cancelling the transfer navigates back without committing a transaction', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

    const fromText = await transferPage.getSelectedFromAccountText();
    await transferPage.selectToAccount(fromText);
    await transferPage.enterAmount('50');

    await transferPage.clickCancelTransfer();
    await transferPage.assertNavigatedBackFromTransfer();
  });

  // ── TC-BMA-010 ── RUNS LAST — drains source account balance to zero ────────

  test('TC-BMA-010 | Transfer of exact available balance succeeds and drains source to zero', { tag: ['@positive'] }, async ({ authenticatedPom }) => {
    // This test runs last (final test of the final suite file) because it drains
    // the source account to zero. All other tests requiring a positive balance
    // must complete before this one.
    const transferPage = authenticatedPom.transferBetweenOwnAccountsPage;

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
