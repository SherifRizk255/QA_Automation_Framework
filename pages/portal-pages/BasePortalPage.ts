import { expect, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../utils/locatorRepository';

/**
 * Base class for the IScore Asset Management portal shell.
 *
 * Owns readiness/role-read/logout mechanics shared by every authenticated
 * portal page so feature pages never duplicate them (skill 23).
 */
export abstract class BasePortalPage {
  protected readonly repository: LocatorRepository;

  protected constructor(protected readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  async waitForPortalReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async readActiveRoleLabel(): Promise<string> {
    return allure.step('Read the active role label from the portal shell', async () => {
      const roleLabel = this.repository.locator('PORTAL.SHELL.ACTIVE_ROLE_LABEL');
      await expect(roleLabel).toBeVisible({ timeout: 30_000 });
      return (await roleLabel.textContent())?.trim() ?? '';
    });
  }

  async logout(): Promise<void> {
    await allure.step('Sign out of the IScore Asset Management portal', async () => {
      await this.repository.locator('PORTAL.SHELL.LOGOUT_BUTTON').click();
      await expect(this.page).toHaveURL(/login/, { timeout: 30_000 });
    });
  }
}
