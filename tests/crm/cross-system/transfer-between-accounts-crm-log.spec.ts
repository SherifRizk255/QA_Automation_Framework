import 'dotenv/config';
import { test } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LoginPage } from '../../../pages/portal/LoginPage';
import { DashboardPage } from '../../../pages/portal/DashboardPage';
import { TransferBetweenOwnAccountsPage } from '../../../pages/portal/TransferBetweenOwnAccountsPage';
import { BetweenMyAccountsTransferLogPage } from '../../../pages/crm/BetweenMyAccountsTransferLogPage';
import { ENV, ROUTES, TEST_DATA } from '../../../config/resources';
import { maximizeWindow, logWindowSize } from '../../../utils/browserWindow';

// All URLs and correlation data come from the central resource file — skill 24.
const CRM_BETWEEN_MY_ACCOUNTS_LOG_URL = ROUTES.crm.betweenMyAccountsTransferLog;
const TRANSFER_AMOUNT = TEST_DATA.transferAmount;
const PORTAL_IB_USERNAME = TEST_DATA.portalIbUsername;

test.describe('Cross-System: Portal Transfer → CRM Log Validation', () => {

  test('TC-CROSS-001 | Between My Accounts transfer reflects as Completed log in CRM', async ({ page, browser }) => {
    // Skill 21 — mandatory Allure metadata (money movement → blocker severity).
    await allure.feature('Between My Accounts Transfer');
    await allure.story('Cross-System Validation — Portal → CRM Log');
    await allure.severity('blocker');

    // Cross-system tests include two auth sessions plus propagation delay — skill 20.
    test.setTimeout(240_000);

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const transferPage = new TransferBetweenOwnAccountsPage(page);

    // ── Portal: Login ─────────────────────────────────────────────────────
    await loginPage.goto();
    // Maximize the portal window (skill 13 maximize rule — CDP is the reliable path).
    await maximizeWindow(page);
    await logWindowSize('portal', page);
    await loginPage.login(
      ENV.portal.username,
      ENV.portal.password
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
    // viewport: null makes this second window fill the maximized frame — without it
    // the context would clamp to Playwright's 1280×720 default (skill 13 maximize rule).
    const crmContext = await browser.newContext({
      viewport: null,
      httpCredentials: {
        username: ENV.crm.username,
        password: ENV.crm.password,
        origin: ENV.crm.origin,
      },
      ignoreHTTPSErrors: true,
    });
    const crmTab = await crmContext.newPage();
    // Maximize the second (CRM) window — newContext windows never receive
    // --start-maximized, so CDP is required here (skill 13 maximize rule).
    // Log before goto: window dimensions are already valid on the blank page,
    // so the maximize is proven even if the CRM host is transiently unreachable.
    await maximizeWindow(crmTab);
    await logWindowSize('crm', crmTab);
    await crmTab.goto(CRM_BETWEEN_MY_ACCOUNTS_LOG_URL, { waitUntil: 'domcontentloaded' });

    const logPage = new BetweenMyAccountsTransferLogPage(crmTab);

    // ── CRM: Open latest record, assert fields ───────────────────────────
    // The view sorts by Transaction Date descending — latest transfer is always row 2.
    // Field assertions (Status, Transfer Type, Amount, User Name) confirm it is our record.
    await logPage.openLatestLogRecord();
    await logPage.assertStatusReasonCompleted();
    await logPage.assertTransferTypeBetweenMyAccounts();
    await logPage.assertLogAmount(TRANSFER_AMOUNT);
    await logPage.assertInternetBankingUser(PORTAL_IB_USERNAME);

    await crmContext.close();
  });

});
