import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';

export class AccountsSummaryPage {
  readonly page: Page;
  readonly accountsNavLink: Locator;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly viewDetailsButtons: Locator;
  readonly loadMoreButton: Locator;
  readonly displayCurrencyDropdown: Locator;
  readonly availableBalanceLabels: Locator;
  readonly maskedAccountIdentifiers: Locator;
  readonly recentTransactionsHeading: Locator;
  readonly recentTransactionsTable: Locator;
  readonly loadingIndicator: Locator;
  readonly themeErrorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountsNavLink = page
      .getByRole('link', { name: /^accounts$/i })
      .or(page.locator('a[href="#/accounts"]'))
      .first();
    this.heading = page.getByText(/^accounts$/i).first();
    this.searchInput = page.getByPlaceholder(/search accounts/i);
    this.viewDetailsButtons = page.getByRole('button', { name: /view details/i });
    this.loadMoreButton = page.getByRole('button', { name: /load more/i });
    this.displayCurrencyDropdown = page.getByRole('combobox').first();
    this.availableBalanceLabels = page.getByText(/available balance/i);
    this.maskedAccountIdentifiers = page.getByText(/\*{2,}\d{2,}/);
    this.recentTransactionsHeading = page.getByRole('heading', { name: /recent transactions/i });
    this.recentTransactionsTable = page
      .getByRole('table')
      .filter({ hasText: /Reference Number/i })
      .filter({ hasText: /Transaction Date/i })
      .filter({ hasText: /Amount/i })
      .first();
    this.loadingIndicator = page.getByText(/loading|please wait/i);
    this.themeErrorToast = page.getByText(/error fetching theme/i);
  }

  async goto(testInfo?: TestInfo) {
    const baseUrl = process.env.PORTAL_BASE_URL ?? '';
    const loginPath = process.env.PORTAL_LOGIN_PATH ?? '';
    const appPath = loginPath.split('#')[0];

    await this.page.goto(`${baseUrl}${appPath}#/accounts`, { waitUntil: 'domcontentloaded' });

    await this.waitForAccountsScreen();
    await this.captureScreenshot('accounts-summary-loaded', testInfo);
  }

  async waitForAccountsScreen() {
    await expect(this.page, 'Accounts route should be active.').toHaveURL(/#\/accounts(?:$|[/?#])/);
    await expect(this.searchInput, 'Accounts search input should be visible on the Accounts screen.').toBeVisible({
      timeout: 30000,
    });
    await expect(
      this.viewDetailsButtons.first().or(this.page.getByText(/no accounts found/i)),
      'Accounts screen should show account actions or an approved empty state.'
    ).toBeVisible({ timeout: 30000 });
    await expect(this.loadingIndicator).toBeHidden({ timeout: 20000 }).catch(() => {});
  }

  async expectSummaryControlsVisible() {
    await expect(this.searchInput, 'Accounts search input should be visible.').toBeVisible();
    await expect(this.displayCurrencyDropdown, 'Display currency dropdown should be visible.').toBeVisible();
    await expect(this.viewDetailsButtons.first(), 'At least one View Details action should be visible.').toBeVisible();
  }

  async expectVisibleAccountsHaveIdentifiersAndBalances() {
    const visibleDetailButtons = await this.viewDetailsButtons.count();
    const visibleBalanceLabels = await this.availableBalanceLabels.count();
    const visibleMaskedIdentifiers = await this.maskedAccountIdentifiers.count();

    expect(visibleDetailButtons, 'At least one visible account should expose a View Details action.').toBeGreaterThan(0);
    expect(visibleBalanceLabels, 'Visible accounts should display balance labels.').toBeGreaterThan(0);
    expect(visibleMaskedIdentifiers, 'Visible accounts should display masked/basic identifiers.').toBeGreaterThan(0);
  }

  async expectLoadMoreIfPresent() {
    if (await this.loadMoreButton.isVisible().catch(() => false)) {
      await expect(this.loadMoreButton, 'Load More should be enabled when visible.').toBeEnabled();
    }
  }

  async openFirstAccountDetails() {
    await expect(
      this.viewDetailsButtons.first(),
      'Cannot open account details because no VIEW DETAILS button is visible on Accounts Overview.'
    ).toBeVisible({ timeout: 30000 });
    await expect(this.viewDetailsButtons.first(), 'First account VIEW DETAILS button should be enabled.').toBeEnabled();

    await this.viewDetailsButtons.first().click();
    await expect(this.page.locator('body'), 'Account details page body should be visible after opening first account.').toBeVisible();
    await expect
      .poll(() => this.page.url(), {
        message: 'Opening first account details should navigate to an account details route.',
      })
      .toMatch(/#\/accounts\/account-details\//);
  }

  async captureScreenshot(name: string, testInfo?: TestInfo) {
    const screenshotPath = path.resolve('reports', 'system-walkthrough', 'accounts-management', `${name}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    if (testInfo) {
      await testInfo.attach(name, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }

    return screenshotPath;
  }
}
