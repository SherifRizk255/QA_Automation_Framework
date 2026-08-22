import { test as base } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import type { PortalRole } from '../config/resources';
import { LoginPage } from '../pages/portal-pages/LoginPage';
import { TaggingPage } from '../pages/portal-pages/tagging/TaggingPage';
import { RoleApplier } from '../utils/roles/RoleApplier';
import { RoleSwitchOrchestrator, type PortalSession } from '../utils/roles/RoleSwitchOrchestrator';

type PortalFixtures = {
  loginPage: LoginPage;
  /** Switch the active portal session to the given role; closed automatically after the test. */
  signInAs: (role: PortalRole) => Promise<PortalSession>;
  /** Pre-authenticated as Maker, already on the Tagging module. */
  makerTaggingPage: TaggingPage;
};

type PortalWorkerFixtures = {
  roleApplier: RoleApplier;
  roleSwitchOrchestrator: RoleSwitchOrchestrator;
};

export const test = base.extend<PortalFixtures, PortalWorkerFixtures>({
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

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
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
