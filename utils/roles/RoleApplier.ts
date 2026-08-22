import type { Browser } from '@playwright/test';
import { ENV, ROLES, type PortalRole } from '../../config/resources';
import { UserRolePage } from '../../pages/crm/common-crm-entities/UserRolePage';

/**
 * Applies the CRM role field once per role per worker so a same-role
 * regression suite writes the CRM record once, not per test (skill 20).
 */
export class RoleApplier {
  private readonly appliedRoles = new Set<PortalRole>();

  constructor(private readonly browser: Browser) {}

  async ensureRoleApplied(role: PortalRole): Promise<void> {
    if (this.appliedRoles.has(role)) {
      return;
    }

    const crmContext = await this.browser.newContext({
      httpCredentials: {
        username: ENV.crm.username,
        password: ENV.crm.password,
        origin: ENV.crm.origin,
      },
      ignoreHTTPSErrors: true,
    });

    const crmPage = await crmContext.newPage();
    const userRolePage = new UserRolePage(crmPage);
    const crmFieldValue = ROLES[role].crmFieldValue;

    await userRolePage.navigateToUserRecord();
    await userRolePage.setRole(crmFieldValue);
    await userRolePage.assertRoleFieldValue(crmFieldValue);

    await crmContext.close();
    this.appliedRoles.add(role);
  }
}
