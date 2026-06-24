import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/portal/LoginPage.js';
import { DashboardPage } from '../pages/portal/DashboardPage.js';
import { TransferRepositoryPage } from '../pages/portal/TransferRepositoryPage';

type PortalRepositoryFixtures = {
  authenticatedTransferPage: TransferRepositoryPage;
};

export const test = base.extend<PortalRepositoryFixtures>({
  authenticatedTransferPage: async ({ page }, use, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, testInfo);
    await dashboardPage.expectLoaded(testInfo);

    const transferPage = new TransferRepositoryPage(page);
    await transferPage.gotoTransferHub();
    await use(transferPage);
  },
});

export { expect } from '@playwright/test';
