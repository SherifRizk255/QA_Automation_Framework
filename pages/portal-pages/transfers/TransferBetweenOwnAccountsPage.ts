import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { LocatorRepository } from '../../../utils/locatorRepository';
import { ROUTES } from '../../../config/resources';
import { AccountPickerComponent } from '../../components/portal/account-picker/AccountPickerComponent';
import { AccountRowComponent } from '../../components/portal/account-picker/AccountRowComponent';
import { PortalLoadingComponent } from '../../components/portal/loading/PortalLoadingComponent';

export class TransferBetweenOwnAccountsPage {

  // ───── Class configuration and shared component instances ─────

  private readonly repository: LocatorRepository;
  private readonly loadingState: PortalLoadingComponent;
  private readonly fromAccountPicker: AccountPickerComponent;
  private readonly toAccountPicker: AccountPickerComponent;

  constructor(readonly page: Page) {
    this.repository = new LocatorRepository(page);
    this.loadingState = new PortalLoadingComponent(page);
    this.fromAccountPicker =
      new AccountPickerComponent(page,
        this.fromAccountSelector,
        this.sourceAccountRows,
        this.loadingState,
        'From Account'
      );

    this.toAccountPicker =
      new AccountPickerComponent(page,
        this.toAccountPickerTrigger,
        this.destinationAccountRows,
        this.loadingState,
        'To Account'
      );
  }

  // ───── Locators used to open the Transfers area and Between My Accounts flow ─────

  private get transferMenuLink(): Locator {
    return this.repository.locator('TRANSFER.SIDEBAR_TRANSFERS_LINK');
  }

  private get betweenMyAccountsCard(): Locator {
    return this.repository.locator('TRANSFER.BETWEEN_OWN_ACCOUNTS_CARD');
  }


  // ───── Locators for the selected From account and source-account picker rows ─────

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

  // ───── Locators for the To account picker, destination rows, and reset state ───────

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

  //  ───── Locators for entering and validating the transfer amount  ─────

  private get amountInput(): Locator {
    return this.page.getByPlaceholder('0.00', { exact: true });
  }

  //  ───── Locators for Instant, Schedule, and Recurring transfer controls  ─────

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
      .or(this.scheduleSection.locator(
          '[formcontrolname*="frequency" i], [formcontrolname*="repeat" i], [formcontrolname*="recurring" i]'
        )
      );
  }

  //  ───── Locators for the transfer review screen and confirmation actions  ─────

  private get confirmButton(): Locator {
    return this.repository.locator('TRANSFER.BMA_CONFIRM_BUTTON');
  }

  private get reviewSection(): Locator {
    return this.page.locator('cubic-transfer-review')
    .filter({has: this.page.getByText('Transfer Amount', { exact: true })});
  }

  private get summaryConfirmButton(): Locator {
    return this.reviewSection.getByRole('button', {name: 'Confirm',exact: true});
  }

  private summaryFromAccountNumber(accountNumber: string): Locator {
    return this.reviewSection
      .locator('span.review-account-number')
      .filter({ hasText: accountNumber });
  }

  private summaryAmount(expectedAmount: string): Locator {
    const escapedExpectedAmount = expectedAmount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.reviewSection.getByText(new RegExp(`^(?:EGP|USD|EUR|GBP)\\s+${escapedExpectedAmount}$`));
  }

  //  ───── Locators used to confirm successful transfer submission  ─────

  private get successDialog(): Locator {
    return this.page.locator('.transfer-success-dialog');
  }

  // Deferred until current BMA successful-state DOM evidence is available.
  private get successBanner(): Locator {
    return this.successDialog
      .locator('span.success-badge')
      .or(this.successDialog.getByText(/transfer successful|transaction successful|successfully submitted|successfully completed/i));
  }

  //  ───── Locators used when cancelling or leaving the transfer flow  ─────

  private get cancelTransferButton(): Locator {
    return this.reviewSection.getByRole('button', {
      name: 'Cancel',
      exact: true,
    });
  }

  private get dashboardSections(): Locator {
    return this.page.getByRole('region', { name: 'Dashboard sections' });
  }

  // Locator for transfer validation messages

  private get transferErrorMessage(): Locator {
    return this.page.getByText(/insufficient.*(?:balance|funds)|amount.*(?:exceed|invalid|below.*min)|minimum.*amount/i);
  }

  //  ───── Opens the Between My Accounts transfer flow ─────

  async navigateToTransferBetweenOwnAccounts(testInfo?: TestInfo): Promise<void> {
    await this.transferMenuLink.click();
    await expect(this.betweenMyAccountsCard).toBeVisible({ timeout: 20_000 });
    await this.captureTransferScreenScreenshot('transfer-screen-opened', testInfo);
    await this.betweenMyAccountsCard.click();
    await expect( this.toAccountPickerTrigger,'Between My Accounts form did not display the To Account selector.')
    .toBeVisible({ timeout: 15_000 });
  }

  //  ───── Opens, selects, changes, and reads the From account ─────

  async openFromAccountDropdown(testInfo?: TestInfo): Promise<void> {
    await this.fromAccountPicker.open();
    await this.captureTransferScreenScreenshot('from-account-dropdown-opened', testInfo);
  }

  async getFromAccountOptions(): Promise<string[]> {
    return this.fromAccountPicker.getAllTexts();
  }

  async selectFirstFromAccount(): Promise<string> {
    const firstOption = this.fromAccountPicker.row(0);
    await firstOption.assertVisible();
    const selectedText = (await firstOption.getText()).replace(/\s+/g, ' ').trim();
    await firstOption.click();
    return selectedText;
  }

  async changeFromAccount(accountNumber: string): Promise<void> {
    await this.fromAccountPicker.open();
    const matchingAccount = this.sourceAccountRows.filter({hasText: accountNumber,});
    await this.accountRow(matchingAccount).click();
    await this.loadingState.waitForCompletion();
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

  //  ───── Opens, selects, and validates the To account picker state ─────

  async openToAccountDropdown(testInfo?: TestInfo): Promise<void> {
    await this.toAccountPicker.open();
    await this.captureTransferScreenScreenshot('to-account-dropdown-opened', testInfo);
  }

  async getToAccountOptions(): Promise<string[]> {
    return this.toAccountPicker.getAllTexts();
  }

  async selectToAccount(fromAccountText: string): Promise<string> {
    const fromAccountNumber = this.extractAccountNumber(fromAccountText);
    const sourceAccount = this.accountRow(this.fromAccountSelector);
    const fromCurrency = await sourceAccount.findCurrency();

    if (!fromCurrency) {
      throw new Error(`selectToAccount: Cannot find a supported currency for source account ` + `"${fromAccountNumber}".`);
    }

    await this.toAccountPicker.open();

    const availableDestinationRows: string[] = [];
    const rowCount = await this.toAccountPicker.getRowCount();

    for (let index = 0; index < rowCount; index += 1) {
      const destinationAccountRow =this.toAccountPicker.row(index);
      const rowText =await destinationAccountRow.getText();
      availableDestinationRows.push(rowText);

      const destinationAccountNumber =await destinationAccountRow.findAccountNumber();

      if (
        !destinationAccountNumber ||
        destinationAccountNumber === fromAccountNumber
      ) {
        continue;
      }

      const destinationCurrency =await destinationAccountRow.findCurrency();

      if (
        !destinationCurrency ||destinationCurrency !== fromCurrency
      ) {
        continue;
      }

      await destinationAccountRow.click();
      await this.loadingState.waitForCompletion();
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
    const sourceAccountIsListed = toOptions.some((option) => option.includes(sourceAccountNumber));

    expect( sourceAccountIsListed, 
      `To Account picker must not include source account "${sourceAccountNumber}".\nOptions: ${JSON.stringify(toOptions)}`
    ).toBe(false);
  }

  async assertToAccountIsReset(): Promise<void> {
    await expect(this.toAccountResetPlaceholder).toBeVisible({ timeout: 10_000 });
  }

  // ─────  Validates required details displayed in source and destination account rows ─────

  async verifyFromAccountEntriesHaveRequiredDetails(): Promise<void> {
    const leadingMaskedAccountNumberPattern = /(?:\*{2,}|\u2022{2,}|x{2,})\s*\d{2,}/i;
    const trailingMaskedAccountNumberPattern = /\d{2,}\s*(?:\*{2,}|\u2022{2,}|x{2,})/i;
    const fullAccountNumberPattern = /\b\d{8,}\b/;
    const currencyBeforeAmountPattern = /\b[A-Z]{3}\s*[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/i;
    const amountBeforeCurrencyPattern = /\b[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*[A-Z]{3}\b/i;
    const rowCount = await this.fromAccountPicker.getRowCount();

    expect( rowCount, 'From Account dropdown should contain at least one account entry.').toBeGreaterThan(0);

    for (let index = 0; index < rowCount; index += 1) {
      const accountRow =this.fromAccountPicker.row(index);
      const optionText = await accountRow.getText();
      await accountRow.getAccountType();
      const hasAccountNumber =
        leadingMaskedAccountNumberPattern.test(optionText) ||
        trailingMaskedAccountNumberPattern.test(optionText) ||
        fullAccountNumberPattern.test(optionText);
      const hasBalance =
        currencyBeforeAmountPattern.test(optionText) ||
        amountBeforeCurrencyPattern.test(optionText);

      expect(optionText, 'Account option should not be empty.').not.toEqual('');
      expect(hasAccountNumber, `Account option should include an account number (masked or full): ${optionText}`).toBe(true);
      expect(hasBalance,`Account option should include available balance/amount: ${optionText}`).toBe(true);
    }
  }

  async verifyToAccountEntriesHaveRequiredDetails(): Promise<void> {
    const rowCount = await this.toAccountPicker.getRowCount();

    expect( rowCount,'To Account picker must list at least one account.').toBeGreaterThan(0);

    for (let index = 0; index < rowCount; index += 1) {
      const accountRow = this.toAccountPicker.row(index);

      await accountRow.getAccountNumber();
      await accountRow.getAccountType();
      await accountRow.getCurrency();
    }
  }

  async assertAllFromEntriesShowCurrency(): Promise<string[]> {
    const foundCurrencies = new Set<string>();
    const rowCount = await this.fromAccountPicker.getRowCount();

    for (let index = 0; index < rowCount; index += 1) {
      const accountRow = this.fromAccountPicker.row(index);
      const currency = await accountRow.getCurrency();

      foundCurrencies.add(currency);
    }

    return [...foundCurrencies];
  }

  //  ───── Enters transfer amounts and validates amount-related restrictions ─────

  async enterAmount(amount: string | number): Promise<void> {
    await this.amountInput.fill(String(amount));
  }

  async attemptConfirmTransfer(): Promise<void> {
    // For negative-path tests where the Confirm button may legitimately be disabled.
    await this.loadingState.waitForCompletion();
    await expect(this.confirmButton).toBeVisible();

    if (await this.confirmButton.isEnabled()) {
      await this.confirmButton.click();
      await this.loadingState.waitForCompletion();
    }
  }

  async assertConfirmBlockedByMinimumAmount(): Promise<void> {
    await expect(this.confirmButton).toBeVisible();
    await expect(this.confirmButton,'Confirm button must be disabled when amount is below the minimum.').toBeDisabled({ timeout: 5_000 });
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
      formConfirmIsVisible && await this.confirmButton.isDisabled()
    ) {
      return;
    }

    await expect(this.transferErrorMessage).toBeVisible({ timeout: 10_000 });
  }

  //  ───── Selects Instant scheduling and verifies that no deferred schedule fields appear ─────

  async selectInstantSchedule(): Promise<void> {
    await this.instantScheduleButton.click();
    await expect(this.instantScheduleButton).toContainClass('schedule-toggle__btn--active');
  }

  async assertInstantScheduleShowsNoExtraFields(): Promise<void> {
    await expect(this.scheduleDateFields).toHaveCount(0);
    await expect(this.scheduleTimeFields).toHaveCount(0);
    await expect(this.scheduleFrequencyOrRecurringFields).toHaveCount(0);
  }

  // Opens the review screen and validates transfer summary details

  async clickConfirm(): Promise<void> {
    await this.loadingState.waitForCompletion();
    await this.confirmButton.click();
    await this.loadingState.waitForCompletion();
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
    await expect(this.summaryAmount(expectedAmount)).toBeVisible({timeout: 30_000,});
  }

  async clickConfirmOnSummary(): Promise<void> {
    await this.loadingState.waitForCompletion();
    await this.summaryConfirmButton.click();
    await this.loadingState.waitForCompletion();
    await expect(this.successBanner).toBeVisible({ timeout: 60_000 });
  }

  //  ───── Verifies that the completed transfer reached a successful state ─────

  async assertTransferSuccessful(): Promise<void> {
    await expect(this.successBanner).toBeVisible({ timeout: 60_000 });
  }

  // Cancels the transfer and validates the resulting navigation state

  async clickCancelTransfer(): Promise<void> {
    if (await this.cancelTransferButton.isVisible()) {
      await this.cancelTransferButton.click();
    } else {
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
    }
    await this.loadingState.waitForCompletion();
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

  //  ───── Negative-path validation for currently unreachable or constrained portal states ─────

  async assertFromAccountRequiredError(): Promise<void> {
    // Submitting without a From account must surface a validation error.
    // The portal pre-selects From, so this assertion expects to FAIL if deselection is impossible,
    // confirming the defect that the "no From account" path is unreachable via the UI.
    await expect(
      this.page.getByText(/from.*required|source account.*required|please select.*from|select.*source account/i))
      .toBeVisible({ timeout: 10_000 });
  }

  //  ───── Captures transfer-flow evidence and attaches it to the active test ─────

  private async captureTransferScreenScreenshot( name: string, testInfo?: TestInfo): Promise<void> {
    const screenshotPath = path.resolve('reports', 'transfer', `${name}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    if (testInfo) {
      await testInfo.attach(name, { path: screenshotPath, contentType: 'image/png' });
    }
  }

  //  ───── Creates account-row components for BMA-scoped locators ─────

  private accountRow( row: Locator): AccountRowComponent {
    return new AccountRowComponent( this.page,row);
  }

  //  ───── Parses dynamic account values from already-read text ─────

  private extractAccountNumber(text: string): string {
    const accountNumber = text.match(/\b0\d{9,}\b/)?.[0];

    if (!accountNumber) {
      throw new Error(`Cannot parse account number from selected From account: "${text}"`);
    }
    return accountNumber;
  }

  private extractBalance(text: string): number {
    const balanceText =text.match(/[+-]?[\d,]+\.\d{2}/)?.[0];

    if (!balanceText) {
      throw new Error( `Cannot parse balance from selected From account: "${text}"`);
    }

    return Number.parseFloat(balanceText.replaceAll(',', '') );
  }
}
