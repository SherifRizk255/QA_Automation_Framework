import { test as base } from '@playwright/test';
import { ENV } from '../config/resources';
import { PageObjectManager } from '../pages/PageObjectManager';
import type { TransferRepositoryPage } from '../pages/portal/TransferRepositoryPage';

type FrameworkFixtures = {
  /** One controlled access point to all page objects for the default page (GUIDELINES §8). */
  pom: PageObjectManager;
  /** Portal session: logged in with the env credentials and dashboard loaded. */
  authenticatedPom: PageObjectManager;
  /** Logged-in portal session already on the Transfer hub. */
  authenticatedTransferPage: TransferRepositoryPage;
};

export const test = base.extend<FrameworkFixtures>({
  pom: async ({ page }, use) => {
    await use(new PageObjectManager(page));
  },

  authenticatedPom: async ({ pom }, use, testInfo) => {
    await pom.loginPage.goto();
    await pom.loginPage.login(ENV.portal.username, ENV.portal.password, testInfo);
    await pom.dashboardPage.expectLoaded(testInfo);
    await use(pom);
  },

  authenticatedTransferPage: async ({ authenticatedPom }, use) => {
    await authenticatedPom.transferRepositoryPage.gotoTransferHub();
    await use(authenticatedPom.transferRepositoryPage);
  },
});

export { expect } from '@playwright/test';
