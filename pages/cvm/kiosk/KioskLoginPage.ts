import { expect, type Page } from '@playwright/test';
import { CVM } from '../../../config/resources';

/**
 * KFH CVM Kiosk Portal — desk login ("New" UI: "Welcome to KFH CVM").
 * A single desk operator signs in once per run; the kiosk then auto-returns to
 * the language screen after each ticket (docs/analysis/kfh-kiosk-walkthrough.md).
 */
export class KioskLoginPage {
  constructor(private readonly page: Page) {}

  private get usernameInput() {
    return this.page.getByPlaceholder('User Name');
  }
  private get passwordInput() {
    return this.page.locator('input[type="password"]');
  }
  private get loginButton() {
    return this.page.getByRole('button', { name: /login/i });
  }

  async goto(): Promise<void> {
    await this.page.goto(CVM.kioskUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.usernameInput).toBeVisible({ timeout: 30_000 });
  }

  /** Sign in and wait until the customer language screen is shown. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await expect(this.page.getByText('Please Select Language')).toBeVisible({ timeout: 30_000 });
  }
}
