import { test as base } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import type { AssetPortalRole } from '../config/resources';
import { AssetPortalLoginPage } from '../pages/portal-pages/asset-management/AssetPortalLoginPage';
import { TaggingPage } from '../pages/portal-pages/asset-management/TaggingPage';
import { RoleApplier } from '../utils/asset-management/RoleApplier';
import { RoleSwitchOrchestrator, type AssetPortalSession } from '../utils/asset-management/RoleSwitchOrchestrator';

type AssetManagementFixtures = {
  assetLoginPage: AssetPortalLoginPage;
  /** Switch the active portal session to the given role; closed automatically after the test. */
  signInAs: (role: AssetPortalRole) => Promise<AssetPortalSession>;
  /** Pre-authenticated as Maker, already on the Tagging module. */
  makerTaggingPage: TaggingPage;
};

type AssetManagementWorkerFixtures = {
  roleApplier: RoleApplier;
  roleSwitchOrchestrator: RoleSwitchOrchestrator;
};

export const test = base.extend<AssetManagementFixtures, AssetManagementWorkerFixtures>({
  roleApplier: [
    async ({ browser }, use) => {
      await use(new RoleApplier(browser));
    },
    { scope: 'worker' },
  ],

  roleSwitchOrchestrator: [
    async ({ browser, roleApplier }, use) => {
      await use(new RoleSwitchOrchestrator(browser, roleApplier));
    },
    { scope: 'worker' },
  ],

  assetLoginPage: async ({ page }, use) => {
    await use(new AssetPortalLoginPage(page));
  },

  signInAs: async ({ roleSwitchOrchestrator }, use) => {
    const openedContexts: BrowserContext[] = [];

    await use(async (role) => {
      const session = await roleSwitchOrchestrator.signInAs(role);
      openedContexts.push(session.context);
      return session;
    });

    for (const context of openedContexts) {
      await context.close();
    }
  },

  makerTaggingPage: async ({ signInAs }, use, testInfo) => {
    const { page } = await signInAs('MAKER');
    const taggingPage = new TaggingPage(page, testInfo);
    await taggingPage.openFromHeader();
    await use(taggingPage);
  },
});

export { expect } from '@playwright/test';
