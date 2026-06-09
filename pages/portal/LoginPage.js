import { expect } from '@playwright/test';
import path from 'node:path';

export class LoginPage {
  constructor(page) {
    this.page = page;

    this.usernameInput = page
      .getByLabel(/user\s*name|username|user id|customer id/i)
      .or(page.getByPlaceholder(/user\s*name|username|user id|customer id/i))
      .or(page.locator('input[type="text"], input[name*="user" i], input[id*="user" i]').first());
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.getByRole('button', { name: /login|sign in/i });

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

  async goto() {
    const baseUrl = process.env.PORTAL_BASE_URL ?? '';
    const loginPath = process.env.PORTAL_LOGIN_PATH ?? '';
    const loginUrl = `${baseUrl}${loginPath}`;

    console.log(`[LoginPage] Navigating to portal login page: ${loginUrl}`);
    await this.page.goto(loginUrl);
    await expect(this.page.locator('body')).toBeVisible();
  }

  async expectLoginPageLoaded() {
    await expect(this.page).toHaveURL(/login/);
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async login(username, password, testInfo) {
    if (!username || !password) {
      throw new Error('PORTAL_USERNAME and PORTAL_PASSWORD must be configured in .env');
    }

    console.log('[LoginPage] Filling login form with .env credentials.');
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await expect(this.loginButton).toBeEnabled();
    console.log('[LoginPage] Submitting login form.');
    await this.loginButton.click();

    return this.handleActiveSessionPopupIfVisible(testInfo);
  }

  async handleActiveSessionPopupIfVisible(testInfo) {
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
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      if (testInfo) {
        await testInfo.attach('active-session-popup', {
          path: screenshotPath,
          contentType: 'image/png',
        });
      }

      console.log('[LoginPage] Clicking Proceed/confirmation button on active session blocker.');
      await this.proceedButton.click();
    } else {
      console.log('[LoginPage] Active session blocker did not appear.');
    }

    return isPopupVisible;
  }
}
