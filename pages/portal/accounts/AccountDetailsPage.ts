import { expect, type Locator, type Page } from '@playwright/test';

export class AccountDetailsPage {
  readonly page: Page;
  readonly viewDetailsButtons: Locator;
  readonly recentTransactionsArea: Locator;
  readonly statementButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.viewDetailsButtons = page.getByRole('button', { name: /view details/i });
    this.recentTransactionsArea = page.getByText(/recent transactions|transaction history/i).first();
    // Single .or kept intentionally: the statements flow has no active spec and the
    // control was never live-verified as button vs link — resolve on the next
    // unblocked walkthrough run and commit to one.
    this.statementButton = page
      .getByRole('button', { name: /statement/i })
      .or(page.getByRole('link', { name: /statement/i }));
  }

  async openFirstAccountDetailsCandidate() {
    await expect(this.viewDetailsButtons.first(), 'A View Details action is required before account details can be opened.').toBeVisible();
    await this.viewDetailsButtons.first().click();
    await expect(this.page.locator('body')).toBeVisible();
  }

  async expectDetailsRouteOrContentCandidate() {
    await expect
      .poll(() => this.page.url(), {
        message: 'Account details route should be reached after View Details.',
      })
      .toMatch(/#\/accounts\/account-details\//);
  }

  async assertLoaded() {
    await this.expectDetailsRouteOrContentCandidate();
    await expect(this.page.locator('body'), 'Account details page should be visible.').toBeVisible();
  }

  async openStatements() {
    await this.assertLoaded();
    await expect(
      this.recentTransactionsArea,
      'Account details page should show a transactions area before opening statements.'
    ).toBeVisible();
    await expect(
      this.statementButton.first(),
      'STATEMENT button/control was not found on the account details page. Account Statements must be opened from account details, not Accounts Overview.'
    ).toBeVisible();
    await expect(this.statementButton.first(), 'STATEMENT button/control should be enabled.').toBeEnabled();

    await this.statementButton.first().click();
  }
}
