import type { Browser } from '@playwright/test';
import { ENV, ROLES, type AssetPortalRole } from '../../config/resources';
import { AssetUserRolePage } from '../../pages/crm/asset-management/AssetUserRolePage';

/**
 * Applies the CRM role field once per role per worker so a same-role
 * regression suite writes the CRM record once, not per test (skill 20).
 */
export class RoleApplier {
  private readonly appliedRoles = new Set<AssetPortalRole>();

  constructor(private readonly browser: Browser) {}

  async ensureRoleApplied(role: AssetPortalRole): Promise<void> {
    if (this.appliedRoles.has(role)) {
      return;
    }

    const crmContext = await this.browser.newContext({
      httpCredentials: {
        username: ENV.assetCrm.username,
        password: ENV.assetCrm.password,
        origin: ENV.assetCrm.origin,
      },
      ignoreHTTPSErrors: true,
    });

    const crmPage = await crmContext.newPage();
    const userRolePage = new AssetUserRolePage(crmPage);
    const crmFieldValue = ROLES[role].crmFieldValue;

    await userRolePage.navigateToUserRecord();
    await userRolePage.setRole(crmFieldValue);
    await userRolePage.assertRoleFieldValue(crmFieldValue);

    await crmContext.close();
    this.appliedRoles.add(role);
  }
}
