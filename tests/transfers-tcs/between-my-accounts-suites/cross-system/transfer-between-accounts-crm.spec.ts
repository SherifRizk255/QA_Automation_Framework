import 'dotenv/config';
import { test } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LoginPage } from '../../../../pages/portal-pages/LoginPage';
import { DashboardPage } from '../../../../pages/portal-pages/DashboardPage';
import { TransferBetweenOwnAccountsPage } from '../../../../pages/portal-pages/transfers/TransferBetweenOwnAccountsPage';
import { CrossSystemCrmValidator } from '../../../../utils/crm';
import { ENV, TEST_DATA } from '../../../../config/resources';

const TRANSFER_AMOUNT = TEST_DATA.transferAmount;
const PORTAL_IB_USERNAME = TEST_DATA.portalIbUsername;

test.describe('Cross-System: Portal Transfer -> CRM Log Validation', () => {

  test('TC-CROSS-001 | Between My Accounts transfer reflects as Completed log in CRM', async ({ page, browser }) => {
    await allure.feature('Between My Accounts Transfer');
    await allure.story('Cross-System Validation - Portal -> CRM Log');
    await allure.severity('blocker');

    test.setTimeout(240_000);

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const transferPage = new TransferBetweenOwnAccountsPage(page);
    const crmValidator = new CrossSystemCrmValidator(browser);

    await loginPage.goto();
    await loginPage.login(
      ENV.portal.username,
      ENV.portal.password
    );
    await dashboardPage.expectLoaded();

    await transferPage.navigateToTransferBetweenOwnAccounts();

    const fromAccountText = await transferPage.getSelectedFromAccountText();
    await transferPage.selectToAccount(fromAccountText);
    await transferPage.enterAmount(TRANSFER_AMOUNT);

    await transferPage.clickConfirm();
    await transferPage.assertSummaryFromAccount(fromAccountText);
    await transferPage.assertSummaryAmount(TRANSFER_AMOUNT);

    await transferPage.clickConfirmOnSummary();
    await transferPage.assertTransferSuccessful();

    await crmValidator
      .transferLogs()
      .openLatest()
      .expectStatusCompleted()
      .expectTransferTypeBetweenMyAccounts()
      .expectAmount(TRANSFER_AMOUNT)
      .expectInternetBankingUser(PORTAL_IB_USERNAME);
    await crmValidator.close();
  });

});
