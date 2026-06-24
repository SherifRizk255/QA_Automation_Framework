import { type Page, type Locator, type TestInfo, expect } from '@playwright/test';
import path from 'node:path';

export class LoginPage {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordButton: Locator;

  readonly activeSessionDialog: Locator;
  readonly activeSessionMessage: Locator;
  readonly proceedButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.usernameInput = page.getByPlaceholder(/enter your username/i);
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.getByRole('button', { name: /sign in/i });
    this.forgotPasswordButton = page.getByRole('button', { name: /forgot.*password/i });

    this.activeSessionDialog = page
      .getByRole('alertdialog')
      .filter({ hasText: /you have an active session/i })
      .last();
    this.activeSessionMessage = this.activeSessionDialog.getByText(
      /you have an active session\.?\s*do you want to close it\?/i
    );
    this.proceedButton = this.activeSessionDialog.getByRole('button', {
      name: /^(proceed|ok|yes|continue)$/i,
    });
  }

  async goto(): Promise<void> {
    const baseUrl = process.env.PORTAL_BASE_URL ?? '';
    const loginPath = process.env.PORTAL_LOGIN_PATH ?? '';
    const loginUrl = `${baseUrl}${loginPath}`;
    console.log(`[LoginPage] Navigating to: ${loginUrl}`);
    await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('body')).toBeVisible();
  }

  async expectLoginPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/login/);
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async login(
    username: string,
    password: string,
    testInfo: TestInfo | null = null
  ): Promise<boolean> {
    if (!username || !password) {
      throw new Error('PORTAL_USERNAME and PORTAL_PASSWORD must be configured in .env');
    }
    console.log('[LoginPage] Filling login form.');
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await expect(this.loginButton).toBeEnabled();
    console.log('[LoginPage] Submitting login form.');
    await this.loginButton.click();
    return this.handleActiveSessionPopupIfVisible(testInfo);
  }

  async handleActiveSessionPopupIfVisible(testInfo: TestInfo | null = null): Promise<boolean> {
    const isPopupVisible = await this.activeSessionDialog
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (isPopupVisible) {
      const screenshotPath = path.resolve('reports', 'active-session-popup.png');
      console.log('[LoginPage] Active session blocker appeared. Capturing evidence.');
      await expect(this.activeSessionMessage).toBeVisible();
      await expect(this.proceedButton).toBeVisible();
      await expect(this.proceedButton).toBeEnabled();
      await this.page.screenshot({ path: screenshotPath, fullPage: true });

      if (testInfo) {
        await testInfo.attach('active-session-popup', {
          path: screenshotPath,
          contentType: 'image/png',
        });
        testInfo.annotations.push({
          type: 'blocker',
          description: 'Active session blocker appeared and was handled.',
        });
      }
      console.log('[LoginPage] Clicking Proceed on active session blocker.');
      await this.proceedButton.click();
    } else {
      console.log('[LoginPage] Active session blocker did not appear.');
    }
    return isPopupVisible;
  }
}
