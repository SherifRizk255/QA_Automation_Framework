import 'dotenv/config';
import { test } from '@playwright/test';
import { LoginPage } from '../../../pages/portal/LoginPage';
import { DashboardPage } from '../../../pages/portal/DashboardPage';
import { TransferBetweenOwnAccountsPage } from '../../../pages/portal/TransferBetweenOwnAccountsPage';
import { BetweenMyAccountsTransferLogPage } from '../../../pages/crm/BetweenMyAccountsTransferLogPage';

const CRM_BETWEEN_MY_ACCOUNTS_LOG_URL =
  'https://crm.cubicsystems.com/Saib/main.aspx' +
  '?appid=c6546de1-f7f5-f011-a74c-000c290f08a3' +
  '&pagetype=entitylist' +
  '&etn=cis_betweenmyaccountstransferlog' +
  '&viewid=bae3b8ea-4de3-4510-bfcb-687442f58866' +
  '&viewType=1039';

const TRANSFER_AMOUNT = '77';
const PORTAL_IB_USERNAME = 'OSerry';

// TODO(mrizk): add allure.feature/story/severity once allure-playwright is installed — skill 21

test.describe('Cross-System: Portal Transfer → CRM Log Validation', () => {

  test('TC-CROSS-001 | Between My Accounts transfer reflects as Completed log in CRM', async ({ page, browser }) => {
    // Cross-system tests include two auth sessions plus propagation delay — skill 20.
    test.setTimeout(240_000);

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const transferPage = new TransferBetweenOwnAccountsPage(page);

    // ── Portal: Login ─────────────────────────────────────────────────────
    await loginPage.goto();
    await loginPage.login(
      process.env.PORTAL_USERNAME ?? '',
      process.env.PORTAL_PASSWORD ?? ''
    );
    await dashboardPage.expectLoaded();

    // ── Portal: Navigate to Between My Accounts ───────────────────────────
    await transferPage.navigateToTransferBetweenOwnAccounts();

    // ── Portal: Read pre-populated From account (currency extraction) ──────
    const fromAccountText = await transferPage.getSelectedFromAccountText();

    // ── Portal: Select a different To Account with the same currency ───────
    await transferPage.selectToAccount(fromAccountText);

    // ── Portal: Enter amount ───────────────────────────────────────────────
    await transferPage.enterAmount(TRANSFER_AMOUNT);

    // ── Portal: First confirm → summary screen ─────────────────────────────
    await transferPage.clickConfirm();

    // ── Portal: Validate summary ───────────────────────────────────────────
    await transferPage.assertSummaryFromAccount(fromAccountText);
    await transferPage.assertSummaryAmount(TRANSFER_AMOUNT);

    // ── Portal: Final confirm → success ────────────────────────────────────
    await transferPage.clickConfirmOnSummary();
    await transferPage.assertTransferSuccessful();

    // ── CRM: Open Transfer Logs in isolated context ───────────────────────
    // Portal uses form-login cookies; CRM uses NTLM — separate contexts per Skill 20.
    // Browser-native NTLM via httpCredentials handles D365's 40+ concurrent init
    // requests efficiently; the old httpntlm route-intercept caused ECONNRESET failures.
    const crmContext = await browser.newContext({
      httpCredentials: {
        username: process.env.CRM_USERNAME!,
        password: process.env.CRM_PASSWORD!,
        origin: 'https://crm.cubicsystems.com',
      },
      ignoreHTTPSErrors: true,
    });
    const crmTab = await crmContext.newPage();
    await crmTab.goto(CRM_BETWEEN_MY_ACCOUNTS_LOG_URL, { waitUntil: 'domcontentloaded' });

    const logPage = new BetweenMyAccountsTransferLogPage(crmTab);

    // ── CRM: Open latest record, assert fields ───────────────────────────
    // The view sorts by Transaction Date descending — latest transfer is always row 2.
    // Field assertions (Status, Transfer Type, Amount) confirm it is our record.
    await logPage.openLatestLogRecord();
    await logPage.assertStatusReasonCompleted();
    await logPage.assertTransferTypeBetweenMyAccounts();
    await logPage.assertLogAmount(TRANSFER_AMOUNT);
    await logPage.assertInternetBankingUser(PORTAL_IB_USERNAME);

    await crmContext.close();
  });

});
