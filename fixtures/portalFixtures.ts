import { test as base } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import type { PortalRole } from '../config/resources';
import { AssetProfilePage } from '../pages/portal-pages/asset-profile/AssetProfilePage';
import { DisposalPage } from '../pages/portal-pages/disposal/DisposalPage';
import { LoginPage } from '../pages/portal-pages/LoginPage';
import { ReportsPage } from '../pages/portal-pages/reports/ReportsPage';
import { TaggingPage } from '../pages/portal-pages/tagging/TaggingPage';
import { RoleApplier } from '../utils/roles/RoleApplier';
import { RoleSwitchOrchestrator, type PortalSession } from '../utils/roles/RoleSwitchOrchestrator';

type PortalFixtures = {
  loginPage: LoginPage;
  /**
   * Portal-only FORM_LOGIN session (skill 19) — no CRM role write. Assumes the
   * account's CRM role is already whatever a given regression case needs;
   * use `signInAs` instead when a test must prove or change the active role.
   */
  authenticatedPortal: Page;
  /** Switch the active portal session to the given role via CRM; closed automatically after the test. */
  signInAs: (role: PortalRole) => Promise<PortalSession>;
  /** Pre-authenticated (portal-only, no CRM), already on the Tagging module. */
  makerTaggingPage: TaggingPage;
  /** Authenticated but NOT navigated — for tests that assert navigation itself (header link vs. direct route). */
  taggingPage: TaggingPage;
  /** Authenticated but NOT navigated — Asset Profile module. */
  assetProfilePage: AssetProfilePage;
  /** Pre-authenticated and already on the Asset Profile module. */
  openAssetProfilePage: AssetProfilePage;
  /** Authenticated but NOT navigated — Disposal module. */
  disposalPage: DisposalPage;
  /** Pre-authenticated and already on the Disposal module. */
  openDisposalPage: DisposalPage;
  /** Authenticated but NOT navigated — Reports module. */
  reportsPage: ReportsPage;
  /** Pre-authenticated and already on the Reports module. */
  openReportsPage: ReportsPage;
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

  authenticatedPortal: async ({ page, loginPage }, use) => {
    await loginPage.goto();
    await loginPage.loginWithConfiguredUser();
    await loginPage.assertLoginRouteLeft();
    await use(page);
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

  taggingPage: async ({ authenticatedPortal }, use, testInfo) => {
    await use(new TaggingPage(authenticatedPortal, testInfo));
  },

  assetProfilePage: async ({ authenticatedPortal }, use, testInfo) => {
    await use(new AssetProfilePage(authenticatedPortal, testInfo));
  },

  openAssetProfilePage: async ({ authenticatedPortal }, use, testInfo) => {
    const assetProfilePage = new AssetProfilePage(authenticatedPortal, testInfo);
    await assetProfilePage.openFromHeader();
    await use(assetProfilePage);
  },

  disposalPage: async ({ authenticatedPortal }, use, testInfo) => {
    await use(new DisposalPage(authenticatedPortal, testInfo));
  },

  openDisposalPage: async ({ authenticatedPortal }, use, testInfo) => {
    const disposalPage = new DisposalPage(authenticatedPortal, testInfo);
    await disposalPage.openFromHeader();
    await use(disposalPage);
  },

  reportsPage: async ({ authenticatedPortal }, use, testInfo) => {
    await use(new ReportsPage(authenticatedPortal, testInfo));
  },

  openReportsPage: async ({ authenticatedPortal }, use, testInfo) => {
    const reportsPage = new ReportsPage(authenticatedPortal, testInfo);
    await reportsPage.openFromHeader();
    await use(reportsPage);
  },

  makerTaggingPage: async ({ page, loginPage, roleApplier }, use, testInfo) => {
    // Ensures Maker regardless of which role a prior test (e.g. the Maker->Checker
    // smoke test) left the shared demo account in — see skill 19/20 role model.
    await roleApplier.ensureRoleApplied('MAKER');
    await loginPage.goto();
    await loginPage.loginWithConfiguredUser();
    await loginPage.assertLoginRouteLeft();

    const taggingPage = new TaggingPage(page, testInfo);
    await taggingPage.openFromHeader();
    await use(taggingPage);
  },
});

export { expect } from '@playwright/test';
