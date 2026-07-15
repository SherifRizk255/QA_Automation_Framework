import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';

export class TransferBetweenOwnAccountsPage {
  
  constructor(readonly page: Page) {
    this.page = page;
  }

  // ─── Locators ──────────────────────────────────────────────────────────────

  private get transferMenuLink(): Locator {
    return this.page
      .getByRole('link', { name: 'Transfers', exact: true })
      .or(this.page.locator('[href="#/transfers"]'))
      .first();
  }

  private get betweenMyAccountsTab(): Locator {
    return this.page.getByRole('button', { name: /between my accounts/i });
  }

  private get toAccountPickerTrigger(): Locator {
    return this.page
      .getByText('Select Account', { exact: true })
      .first()
      .or(this.dropdownByLabel(/to account/i))
      .or(this.page.getByText(/select destination account/i));
  }

  private get fromAccountDropdown(): Locator {
    return this.dropdownByLabel(/from account/i).or(
      this.page.getByText(/select source account/i)
    );
  }

  private get dropdownOptions(): Locator {
    return this.page
      .getByRole('option')
      .or(
        this.page.locator(
          '.p-select-option, .p-dropdown-item, [role="listbox"] li, .dialog-account-item'
        )
      )
      .or(
        this.page.locator(
          '[role="dialog"] [class*="account"], .account-list-item, .account-option'
        )
      );
  }

  private get amountInput(): Locator {
    return this.page
      .locator('input.transfer-amount-input')
      .or(this.page.locator('input[placeholder="0.00"]'))
      .first();
  }

  private get confirmButton(): Locator {
    return this.page
      .locator('.transfer-main-confirm-btn')
      .or(this.page.locator('.continue-btn, .transfer-btn'))
      .or(
        this.page.getByRole('button', {
          name: /^(confirm|continue|transfer|proceed|next)$/i,
        })
      )
      .first();
  }

  private get summaryConfirmButton(): Locator {
    return this.page
      .getByRole('button', { name: /^confirm$/i })
      .or(this.page.getByRole('button', { name: /confirm transfer/i }))
      .first();
  }

  private get successBanner(): Locator {
    // span.success-badge is the confirmed success indicator on this portal.
    // The broad [class*="success"] fallback was removed — it matched the entire
    // p-dialog.transfer-success-dialog container, causing a strict-mode violation.
    return this.page
      .locator('span.success-badge')
      .or(
        this.page.getByText(
          /transfer successful|transaction successful|successfully submitted|successfully completed/i
        )
      );
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
    return this.page
      .getByLabel(/scheduled date|start date|end date|frequency|repeat/i)
      .or(this.page.locator('[placeholder*="date" i], [formcontrolname*="frequency" i]').first());
  }

  private get transferErrorMessage(): Locator {
    return this.page.getByText(
      /insufficient.*(?:balance|funds)|amount.*(?:exceed|invalid|below.*min)|minimum.*amount/i
    );
  }

  private get toAccountResetPlaceholder(): Locator {
    return this.page.getByText('Select Account', { exact: true }).first();
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigateToTransferBetweenOwnAccounts(testInfo?: TestInfo): Promise<void> {
    await this.transferMenuLink.click();
    // The BetweenMyAccounts tab is the stable page-load indicator: the breadcrumb
    // heading "Transfer" has a back-arrow icon that disrupts a direct text match.
    await expect(this.betweenMyAccountsTab).toBeVisible({ timeout: 20_000 });
    await this.captureTransferScreenScreenshot('transfer-screen-opened', testInfo);
    // Tab is auto-selected on load, but an explicit click guarantees the form renders.
    await this.betweenMyAccountsTab.click();
    await expect(
      this.toAccountPickerTrigger,
      'Between My Accounts form did not display the To Account selector.'
    ).toBeVisible({ timeout: 15_000 });
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async openFromAccountDropdown(testInfo?: TestInfo): Promise<void> {
    // "From" is a pre-selected account card, not a label-based combobox.
    // Clicking span.bma-account-number (inside the card) opens the From picker dialog.
    // Use waitForFunction (DOM-presence, not viewport-visibility) — picker slides in from the top
    // so entries may be at the viewport edge during animation, failing Playwright's visibility check.
    await this.waitForLoadingToFinish();
    await expect(this.page.locator('span.bma-account-number').first()).toBeVisible({ timeout: 10_000 });
    await this.page.locator('span.bma-account-number').first().click();
    await this.page.waitForFunction(
      () =>
        document.querySelectorAll('span.account-card-number').length >= 1 ||
        document.querySelectorAll('span.bma-account-number').length >= 2,
      null,
      { timeout: 15_000 }
    );
    await this.captureTransferScreenScreenshot('from-account-dropdown-opened', testInfo);
  }

  async getFromAccountOptions(): Promise<string[]> {
    return this.getPickerCardTexts();
  }

  async selectFirstFromAccount(): Promise<string> {
    const firstOption = this.dropdownOptions.first();
    await expect(firstOption).toBeVisible();
    const selectedText = this.normalizeText(await firstOption.innerText());
    await firstOption.click();
    return selectedText;
  }

  async openToAccountDropdown(testInfo?: TestInfo): Promise<void> {
    // The To picker opens a dialog whose entries use span.account-card-number.
    // Use waitForFunction (DOM-presence) — picker slides in from the top and entries may
    // be at the viewport edge during animation, failing Playwright's toBeVisible check.
    await this.waitForLoadingToFinish();
    await expect(this.toAccountPickerTrigger).toBeVisible();
    await this.toAccountPickerTrigger.click();
    await this.page.waitForFunction(
      () => document.querySelectorAll('span.account-card-number').length >= 1,
      null,
      { timeout: 15_000 }
    );
    await this.captureTransferScreenScreenshot('to-account-dropdown-opened', testInfo);
  }

  async getToAccountOptions(): Promise<string[]> {
    return this.getPickerCardTexts();
  }

  async getSelectedFromAccountText(): Promise<string> {
    // Walk from span.bma-account-number up to the nearest ancestor whose innerText
    // contains both the account number and a currency code — that element is the
    // pre-populated From account card in the main form.
    const fromCardText = await this.page.evaluate(() => {
      const bmaSpan = document.querySelector('span.bma-account-number') as HTMLElement | null;
      if (!bmaSpan) return '';
      let el = bmaSpan.parentElement;
      while (el && el !== document.body) {
        const text = el.innerText.trim();
        if (/\b0\d{9,}\b/.test(text) && /\b(EGP|USD|EUR|GBP)\b/i.test(text)) return text;
        el = el.parentElement;
      }
      return bmaSpan.textContent?.trim() ?? '';
    });
    if (fromCardText && /EGP|USD|EUR|GBP/i.test(fromCardText)) return fromCardText;
    // Fallback: the Min/Max hint always carries the From account's currency.
    return this.page.getByText(/Min:/i).first().innerText().catch(() => '');
  }

  async selectToAccount(fromAccountText: string): Promise<string> {
    const fromCurrency =
      fromAccountText.match(/\b(EGP|USD|EUR|GBP)\b/i)?.[1]?.toUpperCase() ?? '';
    // Read the From account number directly from the rendered form before the picker opens.
    const formText = await this.page
      .locator('main, [role="main"], body')
      .first()
      .innerText()
      .catch(() => '');
    const fromAccountNumber = formText.match(/\b0\d{9,}\b/)?.[0] ?? '';

    await this.waitForLoadingToFinish();
    await this.toAccountPickerTrigger.click();

    // Wait until the picker is open: at least one account number different from the
    // From account must appear (picker cards are not pre-rendered in the DOM).
    await this.page.waitForFunction(
      (fromNum: string) => {
        const unique = new Set(document.body.innerText.match(/\b0\d{9,}\b/g) ?? []);
        unique.delete(fromNum);
        return unique.size >= 1;
      },
      fromAccountNumber,
      { timeout: 15_000 }
    );

    // Walk up from each picker span.account-card-number using innerText (not textContent)
    // so element boundaries become newlines — this creates word boundaries for currency
    // matching. textContent concatenates "0220123456910700EGP" with no boundary.
    const targetAccNum = await this.page.evaluate(
      (params: { fromCurrency: string; fromAccountNumber: string }) => {
        const { fromCurrency, fromAccountNumber } = params;
        const numberSpans = Array.from(
          document.querySelectorAll('span.account-card-number')
        );
        for (const span of numberSpans) {
          const accNum = (span.textContent ?? '').trim();
          if (accNum === fromAccountNumber) continue;
          let ancestor: Element | null = span.parentElement;
          let cardCurrency = '';
          while (ancestor && ancestor !== document.body) {
            const text = (
              (ancestor as HTMLElement).innerText ?? ancestor.textContent ?? ''
            ).trim();
            const match = text.match(/\b(EGP|USD|EUR|GBP)\b/i);
            if (match) {
              cardCurrency = match[1].toUpperCase();
              break;
            }
            ancestor = ancestor.parentElement;
          }
          if (cardCurrency === fromCurrency) return accNum;
        }
        return null;
      },
      { fromCurrency, fromAccountNumber }
    );

    if (!targetAccNum) {
      throw new Error(
        `selectToAccount: No To Account found with currency "${fromCurrency}" ` +
          `different from From account "${fromAccountNumber}". ` +
          `OSerry may have only one ${fromCurrency} account, or the picker was empty.`
      );
    }

    // Clicking the number span bubbles to the parent clickable card container.
    await this.page
      .locator('span.account-card-number', { hasText: targetAccNum })
      .click();
    await this.waitForLoadingToFinish();
    return targetAccNum;
  }

  async enterAmount(amount: string | number): Promise<void> {
    await this.amountInput.clear();
    await this.amountInput.fill(String(amount));
  }

  async clickConfirm(): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.confirmButton).toBeEnabled({ timeout: 30_000 });
    await this.confirmButton.click();
    await this.waitForLoadingToFinish();
  }

  async clickConfirmOnSummary(): Promise<void> {
    await this.waitForLoadingToFinish();
    await expect(this.summaryConfirmButton).toBeEnabled({ timeout: 30_000 });
    await this.summaryConfirmButton.click();
    await this.waitForLoadingToFinish();
  }

  async getFromAccountBalance(): Promise<number> {
    const cardText = await this.getSelectedFromAccountText();
    const match = cardText.match(/[\d,]+\.\d{2}/);
    if (!match) throw new Error(`Cannot parse balance from From account card: "${cardText}"`);
    return parseFloat(match[0].replace(/,/g, ''));
  }

  async getSelectedFromAccountNumber(): Promise<string> {
    const cardText = await this.getSelectedFromAccountText();
    return cardText.match(/\b0\d{9,}\b/)?.[0] ?? '';
  }

  async changeFromAccount(accountNumber: string): Promise<void> {
    await this.waitForLoadingToFinish();
    await this.page.locator('span.bma-account-number').first().click();
    await this.page.waitForFunction(
      () =>
        document.querySelectorAll('span.account-card-number').length >= 1 ||
        document.querySelectorAll('span.bma-account-number').length >= 2,
      null,
      { timeout: 15_000 }
    );
    await this.page.locator('span.account-card-number', { hasText: accountNumber }).first().click();
    await this.waitForLoadingToFinish();
  }

  async selectInstantSchedule(): Promise<void> {
    await this.instantScheduleButton.click();
    await this.waitForLoadingToFinish();
  }

  async clickCancelTransfer(): Promise<void> {
    // Try the CANCEL button first (visible when Transfer Summary panel is rendered).
    // Fall back to browser back-navigation (the "< Transfer" arrow always present in SPA).
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

  // ─── Assertions ────────────────────────────────────────────────────────────

  async verifyFromAccountEntriesHaveRequiredDetails(options: string[]): Promise<void> {
    // Account number: masked (****1234 or 1234****) OR full unmasked (10+ digit sequence).
    const accountNumberPattern =
      /(?:\*{2,}|•{2,}|x{2,})\s*\d{2,}|(?:\d{2,}\s*(?:\*{2,}|•{2,}|x{2,}))|\b\d{8,}\b/i;
    const accountTypePattern =
      /\b(current|saving|savings|investment|account|overdraft|deposit|trst|adv|intr)\b/i;
    const balancePattern =
      /\b[A-Z]{3}\s*[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*[A-Z]{3}\b/i;

    expect(
      options.length,
      'From Account dropdown should contain at least one account entry.'
    ).toBeGreaterThan(0);

    for (const optionText of options) {
      expect(optionText, 'Account option should not be empty.').not.toEqual('');
      expect(
        optionText,
        `Account option should include an account number (masked or full): ${optionText}`
      ).toMatch(accountNumberPattern);
      expect(
        optionText,
        `Account option should include account type text: ${optionText}`
      ).toMatch(accountTypePattern);
      expect(
        optionText,
        `Account option should include available balance/amount: ${optionText}`
      ).toMatch(balancePattern);
    }
  }

  async assertSummaryFromAccount(fromAccountText: string): Promise<void> {
    const accountNumber = fromAccountText.match(/\b0\d{9,}\b/)?.[0] ?? fromAccountText;
    // Scope to span.review-account-number to avoid a strict-mode collision: the hidden
    // form's span.bma-account-number stays in the DOM while the summary overlay renders.
    await expect(
      this.page
        .locator('span.review-account-number')
        .filter({ hasText: accountNumber })
        .or(
          this.page
            .locator('cubic-transfer-review')
            .getByText(accountNumber, { exact: false })
        )
    ).toBeVisible({ timeout: 30_000 });
  }

  async assertSummaryAmount(expectedAmount: string): Promise<void> {
    const escaped = String(expectedAmount).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(this.page.getByText(new RegExp(escaped))).toBeVisible({
      timeout: 30_000,
    });
  }

  async assertTransferSuccessful(): Promise<void> {
    await expect(this.successBanner).toBeVisible({ timeout: 60_000 });
  }

  async assertToAccountExcludesSourceAccount(fromAccountNumber: string): Promise<void> {
    const toOptions = await this.getToAccountOptions();
    expect(
      toOptions.some(opt => opt.includes(fromAccountNumber)),
      `To Account picker must not include source account "${fromAccountNumber}".\nOptions: ${JSON.stringify(toOptions)}`
    ).toBe(false);
  }

  async verifyToAccountEntriesHaveRequiredDetails(options: string[]): Promise<void> {
    const accountNumberPattern = /\b0\d{9,}\b/;
    const accountTypePattern = /\b(current|saving|savings|investment|account|overdraft|deposit|trst|adv|intr)\b/i;
    const currencyPattern = /\b(EGP|USD|EUR|GBP)\b/i;
    expect(options.length, 'To Account picker must list at least one account.').toBeGreaterThan(0);
    for (const option of options) {
      expect(option, `To entry must show an account number: "${option}"`).toMatch(accountNumberPattern);
      expect(option, `To entry must show an account type: "${option}"`).toMatch(accountTypePattern);
      expect(option, `To entry must show a currency: "${option}"`).toMatch(currencyPattern);
    }
  }

  async assertAllFromEntriesShowCurrency(): Promise<string[]> {
    const options = await this.getFromAccountOptions();
    const foundCurrencies = new Set<string>();
    for (const option of options) {
      expect(
        option,
        `Every From Account entry must carry a currency code: "${option}"`
      ).toMatch(/\b(EGP|USD|EUR|GBP)\b/i);
      const match = option.match(/\b(EGP|USD|EUR|GBP)\b/i);
      if (match) foundCurrencies.add(match[1].toUpperCase());
    }
    return [...foundCurrencies];
  }

  async assertToAccountIsReset(): Promise<void> {
    await expect(this.toAccountResetPlaceholder).toBeVisible({ timeout: 10_000 });
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

// ─── Helpers ───────────────────────────────────────────────────────────────

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

  private async getPickerCardTexts(): Promise<string[]> {
    // To picker entries use span.account-card-number; From picker may use span.bma-account-number
    // (multiple when open). Walk up from each number span to the nearest full-card ancestor.
    return this.page.evaluate(() => {
      const cardSpans: HTMLElement[] =
        document.querySelectorAll('span.account-card-number').length >= 1
          ? Array.from(document.querySelectorAll<HTMLElement>('span.account-card-number'))
          : Array.from(document.querySelectorAll<HTMLElement>('span.bma-account-number'));
      return Array.from(cardSpans)
        .map((span) => {
          let el: HTMLElement | null = span as HTMLElement;
          for (let depth = 0; depth < 6 && el; depth++) {
            const { width, height } = el.getBoundingClientRect();
            if (width > 100 && height > 40) return el.innerText.trim();
            el = el.parentElement;
          }
          return (span as HTMLElement).innerText.trim();
        })
        .filter((t) => t.length > 0);
    });
  }

  private async getVisibleDropdownOptionTexts(): Promise<string[]> {
    const texts = await this.dropdownOptions.evaluateAll((options) =>
      options
        .filter((option) => {
          const style = window.getComputedStyle(option);
          const box = option.getBoundingClientRect();
          return (
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            box.width > 0 &&
            box.height > 0
          );
        })
        .map((option) => option.textContent ?? '')
    );
    return texts.map((text) => this.normalizeText(text)).filter(Boolean);
  }

  private dropdownByLabel(labelPattern: RegExp): Locator {
    return this.page
      .getByLabel(labelPattern)
      .or(this.page.getByRole('combobox', { name: labelPattern }))
      .or(
        this.page
          .locator('label')
          .filter({ hasText: labelPattern })
          .locator(
            'xpath=following::*[@role="combobox" or contains(@class, "p-select") or contains(@class, "p-dropdown")][1]'
          )
      );
  }

  private async waitForLoadingToFinish(): Promise<void> {
    await expect(this.loadingSpinner).toBeHidden({ timeout: 20_000 }).catch(() => {});
  }

  private normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
