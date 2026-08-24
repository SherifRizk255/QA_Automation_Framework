import { expect, type Page } from '@playwright/test';
import { CVM } from '../../../config/resources';

/**
 * CVM Kiosk Portal — Desk Login screen.
 * A single desk operator signs in once per run; the same kiosk window is then
 * reused for every simulated customer (docs/analysis/cvm-kiosk-walkthrough.md).
 */
export class KioskLoginPage {
  constructor(private readonly page: Page) {}

  private get usernameInput() {
    return this.page.locator('form input').first();
  }
  private get passwordInput() {
    return this.page.locator('input[type="password"]');
  }
  private get signInButton() {
    return this.page.getByRole('button', { name: /sign in/i });
  }

  async goto(): Promise<void> {
    await this.page.goto(CVM.kioskUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: /desk login/i })).toBeVisible();
  }

  /** Sign in and wait until the customer language screen is shown. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await expect(this.page.getByRole('heading', { name: /select your language/i })).toBeVisible({
      timeout: 30_000,
    });
  }
}
