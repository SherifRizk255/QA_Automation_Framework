import { test as base } from '@playwright/test';
import { ENV } from '../config/resources';
import { LoginPage } from '../pages/portal-pages/LoginPage.js';
import { DashboardPage } from '../pages/portal-pages/DashboardPage.js';
import { TransferRepositoryPage } from '../pages/portal-pages/transfers/TransferRepositoryPage.js';
import {
  DashboardApiObserver,
  type DashboardApiSnapshot,
} from '../utils/portal/DashboardApiObserver.js';

type PortalRepositoryFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  dashboardApiObserver: DashboardApiObserver;
  authenticatedDashboardPage: DashboardPage;
  dashboardApi: DashboardApiSnapshot;
  /** Logged-in portal session already on the Transfer hub. */
  authenticatedTransferPage: TransferRepositoryPage;
};

export const test = base.extend<PortalRepositoryFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use, testInfo) => {
    await use(new DashboardPage(page, testInfo));
  },

  dashboardApiObserver: async ({ page }, use) => {
    await use(new DashboardApiObserver(page));
  },

  authenticatedDashboardPage: async (
    { loginPage, dashboardPage, dashboardApiObserver },
    use,
    testInfo
  ) => {
    void dashboardApiObserver;
    await loginPage.goto();
    await loginPage.login(ENV.portal.username, ENV.portal.password, testInfo);
    await dashboardPage.assertDashboardIsLoaded();
    await use(dashboardPage);
  },

  dashboardApi: async (
    { authenticatedDashboardPage, dashboardApiObserver },
    use
  ) => {
    void authenticatedDashboardPage;
    await use(await dashboardApiObserver.getSnapshot());
  },

  authenticatedTransferPage: async ({ loginPage, dashboardPage, page }, use, testInfo) => {
    await loginPage.goto();
    await loginPage.login(ENV.portal.username, ENV.portal.password, testInfo);
    await dashboardPage.expectLoaded(testInfo);

    const transferPage = new TransferRepositoryPage(page);
    await transferPage.gotoTransferHub();
    await use(transferPage);
  },
});

export { expect } from '@playwright/test';
