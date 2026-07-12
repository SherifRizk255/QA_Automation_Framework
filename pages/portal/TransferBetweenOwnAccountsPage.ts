import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { LocatorRepository } from '../../utils/locatorRepository';
import {
  ACCOUNT_NUMBER_FILTER_PATTERN,
  ACCOUNT_TYPE_PATTERN,
  BALANCE_WITH_CURRENCY_PATTERN,
  CURRENCY_CODE_PATTERN,
  MASKED_OR_FULL_ACCOUNT_PATTERN,
  UNMASKED_ACCOUNT_PATTERN,
  escapeRegExp,
  extractAccountNumber,
  extractAmount,
  extractCurrencyCode,
  normalizeWhitespace,
} from '../../utils/textParsers';

export class TransferBetweenOwnAccountsPage {
  readonly page: Page;
  private readonly repository: LocatorRepository;

  constructor(page: Page) {
    this.page = page;
    this.repository = new LocatorRepository(page);
  }

  // ─── Locators (private getters) ──────────────────────────────────────────────

  private get transferMenuLink(): Locator {
    return this.repository.locator('TRANSFER.SIDEBAR_TRANSFERS_LINK');
  }

  private get betweenMyAccountsTab(): Locator {
    return this.repository.locator('TRANSFER.BETWEEN_OWN_ACCOUNTS_CARD');
  }

  private get toAccountPickerTrigger(): Locator {
    // From is always pre-selected, so only the To selector shows this placeholder.
    return this.repository.locator('TRANSFER.BMA_TO_ACCOUNT_PLACEHOLDER').first();
  }

  private get fromAccountCardNumber(): Locator {
    return this.repository.locator('TRANSFER.BMA_FROM_ACCOUNT_CARD_NUMBER');
  }

  private get pickerCardNumbers(): Locator {
    return this.repository.locator('TRANSFER.BMA_PICKER_CARD_NUMBER');
  }

  private get pickerAccountCards(): Locator {
    // Picker rows are li.account-card elements exposed with role="option".
    return this.page.getByRole('option');
  }

  private get fromAccountInfoCard(): Locator {
    // Both To and From fields render a bma-account-info card; only cards with a
    // selected account carry a full account number.
    return this.repository
      .locator('TRANSFER.BMA_FROM_ACCOUNT_INFO')
      .filter({ hasText: ACCOUNT_NUMBER_FILTER_PATTERN })
      .first();
  }

  private get amountInput(): Locator {
    return this.repository.locator('TRANSFER.BMA_AMOUNT_INPUT');
  }

  private get confirmButton(): Locator {
    return this.repository.locator('TRANSFER.BMA_CONFIRM_BUTTON');
  }

  private get summaryConfirmButton(): Locator {
    // The hidden main form stays in the DOM behind the summary overlay, so take
    // the first CONFIRM in DOM order — the same element every green run clicked.
    return this.page.getByRole('button', { name: /^confirm$/i }).first();
  }

  private get successBanner(): Locator {
    return this.repository.locator('TRANSFER.BMA_SUCCESS_BADGE');
  }

  private get loadingSpinner(): Locator {
    return this.page.getByText(/loading|please wait/i);
  }

  private get cancelTransferButton(): Locator {
    return this.page.getByRole('button', { name: /^cancel$/i });
  }

  private get instantScheduleButton(): Locator {
    return this.page.getByRole('button', { name: /instant/i });
  }

  private get scheduleExtraFields(): Locator {
    // Date/frequency inputs that only appear when SCHEDULE or RECURRING is selected.
    return this.page.getByLabel(/scheduled date|start date|end date|frequency|repeat/i);
  }

  private get transferErrorMessage(): Locator {
    return this.page.getByText(
      /insufficient.*(?:balance|funds)|amount.*(?:exceed|invalid|below.*min)|minimum.*amount/i
    );
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async navigateToTransferBetweenOwnAccounts(testInfo?: TestInfo): Promise<void> {
    await this.transferMenuLink.click();
    // The BetweenMyAccounts tab is the stable page-load indicator: the breadcrumb
    // heading "Transfer" has a back-arrow icon that disrupts a direct text match.
    await expect(this.betweenMyAccountsTab).toBeVisible();
    await this.captureTransferScreenScreenshot('transfer-screen-opened', testInfo);
    // Tab is auto-selected on load, but an explicit click guarantees the form renders.
    await this.betweenMyAccountsTab.click();
    await expect(
      this.toAccountPickerTrigger,
      'Between My Accounts form did not display the To Account selector.'
    ).toBeVisible();
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async openFromAccountDropdown(testInfo?: TestInfo): Promise<void> {
    // "From" is a pre-selected account card, not a label-based combobox.
    // Clicking the card's account-number span opens the From picker dialog.
    await this.waitForLoadingToFinish();
    await expect(this.fromAccountCardNumber.first()).toBeVisible();
    await this.fromAccountCardNumber.first().click();
    await this.waitForPickerCards();
    await this.captureTransferScreenScreenshot('from-account-dropdown-opened', testInfo);
  }

  async getFromAccountOptions(): Promise<string[]> {
    return this.getPickerCardTexts();
  }

  async selectFirstFromAccount(): Promise<string> {
    const firstOption = this.pickerAccountCards.first();
    await expect(firstOption).toBeVisible();
    const selectedText = normalizeWhitespace(await firstOption.innerText());
    await firstOption.click();
    return selectedText;
  }

  async openToAccountDropdown(testInfo?: TestInfo): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.toAccountPickerTrigger).toBeVisible();
    await this.toAccountPickerTrigger.click();
    await this.waitForPickerCards();
    await this.captureTransferScreenScreenshot('to-account-dropdown-opened', testInfo);
  }

  async getToAccountOptions(): Promise<string[]> {
    return this.getPickerCardTexts();
  }

  async getSelectedFromAccountText(): Promise<string> {
    const fromCardText = await this.readFromAccountCardText();
    if (fromCardText && CURRENCY_CODE_PATTERN.test(fromCardText)) return fromCardText;
    // Recovery: the Min/Max hint always carries the From account's currency
    // when the card itself has not finished rendering.
    return this.page.getByText(/Min:/i).first().innerText().catch(() => '');
  }

  async selectToAccount(fromAccountText: string): Promise<string> {
    const fromCurrency = extractCurrencyCode(fromAccountText) ?? '';
    const fromAccountNumber = extractAccountNumber(await this.readFromAccountCardText()) ?? '';

    await this.waitForLoadingToFinish();
    await this.toAccountPickerTrigger.click();
    await this.waitForPickerCards();

    const targetAccountNumber = await this.findPickerAccountWithCurrency(fromCurrency, fromAccountNumber);

    if (!targetAccountNumber) {
      throw new Error(
        `selectToAccount: No To Account found with currency "${fromCurrency}" ` +
          `different from From account "${fromAccountNumber}". ` +
          `The user may have only one ${fromCurrency} account, or the picker was empty.`
      );
    }

    // Clicking the number span bubbles to the parent clickable card container.
    await this.pickerCardNumbers.filter({ hasText: targetAccountNumber }).click();
    await this.waitForLoadingToFinish();
    return targetAccountNumber;
  }

  async enterAmount(amount: string | number): Promise<void> {
    await this.amountInput.clear();
    await this.amountInput.fill(String(amount));
  }

  async clickConfirm(): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.confirmButton).toBeEnabled();
    await this.confirmButton.click();
    await this.waitForLoadingToFinish();
  }

  async clickConfirmOnSummary(): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.summaryConfirmButton).toBeEnabled();
    await this.summaryConfirmButton.click();
    await this.waitForLoadingToFinish();
  }

  async getFromAccountBalance(): Promise<number> {
    const cardText = await this.getSelectedFromAccountText();
    const balance = extractAmount(cardText);
    if (balance === null) throw new Error(`Cannot parse balance from From account card: "${cardText}"`);
    return balance;
  }

  async getSelectedFromAccountNumber(): Promise<string> {
    return extractAccountNumber(await this.getSelectedFromAccountText()) ?? '';
  }

  async changeFromAccount(accountNumber: string): Promise<void> {
    await this.waitForLoadingToFinish();
    await this.fromAccountCardNumber.first().click();
    await this.waitForPickerCards();
    await this.pickerCardNumbers.filter({ hasText: accountNumber }).first().click();
    await this.waitForLoadingToFinish();
  }

  async selectInstantSchedule(): Promise<void> {
    await this.instantScheduleButton.click();
    await this.waitForLoadingToFinish();
  }

  async clickCancelTransfer(): Promise<void> {
    // Recovery path: CANCEL is only rendered with the Transfer Summary panel;
    // otherwise browser back-navigation (the "< Transfer" arrow) leaves the form.
    const hasCancel = await this.cancelTransferButton.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasCancel) {
      await this.cancelTransferButton.click();
    } else {
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
    }
    await this.waitForLoadingToFinish();
  }

  async attemptConfirmTransfer(): Promise<void> {
    // For negative-path tests where the Confirm button may legitimately be disabled.
    await this.waitForLoadingToFinish();
    const enabled = await this.confirmButton.isEnabled().catch(() => false);
    if (enabled) {
      await this.confirmButton.click();
      await this.waitForLoadingToFinish();
    }
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async verifyFromAccountEntriesHaveRequiredDetails(options: string[]): Promise<void> {
    expect(
      options.length,
      'From Account dropdown should contain at least one account entry.'
    ).toBeGreaterThan(0);

    for (const optionText of options) {
      expect(optionText, 'Account option should not be empty.').not.toEqual('');
      expect(
        optionText,
        `Account option should include an account number (masked or full): ${optionText}`
      ).toMatch(MASKED_OR_FULL_ACCOUNT_PATTERN);
      expect(
        optionText,
        `Account option should include account type text: ${optionText}`
      ).toMatch(ACCOUNT_TYPE_PATTERN);
      expect(
        optionText,
        `Account option should include available balance/amount: ${optionText}`
      ).toMatch(BALANCE_WITH_CURRENCY_PATTERN);
    }
  }

  async assertSummaryFromAccount(fromAccountText: string): Promise<void> {
    const accountNumber = extractAccountNumber(fromAccountText) ?? fromAccountText;
    // Scoped to the review span — the hidden form's account-number span stays in
    // the DOM while the summary overlay renders, so a page-wide text match collides.
    await expect(
      this.repository
        .locator('TRANSFER.BMA_REVIEW_ACCOUNT_NUMBER')
        .filter({ hasText: accountNumber })
    ).toBeVisible();
  }

  async assertSummaryAmount(expectedAmount: string): Promise<void> {
    await expect(this.page.getByText(new RegExp(escapeRegExp(String(expectedAmount))))).toBeVisible();
  }

  async assertTransferSuccessful(): Promise<void> {
    // Posting can take up to a minute on UAT — deliberately above the default.
    await expect(this.successBanner).toBeVisible({ timeout: 60_000 });
  }

  async assertToAccountExcludesSourceAccount(fromAccountNumber: string): Promise<void> {
    const toOptions = await this.getToAccountOptions();
    expect(
      toOptions.some(option => option.includes(fromAccountNumber)),
      `To Account picker must not include source account "${fromAccountNumber}".\nOptions: ${JSON.stringify(toOptions)}`
    ).toBe(false);
  }

  async verifyToAccountEntriesHaveRequiredDetails(options: string[]): Promise<void> {
    expect(options.length, 'To Account picker must list at least one account.').toBeGreaterThan(0);
    for (const option of options) {
      expect(option, `To entry must show an account number: "${option}"`).toMatch(UNMASKED_ACCOUNT_PATTERN);
      expect(option, `To entry must show an account type: "${option}"`).toMatch(ACCOUNT_TYPE_PATTERN);
      expect(option, `To entry must show a currency: "${option}"`).toMatch(CURRENCY_CODE_PATTERN);
    }
  }

  async assertAllFromEntriesShowCurrency(): Promise<string[]> {
    const options = await this.getFromAccountOptions();
    const foundCurrencies = new Set<string>();
    for (const option of options) {
      expect(
        option,
        `Every From Account entry must carry a currency code: "${option}"`
      ).toMatch(CURRENCY_CODE_PATTERN);
      const currency = extractCurrencyCode(option);
      if (currency) foundCurrencies.add(currency);
    }
    return [...foundCurrencies];
  }

  async assertToAccountIsReset(): Promise<void> {
    await expect(this.toAccountPickerTrigger).toBeVisible();
  }

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

  async assertInsufficientFundsError(): Promise<void> {
    // Portals typically block over-balance transfers via one of two mechanisms:
    // 1. Confirm button disabled (inline pre-validation) — no click needed.
    // 2. Error message text shown after clicking Confirm.
    // Check either condition within a short window.
    await expect(async () => {
      const confirmBlocked = await this.confirmButton.isDisabled().catch(() => false);
      const errorShowing = await this.transferErrorMessage.isVisible({ timeout: 500 }).catch(() => false);
      expect(
        confirmBlocked || errorShowing,
        'Confirm must be disabled or error text must appear for over-balance amount'
      ).toBe(true);
    }).toPass({ timeout: 10_000, intervals: [500] });
  }

  async assertConfirmBlockedByMinimumAmount(): Promise<void> {
    // Deliberately short: inline validation reacts immediately to the typed amount.
    await expect(
      this.confirmButton,
      'Confirm button must be disabled when amount is below the minimum.'
    ).toBeDisabled({ timeout: 5_000 });
  }

  async assertNegativeAmountRejected(): Promise<void> {
    const raw = await this.amountInput.inputValue();
    const numeric = parseFloat(raw.replace(/[^\d.-]/g, '')) || 0;
    if (numeric >= 0) return;
    // Input accepted a negative value — the form must surface a validation error.
    await expect(this.transferErrorMessage).toBeVisible({ timeout: 10_000 });
  }

  async assertInstantScheduleShowsNoExtraFields(): Promise<void> {
    await expect(this.scheduleExtraFields).not.toBeVisible();
  }

  async assertNavigatedBackFromTransfer(): Promise<void> {
    // After cancel, either the form is reset (To = "Select Account") or we navigated away.
    // Either outcome proves no transaction was committed.
    await expect(async () => {
      const toReset = await this.toAccountPickerTrigger.isVisible({ timeout: 500 }).catch(() => false);
      const formGone = !(await this.confirmButton.isVisible({ timeout: 500 }).catch(() => false));
      expect(
        toReset || formGone,
        'After cancel: form must be gone OR To Account must be reset to "Select Account"'
      ).toBe(true);
    }).toPass({ timeout: 15_000, intervals: [1_000] });
  }

  // ─── Helpers (private) ───────────────────────────────────────────────────────

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

  /**
   * Waits for the open picker dialog to render its account cards.
   * Waits for DOM-attachment (not visibility): the picker slides in from the
   * top, so cards sit at the viewport edge during the animation and would fail
   * Playwright's visibility check.
   */
  private async waitForPickerCards(): Promise<void> {
    await this.pickerCardNumbers.first().waitFor({ state: 'attached', timeout: 15_000 });
  }

  /**
   * Returns the full text ("TYPE 0220… EGP 1,234.56") of the pre-populated From
   * account card, or '' when the card has not populated yet — callers recover
   * via the Min/Max hint, which carries the currency as soon as the form loads.
   */
  private async readFromAccountCardText(): Promise<string> {
    const cardPopulated = await this.fromAccountInfoCard
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (!cardPopulated) return '';
    return normalizeWhitespace(await this.fromAccountInfoCard.innerText());
  }

  /**
   * Returns the account number of the first open-picker card that shows the
   * given currency and differs from the excluded (From) account, or null when
   * no such account exists.
   */
  private async findPickerAccountWithCurrency(
    currency: string,
    excludedAccountNumber: string
  ): Promise<string | null> {
    for (const cardText of await this.getPickerCardTexts()) {
      const accountNumber = extractAccountNumber(cardText);
      if (!accountNumber || accountNumber === excludedAccountNumber) continue;
      if (extractCurrencyCode(cardText) === currency) return accountNumber;
    }
    return null;
  }

  /** Returns the normalized text of every account card in the open picker dialog. */
  private async getPickerCardTexts(): Promise<string[]> {
    const cardTexts = await this.pickerAccountCards.allInnerTexts();
    return cardTexts.map(normalizeWhitespace).filter((text) => text.length > 0);
  }

  private async waitForLoadingToFinish(): Promise<void> {
    // Best-effort: the loading text may legitimately never appear, and a
    // persistent background widget must not fail the calling action.
    await this.loadingSpinner
      .first()
      .waitFor({ state: 'hidden', timeout: 20_000 })
      .catch(() => {});
  }
}
