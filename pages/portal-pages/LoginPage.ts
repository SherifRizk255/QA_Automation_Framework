import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { ENV } from '../../config/resources.ts';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly blockingOverlay: Locator;
  readonly activeSessionDialog: Locator;
  readonly genericAlertDialog: Locator;
  readonly activeSessionMessage: Locator;
  readonly proceedButton: Locator;
  readonly genericDialogProceedButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.usernameInput = page
      .getByLabel(/user\s*name|username|user id|customer id/i)
      .or(page.getByPlaceholder(/user\s*name|username|user id|customer id/i))
      .or(page.locator('input[type="text"], input[name*="user" i], input[id*="user" i]').first());
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.getByRole('button', { name: 'Sign In', exact: true })
      .or(page.locator('button.login-submit-button'))
      .or(page.locator('button.ds-auth-confirm-button'));
    this.blockingOverlay = page.locator('.p-blockui, .p-overlay-mask');

    this.activeSessionDialog = page
      .getByRole('alertdialog')
      .or(page.getByRole('dialog'))
      .filter({ hasText: /you have an active session/i })
      .last();
    this.genericAlertDialog = page
      .getByRole('alertdialog')
      .or(page.getByRole('dialog'))
      .last();
    this.activeSessionMessage = this.activeSessionDialog.getByText(
      /you have an active session\.?\s*do you want to close it\?/i
    );
    this.proceedButton = this.activeSessionDialog.getByRole('button', {
      name: /^(proceed|ok|yes|continue)$/i,
    });
    this.genericDialogProceedButton = this.genericAlertDialog.getByRole('button', {
      name: /^(proceed|ok|yes|continue)$/i,
    });
  }

  async goto(): Promise<void> {
    // Central resource file resolves PORTAL_LOGIN_URL or base + path — skill 24.
    const loginUrl = ENV.portal.loginUrl;

    if (!loginUrl) {
      throw new Error('PORTAL_LOGIN_URL or PORTAL_BASE_URL/PORTAL_LOGIN_PATH must be configured in .env');
    }

    console.log(`[LoginPage] Navigating to portal login page: ${loginUrl}`);
    await this.page.goto(loginUrl);
    const loginFormVisible = await this.usernameInput
      .isVisible({ timeout: 30000 })
      .catch(() => false);

    if (!loginFormVisible) {
      console.log('[LoginPage] Login form did not render after navigation. Reloading once.');
      await this.page.reload();
    }

    await expect(this.usernameInput).toBeVisible({ timeout: 30000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 30000 });
  }

  async expectLoginPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/login/);
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async login(username: string | undefined, password: string | undefined, testInfo?: TestInfo): Promise<boolean> {
    if (!username || !password) {
      throw new Error('PORTAL_USERNAME and PORTAL_PASSWORD must be configured in .env');
    }

    console.log('[LoginPage] Filling login form with .env credentials.');
    const overlayClearedBeforeFill = await this.waitForBlockingOverlayToClear({ throwOnFailure: false });
    if (!overlayClearedBeforeFill) {
      await this.handleActiveSessionPopupIfVisible(testInfo);
      await this.waitForBlockingOverlayToClear({ throwOnFailure: false });
    }
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    const overlayClearedAfterFill = await this.waitForBlockingOverlayToClear({ throwOnFailure: false });

    if (!overlayClearedAfterFill) {
      console.log('[LoginPage] Blocking overlay remained visible after filling credentials. Reloading login page once.');
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await expect(this.usernameInput).toBeVisible({ timeout: 30000 });
      await expect(this.passwordInput).toBeVisible({ timeout: 30000 });
      const overlayClearedAfterReload = await this.waitForBlockingOverlayToClear({ throwOnFailure: false });
      if (!overlayClearedAfterReload) {
        await this.handleActiveSessionPopupIfVisible(testInfo);
        await this.waitForBlockingOverlayToClear({ throwOnFailure: false });
      }
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
    }

    await expect(this.loginButton).toBeEnabled();
    console.log('[LoginPage] Submitting login form.');
    await this.loginButton.click();

    return this.handleActiveSessionPopupIfVisible(testInfo);
  }

  async attemptLogin(username: string | undefined, password: string | undefined): Promise<boolean> {
    console.log('[LoginPage] Attempting login form submission.');
    await this.usernameInput.fill(username ?? '');
    await this.passwordInput.fill(password ?? '');

    const isLoginButtonEnabled = await this.loginButton.isEnabled();
    if (isLoginButtonEnabled) {
      await this.loginButton.click();
    } else {
      console.log('[LoginPage] Login button is disabled; submission is blocked by the UI.');
    }

    return isLoginButtonEnabled;
  }

  async expectUsernameRequiredValidation(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.page).toHaveURL(/login/);
  }

  async expectCredentialsRequiredValidation(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.page).toHaveURL(/login/);
  }

  async handleActiveSessionPopupIfVisible(testInfo?: TestInfo): Promise<boolean> {
    const isStrictPopupVisible = await this.activeSessionDialog
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    const isGenericProceedDialogVisible = !isStrictPopupVisible
      ? await this.genericDialogProceedButton
          .waitFor({ state: 'visible', timeout: 5000 })
          .then(() => true)
          .catch(() => false)
      : false;
    const isPopupVisible = isStrictPopupVisible || isGenericProceedDialogVisible;

    if (isPopupVisible) {
      const screenshotPath = path.resolve('reports', 'active-session-popup.png');
      const proceedButton = isStrictPopupVisible ? this.proceedButton : this.genericDialogProceedButton;

      console.log('[LoginPage] Active session blocker appeared. Capturing evidence.');
      if (isStrictPopupVisible) {
        await expect(this.activeSessionMessage).toBeVisible();
      }
      await expect(proceedButton).toBeVisible();
      await expect(proceedButton).toBeEnabled();
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
      await proceedButton.click();
      await expect(this.page.locator('.p-dialog-mask')).toBeHidden({ timeout: 30000 }).catch(() => {
        console.log('[LoginPage] Active session dialog mask remained attached after Proceed; continuing with downstream actionability waits.');
      });
    } else {
      console.log('[LoginPage] Active session blocker did not appear.');
    }

    return isPopupVisible;
  }

  async waitForBlockingOverlayToClear(options: { throwOnFailure: boolean } = { throwOnFailure: true }): Promise<boolean> {
    const isHidden = await expect(this.blockingOverlay)
      .toBeHidden({ timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (!isHidden && options.throwOnFailure) {
      await expect(this.blockingOverlay).toBeHidden({ timeout: 30000 });
    }

    return isHidden;
  }
}
