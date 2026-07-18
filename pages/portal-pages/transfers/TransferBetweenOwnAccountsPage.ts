import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { LocatorRepository } from '../../../utils/locatorRepository';
import { ROUTES } from '../../../config/resources';

export class TransferBetweenOwnAccountsPage {

  private readonly repository: LocatorRepository;

  constructor(readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  // Navigation locators

  private get transferMenuLink(): Locator {
    return this.repository.locator('TRANSFER.SIDEBAR_TRANSFERS_LINK');
  }

  private get betweenMyAccountsCard(): Locator {
    return this.repository.locator('TRANSFER.BETWEEN_OWN_ACCOUNTS_CARD');
  }

  // Source-account locators

  private get fromAccountSelector(): Locator {
    return this.page
      .locator('.bma-field')
      .filter({ has: this.page.getByText('From', { exact: true }) })
      .getByRole('button')
      .filter({ has: this.page.locator('span.bma-account-number') });
  }

  private get selectedFromAccountNumber(): Locator {
    return this.fromAccountSelector.locator('span.bma-account-number');
  }

  private get selectedFromAccountBalance(): Locator {
    return this.fromAccountSelector.locator('span.bma-account-balance');
  }

  private get sourceAccountRows(): Locator {
    return this.page
      .getByRole('dialog', { name: 'Select Account' })
      .getByRole('option');
  }

  // Destination-account locators

  private get toAccountPickerTrigger(): Locator {
    return this.page
      .locator('.bma-field')
      .filter({ has: this.page.getByText('To', { exact: true }) })
      .getByRole('button')
      .filter({ has: this.page.locator('.bma-account-info') });
  }

  private get destinationAccountRows(): Locator {
    return this.page
      .getByRole('dialog')
      .getByRole('listbox', { name: 'Select Account' })
      .getByRole('option');
  }

  private get toAccountResetPlaceholder(): Locator {
    return this.toAccountPickerTrigger.getByText('Select Account', { exact: true });
  }

  // Amount locators

  private get amountInput(): Locator {
    return this.page.getByPlaceholder('0.00', { exact: true });
  }

  // Schedule locators

  private get scheduleSection(): Locator {
    return this.page.locator('app-schedule-picker');
  }

  private get instantScheduleButton(): Locator {
    return this.scheduleSection
      .getByRole('group', { name: 'Schedule type' })
      .getByRole('button', { name: 'Instant', exact: true });
  }

  // Deferred until BMA Schedule/Recurring DOM evidence is available.
  private get scheduleDateFields(): Locator {
    return this.scheduleSection
      .getByLabel(/date/i)
      .or(this.scheduleSection.getByPlaceholder(/date/i));
  }

  private get scheduleTimeFields(): Locator {
    return this.scheduleSection
      .getByLabel(/time/i)
      .or(this.scheduleSection.getByPlaceholder(/time/i));
  }

  private get scheduleFrequencyOrRecurringFields(): Locator {
    return this.scheduleSection
      .getByLabel(/frequency|repeat|recurring/i)
      .or(
        this.scheduleSection.locator(
          '[formcontrolname*="frequency" i], [formcontrolname*="repeat" i], [formcontrolname*="recurring" i]'
        )
      );
  }

  // Review, submission, and success locators

  private get confirmButton(): Locator {
    return this.repository.locator(
      'TRANSFER.BMA_CONFIRM_BUTTON'
    );
  }

  private get reviewSection(): Locator {
    return this.page.locator('cubic-transfer-review').filter({
      has: this.page.getByText('Transfer Amount', { exact: true }),
    });
  }

  private get summaryConfirmButton(): Locator {
    return this.reviewSection.getByRole('button', {
      name: 'Confirm',
      exact: true,
    });
  }

  private get successDialog(): Locator {
    return this.page.locator('.transfer-success-dialog');
  }

  // Deferred until current BMA successful-state DOM evidence is available.
  private get successBanner(): Locator {
    return this.successDialog
      .locator('span.success-badge')
      .or(
        this.successDialog.getByText(
          /transfer successful|transaction successful|successfully submitted|successfully completed/i
        )
      );
  }

  private summaryFromAccountNumber(accountNumber: string): Locator {
    return this.reviewSection
      .locator('span.review-account-number')
      .filter({ hasText: accountNumber });
  }

  private summaryAmount(expectedAmount: string): Locator {
    const escapedExpectedAmount = expectedAmount.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    return this.reviewSection.getByText(
      new RegExp(`^(?:EGP|USD|EUR|GBP)\\s+${escapedExpectedAmount}$`)
    );
  }

  // Cancellation and navigation-outcome locators

  private get cancelTransferButton(): Locator {
    return this.reviewSection.getByRole('button', {
      name: 'Cancel',
      exact: true,
    });
  }

  private get dashboardSections(): Locator {
    return this.page.getByRole('region', { name: 'Dashboard sections' });
  }

  // Error and loading locators

  private get transferErrorMessage(): Locator {
    return this.page.getByText(
      /insufficient.*(?:balance|funds)|amount.*(?:exceed|invalid|below.*min)|minimum.*amount/i
    );
  }

  private get loadingIndicator(): Locator {
    return this.page
      .locator('app-top-loading-bar')
      .getByRole('progressbar', { includeHidden: true });
  }

  // Navigation

  async navigateToTransferBetweenOwnAccounts(testInfo?: TestInfo): Promise<void> {
    await this.transferMenuLink.click();
    await expect(this.betweenMyAccountsCard).toBeVisible({ timeout: 20_000 });
    await this.captureTransferScreenScreenshot('transfer-screen-opened', testInfo);
    await this.betweenMyAccountsCard.click();
    await expect(
      this.toAccountPickerTrigger,
      'Between My Accounts form did not display the To Account selector.'
    ).toBeVisible({ timeout: 15_000 });
  }

  // Source-account picker and selected-account readers

  async openFromAccountDropdown(testInfo?: TestInfo): Promise<void> {
    await this.openSourceAccountPicker();
    await this.captureTransferScreenScreenshot('from-account-dropdown-opened', testInfo);
  }

  async getFromAccountOptions(): Promise<string[]> {
    const options = await this.sourceAccountRows.allInnerTexts();
    return options.map((option) => option.trim()).filter(Boolean);
  }

  async selectFirstFromAccount(): Promise<string> {
    const firstOption = this.sourceAccountRows.first();
    await expect(firstOption).toBeVisible();
    const selectedText = this.normalizeText(await firstOption.innerText());
    await firstOption.click();
    return selectedText;
  }

  async changeFromAccount(accountNumber: string): Promise<void> {
    await this.openSourceAccountPicker();

    const matchingAccount = this.sourceAccountRows.filter({
      hasText: accountNumber,
    });

    await expect(matchingAccount).toHaveCount(1);
    await expect(matchingAccount).toBeVisible();
    await matchingAccount.click();
    await expect(this.loadingIndicator).toBeHidden({ timeout: 20_000 });
  }

  async getSelectedFromAccountText(): Promise<string> {
    await expect(this.fromAccountSelector).toBeVisible();
    return (await this.fromAccountSelector.innerText()).trim();
  }

  async getSelectedFromAccountNumber(): Promise<string> {
    await expect(this.selectedFromAccountNumber).toBeVisible();
    const accountNumberText = await this.selectedFromAccountNumber.innerText();
    return this.extractAccountNumber(accountNumberText);
  }

  async getFromAccountBalance(): Promise<number> {
    await expect(this.selectedFromAccountBalance).toBeVisible();
    const balanceText = await this.selectedFromAccountBalance.innerText();
    return this.extractBalance(balanceText);
  }

  // Destination-account picker and reset/exclusion assertions

  async openToAccountDropdown(testInfo?: TestInfo): Promise<void> {
    await this.openDestinationAccountPicker();
    await this.captureTransferScreenScreenshot('to-account-dropdown-opened', testInfo);
  }

  async getToAccountOptions(): Promise<string[]> {
    const options = await this.destinationAccountRows.allInnerTexts();
    return options.map((option) => option.trim()).filter(Boolean);
  }

  async selectToAccount(fromAccountText: string): Promise<string> {
    const fromAccountNumber = this.extractAccountNumber(fromAccountText);
    const fromCurrency = this.extractCurrency(fromAccountText);

    await this.openDestinationAccountPicker();

    const availableDestinationRows: string[] = [];
    const destinationRows = this.destinationAccountRows;
    const rowCount = await destinationRows.count();

    for (let index = 0; index < rowCount; index += 1) {
      const row = destinationRows.nth(index);
      const rowText = (await row.innerText()).trim();
      availableDestinationRows.push(rowText);

      const destinationAccountNumber = rowText.match(/\b0\d{9,}\b/)?.[0];
      const destinationCurrency = rowText
        .match(/\b(EGP|USD|EUR|GBP)\b/i)?.[1]
        ?.toUpperCase();

      if (
        !destinationAccountNumber ||
        destinationAccountNumber === fromAccountNumber ||
        destinationCurrency !== fromCurrency
      ) {
        continue;
      }

      await row.click();
      await this.waitForLoadingToFinish();
      return destinationAccountNumber;
    }

    throw new Error(
      `selectToAccount: No destination account found for source account ` +
        `"${fromAccountNumber}" with currency "${fromCurrency}". ` +
        `Available destination rows: ${JSON.stringify(availableDestinationRows)}`
    );
  }

  async assertToAccountExcludesSourceAccount(sourceAccountNumber: string): Promise<void> {
    const toOptions = await this.getToAccountOptions();
    const sourceAccountIsListed = toOptions.some((option) =>
      option.includes(sourceAccountNumber)
    );

    expect(
      sourceAccountIsListed,
      `To Account picker must not include source account "${sourceAccountNumber}".\nOptions: ${JSON.stringify(toOptions)}`
    ).toBe(false);
  }

  async assertToAccountIsReset(): Promise<void> {
    await expect(this.toAccountResetPlaceholder).toBeVisible({ timeout: 10_000 });
  }

  // Account-option validation

  async verifyFromAccountEntriesHaveRequiredDetails(options: string[]): Promise<void> {
    const leadingMaskedAccountNumberPattern =
      /(?:\*{2,}|\u2022{2,}|x{2,})\s*\d{2,}/i;
    const trailingMaskedAccountNumberPattern =
      /\d{2,}\s*(?:\*{2,}|\u2022{2,}|x{2,})/i;
    const fullAccountNumberPattern = /\b\d{8,}\b/;
    const currencyBeforeAmountPattern =
      /\b[A-Z]{3}\s*[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/i;
    const amountBeforeCurrencyPattern =
      /\b[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*[A-Z]{3}\b/i;

    expect(
      options.length,
      'From Account dropdown should contain at least one account entry.'
    ).toBeGreaterThan(0);

    for (const optionText of options) {
      const hasAccountNumber =
        leadingMaskedAccountNumberPattern.test(optionText) ||
        trailingMaskedAccountNumberPattern.test(optionText) ||
        fullAccountNumberPattern.test(optionText);
      const hasBalance =
        currencyBeforeAmountPattern.test(optionText) ||
        amountBeforeCurrencyPattern.test(optionText);

      expect(optionText, 'Account option should not be empty.').not.toEqual('');
      expect(
        hasAccountNumber,
        `Account option should include an account number (masked or full): ${optionText}`
      ).toBe(true);
      expect(
        this.hasRecognizedAccountType(optionText),
        `Account option should include account type text: ${optionText}`
      ).toBe(true);
      expect(
        hasBalance,
        `Account option should include available balance/amount: ${optionText}`
      ).toBe(true);
    }
  }

  async verifyToAccountEntriesHaveRequiredDetails(options: string[]): Promise<void> {
    const accountNumberPattern = /\b0\d{9,}\b/;
    const currencyPattern = /\b(EGP|USD|EUR|GBP)\b/i;
    expect(options.length, 'To Account picker must list at least one account.').toBeGreaterThan(0);
    for (const option of options) {
      expect(option, `To entry must show an account number: "${option}"`).toMatch(accountNumberPattern);
      expect(
        this.hasRecognizedAccountType(option),
        `To entry must show an account type: "${option}"`
      ).toBe(true);
      expect(option, `To entry must show a currency: "${option}"`).toMatch(currencyPattern);
    }
  }

  async assertAllFromEntriesShowCurrency(): Promise<string[]> {
    const options = await this.getFromAccountOptions();
    const foundCurrencies = new Set<string>();

    for (const option of options) {
      foundCurrencies.add(this.extractCurrency(option));
    }

    return [...foundCurrencies];
  }

  // Amount interaction and validation

  async enterAmount(amount: string | number): Promise<void> {
    await expect(this.amountInput).toBeVisible();
    await this.amountInput.fill(String(amount));
  }

  async attemptConfirmTransfer(): Promise<void> {
    // For negative-path tests where the Confirm button may legitimately be disabled.
    await expect(this.loadingIndicator).toBeHidden({ timeout: 20_000 });
    await expect(this.confirmButton).toBeVisible();

    if (await this.confirmButton.isEnabled()) {
      await this.confirmButton.click();
      await expect(this.loadingIndicator).toBeHidden({ timeout: 20_000 });
    }
  }

  async assertConfirmBlockedByMinimumAmount(): Promise<void> {
    await expect(this.confirmButton).toBeVisible();
    await expect(
      this.confirmButton,
      'Confirm button must be disabled when amount is below the minimum.'
    ).toBeDisabled({ timeout: 5_000 });
  }

  async assertNegativeAmountRejected(): Promise<void> {
    const amountValue = (await this.amountInput.inputValue()).trim();

    if (amountValue === '') {
      return;
    }

    await expect(this.transferErrorMessage).toBeVisible({ timeout: 10_000 });
  }

  async assertInsufficientFundsError(): Promise<void> {
    const formConfirmIsVisible = await this.confirmButton.isVisible();

    if (
      formConfirmIsVisible &&
      await this.confirmButton.isDisabled()
    ) {
      return;
    }

    await expect(this.transferErrorMessage).toBeVisible({ timeout: 10_000 });
  }

  // Schedule

  async selectInstantSchedule(): Promise<void> {
    await this.instantScheduleButton.click();
    await expect(this.instantScheduleButton).toHaveClass(
      /schedule-toggle__btn--active/
    );
  }

  async assertInstantScheduleShowsNoExtraFields(): Promise<void> {
    await expect(this.scheduleDateFields).toHaveCount(0);
    await expect(this.scheduleTimeFields).toHaveCount(0);
    await expect(this.scheduleFrequencyOrRecurringFields).toHaveCount(0);
  }

  // Review, submission, and success

  async clickConfirm(): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.confirmButton).toBeVisible({ timeout: 30_000 });
    await expect(this.confirmButton).toBeEnabled({ timeout: 30_000 });
    await this.confirmButton.click();
    await this.waitForLoadingToFinish();
    await expect(this.reviewSection).toBeVisible({ timeout: 30_000 });
  }

  async assertSummaryFromAccount(fromAccountText: string): Promise<void> {
    const accountNumber = fromAccountText.match(/\b0\d{9,}\b/)?.[0] ?? fromAccountText;
    await expect(this.summaryFromAccountNumber(accountNumber)).toHaveText(
      accountNumber,
      { timeout: 30_000 }
    );
  }

  async assertSummaryAmount(expectedAmount: string): Promise<void> {
    await expect(this.summaryAmount(expectedAmount)).toBeVisible({
      timeout: 30_000,
    });
  }

  async clickConfirmOnSummary(): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.reviewSection).toBeVisible({ timeout: 30_000 });
    await expect(this.summaryConfirmButton).toBeVisible({ timeout: 30_000 });
    await expect(this.summaryConfirmButton).toBeEnabled({ timeout: 30_000 });
    await this.summaryConfirmButton.click();
    await this.waitForLoadingToFinish();
    await expect(this.successBanner).toBeVisible({ timeout: 60_000 });
  }

  async assertTransferSuccessful(): Promise<void> {
    await expect(this.successBanner).toBeVisible({ timeout: 60_000 });
  }

  // Cancellation and navigation outcome

  async clickCancelTransfer(): Promise<void> {
    if (await this.cancelTransferButton.isVisible()) {
      await expect(this.cancelTransferButton).toBeEnabled();
      await this.cancelTransferButton.click();
    } else {
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
    }
    await this.waitForLoadingToFinish();
  }

  async assertNavigatedBackFromTransfer(): Promise<void> {
    const isOnTransferHub = this.page.url().includes(ROUTES.portal.transferHub);

    if (!isOnTransferHub) {
      await expect(this.dashboardSections).toBeVisible({ timeout: 15_000 });
      return;
    }

    await expect(this.toAccountResetPlaceholder).toBeVisible({ timeout: 15_000 });
    await expect(this.amountInput).toHaveValue('', { timeout: 15_000 });
  }

  // Remaining validation

  async assertFromAccountRequiredError(): Promise<void> {
    // Submitting without a From account must surface a validation error.
    // The portal pre-selects From, so this assertion expects to FAIL if deselection is impossible,
    // confirming the defect that the "no From account" path is unreachable via the UI.
    await expect(
      this.page.getByText(
        /from.*required|source account.*required|please select.*from|select.*source account/i
      )
    ).toBeVisible({ timeout: 10_000 });
  }

  // Screenshot helper

  private async captureTransferScreenScreenshot(
    name: string,
    testInfo?: TestInfo
  ): Promise<void> {
    const screenshotPath = path.resolve('reports', 'transfer', `${name}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    if (testInfo) {
      await testInfo.attach(name, { path: screenshotPath, contentType: 'image/png' });
    }
  }

  // Loading and picker-readiness helpers

  private async waitForLoadingToFinish(): Promise<void> {
    if (await this.loadingIndicator.isVisible()) {
      await expect(this.loadingIndicator).toBeHidden({ timeout: 20_000 });
    }
  }

  private async openSourceAccountPicker(): Promise<void> {
    await expect(this.loadingIndicator).toBeHidden({ timeout: 20_000 });
    await expect(this.fromAccountSelector).toBeVisible({ timeout: 10_000 });
    await this.fromAccountSelector.click();
    await expect(this.sourceAccountRows.first()).toBeVisible({ timeout: 15_000 });
  }

  private async openDestinationAccountPicker(): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.toAccountPickerTrigger).toBeVisible();
    await this.toAccountPickerTrigger.click();
    await expect(this.destinationAccountRows.first()).toBeVisible({ timeout: 15_000 });
  }

  // Parsing helpers

  private extractAccountNumber(text: string): string {
    const accountNumber = text.match(/\b0\d{9,}\b/)?.[0];

    if (!accountNumber) {
      throw new Error(`Cannot parse account number from selected From account: "${text}"`);
    }

    return accountNumber;
  }

  private extractCurrency(text: string): string {
    const currency = text.match(/\b(EGP|USD|EUR|GBP)\b/i)?.[1];

    if (!currency) {
      throw new Error(`Cannot parse currency from selected From account: "${text}"`);
    }

    return currency.toUpperCase();
  }

  private extractBalance(text: string): number {
    const balance = text.match(/[\d,]+\.\d{2}/)?.[0];

    if (!balance) {
      throw new Error(`Cannot parse balance from selected From account: "${text}"`);
    }

    return Number.parseFloat(balance.replace(/,/g, ''));
  }

  // Shared validation helper

  private hasRecognizedAccountType(value: string): boolean {
    return /\b(current|saving|savings|investment|account|overdraft|deposit|trst|adv|intr)\b/i.test(
      value
    );
  }

  // Normalization helper

  private normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
