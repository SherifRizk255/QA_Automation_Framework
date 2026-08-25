import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ENV, ROUTES } from '../../config/resources';
import { LocatorRepository } from '../../utils/locatorRepository';

export class LoginPage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  // ─── Navigation ──────────────────────────────────────────

  async goto(): Promise<void> {
    await allure.step('Navigate to the IScore Asset Portal login page', async () => {
      await this.page.goto(ROUTES.portal.login);
      await expect(this.usernameInput()).toBeVisible({ timeout: 30_000 });
    });
  }

  // ─── Actions ─────────────────────────────────────────────

  async loginWithConfiguredUser(): Promise<void> {
    await allure.step('Sign in with the configured IScore Asset Portal user', async () => {
      await this.usernameInput().fill(ENV.portal.username);
      await this.passwordInput().fill(ENV.portal.password);
      await this.submitButton().click();
      await this.page.waitForLoadState('domcontentloaded');
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertLoginFormRendered(): Promise<void> {
    await allure.step('Assert the login form is rendered', async () => {
      await expect(this.repository.locator('PORTAL.LOGIN.FORM_ROOT')).toBeVisible();
      await expect(this.usernameInput()).toBeVisible();
      await expect(this.passwordInput()).toBeVisible();
    });
  }

  async assertLoginRouteLeft(): Promise<void> {
    await allure.step('Assert the browser has left the login route', async () => {
      await expect(this.page).not.toHaveURL(/login/);
    });
  }

  async assertIscoreBrandingVisible(): Promise<void> {
    await allure.step('Assert the iScore branding is visible on the login page', async () => {
      await expect(this.repository.locator('PORTAL.LOGIN.ISCORE_LOGO')).toBeVisible({ timeout: 30_000 });
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  /**
   * True when the portal rejected the just-attempted login with
   * "Your Role Not Accessible This Portal" (verified live 2026-08-25: the
   * demo account's Finance Checker CRM role is applied and read back
   * correctly, but the portal itself refuses that role at login) — used to
   * skip a role stage gracefully instead of failing on an environment/
   * entitlement gap that automation cannot fix.
   *
   * The banner renders twice (an inline `p-messages` block AND a `p-toastitem`
   * toast, verified live) — `.first()` avoids a strict-mode violation.
   */
  async isRoleNotAccessibleErrorVisible(): Promise<boolean> {
    return this.repository.locator('PORTAL.LOGIN.ROLE_NOT_ACCESSIBLE_ERROR').first().isVisible();
  }

  // ─── Helpers (private) ──────────────────────────────────

  private usernameInput(): Locator {
    return this.repository.locator('PORTAL.LOGIN.USERNAME_INPUT');
  }

  private passwordInput(): Locator {
    return this.repository.locator('PORTAL.LOGIN.PASSWORD_INPUT');
  }

  private submitButton(): Locator {
    return this.repository.locator('PORTAL.LOGIN.SUBMIT_BUTTON');
  }
}
