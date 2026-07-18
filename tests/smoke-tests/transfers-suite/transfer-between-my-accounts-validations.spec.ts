import { TEST_DATA } from '../../../config/resources';
import { test } from '../../../fixtures/betweenMyAccountsFixture';

test.describe('Portal — Between My Accounts Transfer Validations', () => {
  test.describe.configure({ timeout: 120_000 });

  // ── TC-BMA-001 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-001 | To Account picker excludes the pre-selected source account',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      const fromAccountNumber =
        await transferPage.getSelectedFromAccountNumber();

      await transferPage.openToAccountDropdown();
      await transferPage.assertToAccountExcludesSourceAccount(
        fromAccountNumber
      );
    }
  );

  // ── TC-BMA-002 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-002 | From Account entries display masked number, account type, and balance',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      await transferPage.openFromAccountDropdown();
      const fromOptions = await transferPage.getFromAccountOptions();

      await transferPage.verifyFromAccountEntriesHaveRequiredDetails(
        fromOptions
      );
    }
  );

  // ── TC-BMA-003 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-003 | To Account entries display account number, account type, and currency',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      await transferPage.openToAccountDropdown();
      const toOptions = await transferPage.getToAccountOptions();

      await transferPage.verifyToAccountEntriesHaveRequiredDetails(toOptions);
    }
  );

  // ── TC-BMA-004 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-004 | Every From Account entry is labelled with its currency',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      await transferPage.openFromAccountDropdown();
      await transferPage.assertAllFromEntriesShowCurrency();
    }
  );

  // ── TC-BMA-005 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-005 | Changing From Account to the current To selection resets the To field',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      const fromText = await transferPage.getSelectedFromAccountText();
      const selectedToNumber = await transferPage.selectToAccount(fromText);

      await transferPage.changeFromAccount(selectedToNumber);
      await transferPage.assertToAccountIsReset();
    }
  );

  // ── TC-BMA-006 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-006 | Transfer is rejected when amount exceeds the source account balance',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      const balance = await transferPage.getFromAccountBalance();
      const fromText = await transferPage.getSelectedFromAccountText();
      await transferPage.selectToAccount(fromText);
      await transferPage.enterAmount(balance + 1);

      await transferPage.attemptConfirmTransfer();
      await transferPage.assertInsufficientFundsError();
    }
  );

  // ── TC-BMA-007 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-007 | Transfer is blocked when amount is zero (below minimum EGP 1.00)',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      await transferPage.enterAmount('0');
      await transferPage.assertConfirmBlockedByMinimumAmount();
    }
  );

  // ── TC-BMA-008 ────────────────────────────────────────────────────────────

  // Skipped because the portal always preselects a source account and provides no supported way to clear it.
  test.skip(
    'TC-BMA-008 | Required-field validation fires when no source account is selected',
    async () => {}
  );

  // ── TC-BMA-009 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-009 | Negative amount is rejected by the amount input',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      await transferPage.enterAmount('-100');
      await transferPage.assertNegativeAmountRejected();
    }
  );

  // ── TC-BMA-011 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-011 | INSTANT schedule selection renders no extra date, time, or frequency fields',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      await transferPage.selectInstantSchedule();
      await transferPage.assertInstantScheduleShowsNoExtraFields();
    }
  );

  // ── TC-BMA-012 ────────────────────────────────────────────────────────────

  test(
    'TC-BMA-012 | Cancelling the transfer navigates back without committing a transaction',
    async ({ transferBetweenOwnAccountsPage: transferPage }) => {
      const fromText = await transferPage.getSelectedFromAccountText();
      await transferPage.selectToAccount(fromText);
      await transferPage.enterAmount('50');

      await transferPage.clickCancelTransfer();
      await transferPage.assertNavigatedBackFromTransfer();
    }
  );

  // ── TC-BMA-010 ── RUNS LAST — drains source account balance to zero ────────

  test.describe(() => {
    test.describe.configure({
      retries: 0,
    });

    test(
      'TC-BMA-010 / TC-CROSS-001 | Transfer of exact available balance succeeds and drains source to zero',
      async ({
        transferBetweenOwnAccountsPage: transferPage,
        crossSystemCrmValidator,
      }) => {
        test.setTimeout(240_000);

        const balanceBefore = await transferPage.getFromAccountBalance();
        const transferAmount = balanceBefore.toFixed(2);
        const fromText = await transferPage.getSelectedFromAccountText();

        await transferPage.selectToAccount(fromText);
        await transferPage.enterAmount(transferAmount);

        await transferPage.clickConfirm();
        await transferPage.assertSummaryAmount(transferAmount);
        await transferPage.clickConfirmOnSummary();
        await transferPage.assertTransferSuccessful();

        await crossSystemCrmValidator.validateBetweenMyAccountsTransfer({
          amount: transferAmount,
          internetBankingUser: TEST_DATA.portalIbUsername,
        });
      }
    );
  });
});
