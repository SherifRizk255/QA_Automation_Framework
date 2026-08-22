import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { ROLES, type AssetPortalRole } from '../../config/resources';
import { AssetPortalLoginPage } from '../../pages/portal-pages/asset-management/AssetPortalLoginPage';
import { PortalShellPage } from '../../pages/portal-pages/asset-management/PortalShellPage';
import { RoleApplier } from './RoleApplier';

export type AssetPortalSession = {
  context: BrowserContext;
  page: Page;
};

/**
 * Orchestrates a role switch: apply the target role on CRM, then produce a
 * fresh portal session already logged in as that role, with the active role
 * read back from the portal shell to confirm the switch took effect.
 *
 * The fresh browser context IS the session clear — portal and CRM never
 * share a storage-state file, and no two roles ever share a portal context
 * (skill 19 absolute rule).
 */
export class RoleSwitchOrchestrator {
  constructor(
    private readonly browser: Browser,
    private readonly roleApplier: RoleApplier
  ) {}

  async signInAs(role: AssetPortalRole): Promise<AssetPortalSession> {
    await this.roleApplier.ensureRoleApplied(role);

    const context = await this.browser.newContext();
    const page = await context.newPage();

    const loginPage = new AssetPortalLoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithConfiguredUser();
    await loginPage.assertLoginRouteLeft();

    const shell = new PortalShellPage(page);
    await shell.waitForPortalReady();
    const activeRoleLabel = await shell.readActiveRoleLabel();
    const expectedRoleLabel = ROLES[role].crmFieldValue;

    expect(
      activeRoleLabel,
      `Portal active role should read back as "${expectedRoleLabel}" after switching to ${role}`
    ).toBe(expectedRoleLabel);

    return { context, page };
  }
}
