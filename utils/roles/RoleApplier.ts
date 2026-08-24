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

  /**
   * `force` bypasses the once-per-worker cache — needed by suites that
   * deliberately switch the shared account's role away and back again
   * (e.g. a Maker->Checker lifecycle test resetting to Maker in teardown).
   */
  async ensureRoleApplied(role: PortalRole, options?: { force?: boolean }): Promise<void> {
    if (!options?.force && this.appliedRoles.has(role)) {
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
    // Only one role can be active on the shared CRM record at a time, so a
    // fresh apply supersedes whatever the cache previously believed was active.
    this.appliedRoles.clear();
    this.appliedRoles.add(role);
  }
}
