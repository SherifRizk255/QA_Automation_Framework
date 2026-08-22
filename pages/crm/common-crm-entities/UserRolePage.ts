import { expect, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ROUTES } from '../../../config/resources';
import { BaseCrmPage } from '../BaseCrmPage';

/**
 * The `cis_users` CRM record whose Role field drives which of the three
 * portal roles (Maker, Checker, Finance Checker) is active for the account
 * on next portal login. See docs/projects/iscore-asset-management/project-profile.md.
 */
export class UserRolePage extends BaseCrmPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ──────────────────────────────────────────

  async navigateToUserRecord(): Promise<void> {
    await allure.step('Navigate to the IScore Asset Management user record', async () => {
      await this.page.goto(ROUTES.crm.userRecord, { waitUntil: 'domcontentloaded' });
      await this.waitForRecordReady({
        entityName: 'cis_users',
        expectedFormLocator: this.repository.locator('CRM.USERS.ROLE_FIELD'),
      });
    });
  }

  // ─── Actions ─────────────────────────────────────────────

  async setRole(crmFieldValue: string): Promise<void> {
    await allure.step(`Set the user's role field to "${crmFieldValue}"`, async () => {
      await this.repository.locator('CRM.USERS.ROLE_FIELD').fill(crmFieldValue);
      await this.repository.locator('CRM.USERS.SAVE_BUTTON').click();
      await this.waitForDynamicsReady();
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertRoleFieldValue(expectedCrmFieldValue: string): Promise<void> {
    await allure.step(`Assert the role field reads "${expectedCrmFieldValue}"`, async () => {
      await expect(this.repository.locator('CRM.USERS.ROLE_FIELD')).toHaveValue(expectedCrmFieldValue);
    });
  }
}
