import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';

export class TransferBetweenOwnAccountsPage {
  readonly page: Page;
  readonly transferMenu: Locator;
  readonly transferLandingHeading: Locator;
  readonly betweenMyAccountsCard: Locator;
  readonly fromAccountDropdown: Locator;
  readonly toAccountDropdown: Locator;
  readonly dropdownOptions: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.transferMenu = page.locator('.p-panelmenu-header-link[href="#/transfers"]').first();
    this.transferLandingHeading = page.getByText(/^Transfer Money$/i).first();
    this.betweenMyAccountsCard = page.getByRole('button', { name: /between my accounts/i });

    this.fromAccountDropdown = this.dropdownByLabel(/from account/i).or(page.getByText(/select source account/i));
    this.toAccountDropdown = this.dropdownByLabel(/to account/i).or(page.getByText(/select destination account/i));
    this.dropdownOptions = page
      .getByRole('option')
      .or(page.locator('.p-select-option, .p-dropdown-item, [role="listbox"] li, .dialog-account-item'));
    this.loadingIndicator = page.getByText(/loading|please wait/i);
  }

  dropdownByLabel(labelPattern: RegExp): Locator {
    return this.page
      .getByLabel(labelPattern)
      .or(this.page.getByRole('combobox', { name: labelPattern }))
      .or(
        this.page
          .locator('label')
          .filter({ hasText: labelPattern })
          .locator('xpath=following::*[@role="combobox" or contains(@class, "p-select") or contains(@class, "p-dropdown")][1]')
      );
  }

  async navigateToTransferBetweenOwnAccounts(testInfo?: TestInfo): Promise<void> {
    console.log('[TransferBetweenOwnAccountsPage] Navigating to Transfer Money page.');
    await this.transferMenu.click();
    await expect(this.transferLandingHeading).toBeVisible();
    await this.captureTransferScreenScreenshot('transfer-screen-opened', testInfo);

    console.log('[TransferBetweenOwnAccountsPage] Selecting Between My Accounts transfer type.');
    await this.betweenMyAccountsCard.click();

    await expect(
      this.fromAccountDropdown,
      'Transfer Between My Accounts form did not display the From Account dropdown after selecting Between My Accounts.'
    ).toBeVisible();
  }

  async waitForLoadingToFinish(): Promise<void> {
    await expect(this.loadingIndicator).toBeHidden({ timeout: 20000 }).catch(() => {});
  }

  async openFromAccountDropdown(testInfo?: TestInfo): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.fromAccountDropdown).toBeVisible();
    await this.fromAccountDropdown.click();
    await expect(this.dropdownOptions.first()).toBeVisible();
    await this.captureTransferScreenScreenshot('from-account-dropdown-opened', testInfo);
  }

  async getFromAccountOptions(): Promise<string[]> {
    return this.getVisibleDropdownOptionTexts();
  }

  async selectFirstFromAccount(): Promise<string> {
    const firstOption = this.dropdownOptions.first();
    await expect(firstOption).toBeVisible();
    const selectedText = this.normalizeText(await firstOption.innerText());
    await firstOption.click();
    return selectedText;
  }

  async openToAccountDropdown(testInfo?: TestInfo): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.toAccountDropdown).toBeVisible();
    await this.toAccountDropdown.click();
    await expect(this.dropdownOptions.first()).toBeVisible();
    await this.captureTransferScreenScreenshot('to-account-dropdown-opened', testInfo);
  }

  async getToAccountOptions(): Promise<string[]> {
    return this.getVisibleDropdownOptionTexts();
  }

  async getSelectedFromAccountText(): Promise<string> {
    return this.normalizeText(await this.fromAccountDropdown.innerText());
  }

  async verifyFromAccountEntriesHaveRequiredDetails(options: string[]): Promise<void> {
    const maskedAccountPattern = /(?:\*{2,}|•{2,}|x{2,})\s*\d{2,}|(?:\d{2,}\s*(?:\*{2,}|•{2,}|x{2,}))/i;
    const accountTypePattern = /\b(current|savings|investment|account|overdraft|deposit)\b/i;
    const balancePattern = /\b[A-Z]{3}\s*[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*[A-Z]{3}\b/i;

    expect(options.length, 'From Account dropdown should contain at least one account entry.').toBeGreaterThan(0);

    for (const optionText of options) {
      expect(optionText, `Account option should not be empty.`).not.toEqual('');
      expect(optionText, `Account option should include a masked account number: ${optionText}`).toMatch(maskedAccountPattern);
      expect(optionText, `Account option should include account type text: ${optionText}`).toMatch(accountTypePattern);
      expect(optionText, `Account option should include available balance/amount: ${optionText}`).toMatch(balancePattern);
    }
  }

  async captureTransferScreenScreenshot(name: string, testInfo?: TestInfo): Promise<string> {
    const screenshotPath = path.resolve('reports', 'transfer', `${name}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    if (testInfo) {
      await testInfo.attach(name, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }

    return screenshotPath;
  }

  async getVisibleDropdownOptionTexts(): Promise<string[]> {
    const texts = await this.dropdownOptions.evaluateAll((options) =>
      options
        .filter((option) => {
          const style = window.getComputedStyle(option);
          const box = option.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
        })
        .map((option) => option.textContent ?? '')
    );

    return texts.map((text) => this.normalizeText(text)).filter(Boolean);
  }

  normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
