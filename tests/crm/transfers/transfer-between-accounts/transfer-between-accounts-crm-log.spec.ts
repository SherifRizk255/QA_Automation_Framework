import 'dotenv/config';
import { test } from '../../../../fixtures/frameworkFixtures';
import * as allure from 'allure-js-commons';
import { PageObjectManager } from '../../../../pages/PageObjectManager';
import { ENV, ROUTES, TEST_DATA } from '../../../../config/resources';
import { maximizeWindow, logWindowSize } from '../../../../utils/browserWindow';

// All URLs and correlation data come from the central resource file — skill 24.
const CRM_BETWEEN_MY_ACCOUNTS_LOG_URL = ROUTES.crm.betweenMyAccountsTransferLog;
const TRANSFER_AMOUNT = TEST_DATA.transferAmount;
const PORTAL_IB_USERNAME = TEST_DATA.portalIbUsername;

test.describe('Cross-System: Portal Transfer → CRM Log Validation', { tag: ['@crm', '@portal', '@cross-system', '@transfers', '@transfer-between-accounts', '@smoke', '@critical', '@positive'] }, () => {

  test('TC-CROSS-001 | Between My Accounts transfer reflects as Completed log in CRM', async ({ pom, page, browser }) => {
    // Skill 21 — mandatory Allure metadata (money movement → blocker severity).
    await allure.feature('Between My Accounts Transfer');
    await allure.story('Cross-System Validation — Portal → CRM Log');
    await allure.severity('blocker');

    // Cross-system tests include two auth sessions plus propagation delay — skill 20.
    test.setTimeout(240_000);

    const transferPage = pom.transferBetweenOwnAccountsPage;

    // ── Portal: Login ─────────────────────────────────────────────────────
    await pom.loginPage.goto();
    // Maximize the portal window (skill 13 maximize rule — CDP is the reliable path).
    await maximizeWindow(page);
    await logWindowSize('portal', page);
    await pom.loginPage.login(
      ENV.portal.username,
      ENV.portal.password
    );
    await pom.dashboardPage.expectLoaded();

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
    // httpCredentials lets Chrome handle NTLM natively at the TCP-connection level.
    // D365 sends "Persistent-Auth: true" and no session cookie — auth is per-connection,
    // so Chrome's built-in NTLM (via httpCredentials) is the only viable approach.
    // The Node.js httpntlm route-intercept alternative was tested and causes a native
    // module crash (Windows 0xC0000409) because D365 fires 100+ parallel sub-requests
    // each requiring an independent NTLM handshake.
    const crmContext = await browser.newContext({
      viewport: null,
      httpCredentials: {
        username: ENV.crm.username,
        password: ENV.crm.password,
        origin:   ENV.crm.origin,
      },
      ignoreHTTPSErrors: true,
    });
    const crmTab = await crmContext.newPage();
    await maximizeWindow(crmTab);
    await logWindowSize('crm', crmTab);
    await crmTab.goto(CRM_BETWEEN_MY_ACCOUNTS_LOG_URL, { waitUntil: 'domcontentloaded' });

    // The CRM tab is a second context, so it gets its own page-object manager (skill 20).
    const logPage = new PageObjectManager(crmTab).betweenMyAccountsTransferLogPage;

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
