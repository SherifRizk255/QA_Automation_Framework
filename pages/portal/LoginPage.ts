import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { ENV } from '../../config/resources';
import { LocatorRepository } from '../../utils/locatorRepository';

export class LoginPage {
  readonly page: Page;
  private readonly repository: LocatorRepository;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly blockingOverlay: Locator;
  readonly activeSessionDialog: Locator;
  readonly activeSessionMessage: Locator;
  readonly proceedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.repository = new LocatorRepository(page);

    this.usernameInput = this.repository.locator('PORTAL.LOGIN.USERNAME_INPUT');
    this.passwordInput = this.repository.locator('PORTAL.LOGIN.PASSWORD_INPUT');
    this.loginButton = this.repository.locator('PORTAL.LOGIN.SIGN_IN_BUTTON');
    this.blockingOverlay = this.repository.locator('PORTAL.LOGIN.BLOCKING_OVERLAY');

    // ARIA snapshot 2026-07-09: the confirmation renders as role="alertdialog",
    // and an empty sibling alertdialog exists — the text filter + .last() pick
    // the real one (PORTAL.LOGIN.ACTIVE_SESSION_DIALOG in the repository).
    this.activeSessionDialog = page
      .getByRole('alertdialog')
      .filter({ hasText: /you have an active session/i })
      .last();
    this.activeSessionMessage = this.activeSessionDialog.getByText(
      /you have an active session\.?\s*do you want to close it\?/i
    );
    this.proceedButton = this.activeSessionDialog.getByRole('button', { name: 'Proceed' });
  }

  async goto(): Promise<void> {
    // Central resource file resolves PORTAL_LOGIN_URL or base + path — skill 24.
    const loginUrl = ENV.portal.loginUrl;

    if (!loginUrl) {
      throw new Error('PORTAL_LOGIN_URL or PORTAL_BASE_URL/PORTAL_LOGIN_PATH must be configured in .env');
    }

    console.log(`[LoginPage] Navigating to portal login page: ${loginUrl}`);
    await this.page.goto(loginUrl);

    // Recovery: the portal occasionally serves a blank shell on first load —
    // a single reload renders the login form.
    const loginFormVisible = await this.usernameInput
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (!loginFormVisible) {
      console.log('[LoginPage] Login form did not render after navigation. Reloading once.');
      await this.page.reload();
    }

    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
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
      // A lingering overlay usually means the active-session dialog is up.
      await this.handleActiveSessionPopupIfVisible(testInfo);
      await this.waitForBlockingOverlayToClear({ throwOnFailure: false });
    }
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);

    // Recovery: if the overlay is still blocking after the fill, one reload
    // restores an interactable login form; then re-fill once.
    const overlayClearedAfterFill = await this.waitForBlockingOverlayToClear({ throwOnFailure: false });
    if (!overlayClearedAfterFill) {
      console.log('[LoginPage] Blocking overlay remained visible after filling credentials. Reloading login page once.');
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await expect(this.usernameInput).toBeVisible();
      await expect(this.passwordInput).toBeVisible();
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
    // The dialog appears only when a previous session is still open —
    // its absence is a normal outcome, not an error.
    const isPopupVisible = await this.activeSessionDialog
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!isPopupVisible) {
      console.log('[LoginPage] Active session blocker did not appear.');
      return false;
    }

    console.log('[LoginPage] Active session blocker appeared. Capturing evidence.');
    await expect(this.activeSessionMessage).toBeVisible();
    await expect(this.proceedButton).toBeVisible();
    await expect(this.proceedButton).toBeEnabled();

    const screenshotPath = path.resolve('reports', 'active-session-popup.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    if (testInfo) {
      await testInfo.attach('active-session-popup', {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }

    console.log('[LoginPage] Clicking Proceed/confirmation button on active session blocker.');
    await this.proceedButton.click();
    // The dialog mask can outlive the dialog briefly; downstream actionability
    // waits cover the rest, so a lingering mask is recoverable here.
    await this.repository
      .locator('PORTAL.COMMON.DIALOG_MASK')
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => {
        console.log('[LoginPage] Dialog mask remained attached after Proceed; continuing with downstream waits.');
      });

    return true;
  }

  async waitForBlockingOverlayToClear(options: { throwOnFailure: boolean } = { throwOnFailure: true }): Promise<boolean> {
    const isHidden = await expect(this.blockingOverlay)
      .toBeHidden({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (!isHidden && options.throwOnFailure) {
      await expect(this.blockingOverlay).toBeHidden();
    }

    return isHidden;
  }
}
