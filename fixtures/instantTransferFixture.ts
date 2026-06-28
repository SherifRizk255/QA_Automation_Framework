import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/portal/DashboardPage.js';
import { InstantTransferPage } from '../pages/portal/InstantTransferPage';
import { LoginPage } from '../pages/portal/LoginPage.js';

type InstantTransferFixtures = {
  instantTransferPage: InstantTransferPage;
};

export const test = base.extend<InstantTransferFixtures>({
  instantTransferPage: async ({ page }, use, testInfo) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const instantTransferPage = new InstantTransferPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, testInfo);
    await dashboardPage.expectLoaded(testInfo);
    await instantTransferPage.navigateToInstantTransfer(testInfo);

    await use(instantTransferPage);
  },
});

export { expect } from '@playwright/test';
