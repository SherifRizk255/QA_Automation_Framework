import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { ENV, ROUTES, portalHashRoute } from '../../config/resources';
import path from 'node:path';
import { LocatorRepository } from '../../utils/locatorRepository';

export class LocalTransferToSaibAccountPage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  async navigateToLocalTransferToSaibAccount(testInfo?: TestInfo) {
    console.log('[LocalTransferToSaibAccountPage] Navigating to Transfer Money page.');
    await this.repository.locator('TRANSFER.SIDEBAR_TRANSFERS_LINK').click();
    const localTransfersCard = this.repository.locator('TRANSFER.LOCAL_TRANSFERS_CARD');
    const transferCardsVisible = await localTransfersCard
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (!transferCardsVisible) {
      console.log('[LocalTransferToSaibAccountPage] Transfer cards did not render after sidebar click. Navigating to transfer-money route.');
      await this.page.goto(this.transferMoneyUrl());
      await expect(localTransfersCard).toBeVisible({ timeout: 30000 });
    }

    console.log('[LocalTransferToSaibAccountPage] Selecting Local Transfers.');
    await expect(this.page.locator('.p-dialog-mask')).toBeHidden({ timeout: 30000 }).catch(() => {});
    await localTransfersCard.click();
    await this.repository.validateVisible('TRANSFER.TO_ANOTHER_SAIB_ACCOUNT_CARD');

    console.log('[LocalTransferToSaibAccountPage] Selecting To Another SAIB Account.');
    await expect(this.page.locator('.p-dialog-mask')).toBeHidden({ timeout: 30000 }).catch(() => {});
    await this.repository.locator('TRANSFER.TO_ANOTHER_SAIB_ACCOUNT_CARD').click();
    const routedToSaibTransfer = await this.page
      .waitForURL(/\/transfers\/to-another-saib-account/i, { timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (!routedToSaibTransfer) {
      console.log('[LocalTransferToSaibAccountPage] SAIB transfer route did not load after card click. Navigating directly to validated route.');
      await this.page.goto(this.toAnotherSaibAccountUrl());
    }

    await expect(this.page).toHaveURL(/\/transfers\/to-another-saib-account/i, { timeout: 30000 });
    await this.repository.validateVisible('TRANSFER.SAIB_TRANSFER_FORM');

    await this.captureTransferScreenScreenshot('local-transfer-to-saib-account-opened', testInfo);
  }

  async expectFormDisplayed() {
    await expect(this.repository.locator('TRANSFER.SAIB_FROM_ACCOUNT_SELECTOR')).toBeVisible();
    await expect(this.repository.locator('TRANSFER.SAIB_BENEFICIARY_SELECTOR')).toBeVisible();
    await expect(this.repository.locator('TRANSFER.SAIB_AMOUNT_INPUT')).toBeVisible();
    await expect(this.repository.locator('TRANSFER.SAIB_REASON_SELECTOR')).toBeVisible();
    await expect(this.repository.locator('TRANSFER.SAIB_SUMMARY_CARD')).toBeVisible();
    await expect(this.repository.locator('TRANSFER.SAIB_TERMS_CHECKBOX')).toBeVisible();
    await expect(this.repository.locator('TRANSFER.SAIB_CONTINUE_BUTTON')).toBeDisabled();
    await expect(this.repository.locator('TRANSFER.SAIB_CANCEL_BUTTON')).toBeVisible();
  }

  async openFromAccountSelector(testInfo?: TestInfo) {
    await this.repository.locator('TRANSFER.SAIB_FROM_ACCOUNT_SELECTOR').click();
    await expect(this.repository.locator('TRANSFER.ACCOUNT_DIALOG_ROW').first()).toBeVisible();
    await this.captureTransferScreenScreenshot('local-transfer-saib-from-account-selector-opened', testInfo);
  }

  async getFromAccountOptions() {
    return this.visibleTexts(this.repository.locator('TRANSFER.ACCOUNT_DIALOG_ROW'));
  }

  async selectSourceAccount(options: { currency?: string; minimumBalance?: number; maximumBalance?: number } = {}) {
    await this.repository.locator('TRANSFER.SAIB_FROM_ACCOUNT_SELECTOR').click();
    await expect(this.repository.locator('TRANSFER.ACCOUNT_DIALOG_ROW').first()).toBeVisible();

    const rows = this.repository.locator('TRANSFER.ACCOUNT_DIALOG_ROW');
    const count = await rows.count();

    for (let index = 0; index < count; index += 1) {
      const row = rows.nth(index);
      const text = this.normalizeText(await row.innerText());
      const parsed = this.parseAccountOption(text);
      const currencyMatches = !options.currency || parsed.currency === options.currency.toUpperCase();
      const minimumMatches = options.minimumBalance === undefined || parsed.balance >= options.minimumBalance;
      const maximumMatches = options.maximumBalance === undefined || parsed.balance <= options.maximumBalance;

      if (currencyMatches && minimumMatches && maximumMatches) {
        await row.click();
        await expect(this.page.locator('.p-dialog-mask')).toBeHidden({ timeout: 30000 });
        await expect(this.repository.locator('TRANSFER.SAIB_FROM_ACCOUNT_SELECTOR')).toContainText(parsed.maskedAccount);
        return parsed;
      }
    }

    throw new Error(`No source account matched ${JSON.stringify(options)}.`);
  }

  async openBeneficiarySelector(testInfo?: TestInfo) {
    await this.repository.locator('TRANSFER.SAIB_BENEFICIARY_SELECTOR').click();
    await expect(this.beneficiaryOptions().first()).toBeVisible({ timeout: 30000 });
    await this.captureTransferScreenScreenshot('local-transfer-saib-beneficiary-selector-opened', testInfo);
  }

  async getBeneficiaryOptions() {
    return this.visibleTexts(this.beneficiaryOptions());
  }

  async selectFirstBeneficiary(options: { preferredText?: RegExp } = {}) {
    await this.repository.locator('TRANSFER.SAIB_BENEFICIARY_SELECTOR').click();
    const dialog = this.beneficiaryDialog();
    await expect(dialog).toBeVisible({ timeout: 30000 });

    const option = await this.firstBeneficiaryChoice(dialog, options.preferredText);
    const optionText = this.normalizeText(await option.innerText());
    await option.click();
    await dialog.getByRole('button', { name: /^done$/i }).click();
    await expect(this.page.locator('.p-dialog-mask')).toBeHidden({ timeout: 30000 });
    await expect(this.selectedBeneficiary()).not.toContainText(/select beneficiary/i);

    return optionText;
  }

  async openAddNewBeneficiary(testInfo?: TestInfo) {
    await this.repository.locator('TRANSFER.SAIB_ADD_NEW_BENEFICIARY_LINK').click();
    await expect(this.repository.locator('TRANSFER.SAIB_ADD_BENEFICIARY_DIALOG')).toBeVisible();
    await this.captureTransferScreenScreenshot('local-transfer-saib-add-new-beneficiary-opened', testInfo);
  }

  async expectAddNewBeneficiaryDialogLockedToAnotherSaibAccount() {
    const dialog = this.repository.locator('TRANSFER.SAIB_ADD_BENEFICIARY_DIALOG');

    await expect(dialog.getByText(/beneficiary type/i)).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: /another saib/i })).toBeDisabled();
    await expect(dialog.getByRole('combobox', { name: /account number/i })).toBeDisabled();
    await expect(dialog.locator('input[formcontrolname="NickName"]')).toBeVisible();
    await expect(dialog.locator('input[formcontrolname="AccountNumber"]')).toBeVisible();
    await expect(dialog.getByRole('button', { name: /add beneficiary/i })).toBeDisabled();
  }

  async fillTransferAmount(amount: string) {
    const amountInput = this.repository.locator('TRANSFER.SAIB_AMOUNT_INPUT');
    await amountInput.fill(amount);
    await expect(amountInput).toHaveValue(amount);
  }

  async clickQuickAmount(label: string) {
    await this.quickAmountButton(label).click();
  }

  async getTransferAmountValue() {
    return this.repository.locator('TRANSFER.SAIB_AMOUNT_INPUT').inputValue();
  }

  async expectAmountReflectedInSummary(amountPattern: RegExp) {
    await expect(this.repository.locator('TRANSFER.SAIB_SUMMARY_CARD')).toContainText(amountPattern);
  }

  async expectAmountLimitsDisplayed() {
    await expect(this.page.getByText(/min:\s*egp\s*1\.00/i)).toBeVisible();
    await expect(this.page.getByText(/max:\s*egp\s*50,000,000\.00/i)).toBeVisible();
  }

  async openReasonSelector(testInfo?: TestInfo) {
    const reasonField = this.page.locator('.field-group').filter({ hasText: /Reason of Transfer/i });
    const dropdownTrigger = reasonField.getByRole('button', { name: /dropdown trigger/i });

    if (await dropdownTrigger.isVisible().catch(() => false)) {
      await dropdownTrigger.click();
    } else {
      await this.repository.locator('TRANSFER.SAIB_REASON_SELECTOR').click();
    }

    const salaryTransferOption = this.page.getByText(/^Salary Transfer$/i);
    const optionLoaded = await salaryTransferOption
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (!optionLoaded) {
      await dropdownTrigger.click().catch(() => this.repository.locator('TRANSFER.SAIB_REASON_SELECTOR').click());
      await expect(salaryTransferOption).toBeVisible({ timeout: 30000 });
    }

    await this.captureTransferScreenScreenshot('local-transfer-saib-reason-selector-opened', testInfo);
  }

  async getReasonOptions() {
    const texts = await this.reasonOptions().allTextContents();
    if (texts.length === 0 && await this.page.getByText(/^Salary Transfer$/i).isVisible().catch(() => false)) {
      return ['Salary Transfer'];
    }

    return texts.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async selectReason(reason: string) {
    await this.page.getByText(new RegExp(`^${this.escapeRegex(reason)}$`, 'i')).click();
    await expect(this.repository.locator('TRANSFER.SAIB_SUMMARY_CARD')).toContainText(new RegExp(reason, 'i'));
  }

  async selectScheduleType(type: 'Instant' | 'Schedule' | 'Recurring') {
    await this.page.getByRole('button', { name: new RegExp(type, 'i') }).click();
    await expect(this.repository.locator('TRANSFER.SAIB_SUMMARY_CARD')).toContainText(new RegExp(`Transfer Type\\s+${type}`, 'i'));
  }

  async acceptTerms() {
    const terms = this.repository.locator('TRANSFER.SAIB_TERMS_CHECKBOX');
    await terms.check({ force: true });
    await expect(terms).toBeChecked();
  }

  async completeSafeTransferForm(options: {
    amount?: string;
    sourceCurrency?: string;
    minimumBalance?: number;
    maximumBalance?: number;
    scheduleType?: 'Instant' | 'Schedule' | 'Recurring';
    reason?: string;
  } = {}) {
    const amount = options.amount ?? '50';
    const sourceAccount = await this.selectSourceAccount({
      currency: options.sourceCurrency ?? 'EGP',
      minimumBalance: options.minimumBalance,
      maximumBalance: options.maximumBalance,
    });
    const beneficiaryText = await this.selectFirstBeneficiary({
      preferredText: options.sourceCurrency === 'USD' ? /IBAN|USD/i : /exist account/i,
    });

    await this.fillTransferAmount(amount);
    await this.openReasonSelector();
    await this.selectReason(options.reason ?? 'Salary Transfer');

    if (options.scheduleType) {
      await this.selectScheduleType(options.scheduleType);
    }

    await this.acceptTerms();

    return {
      amount: Number(amount.replace(/,/g, '')),
      sourceAccount,
      beneficiaryText,
    };
  }

  async continueToReview(testInfo?: TestInfo) {
    const continueButton = this.repository.locator('TRANSFER.SAIB_CONTINUE_BUTTON');
    await this.waitForLoadingToFinish();
    await expect(continueButton).toBeEnabled({ timeout: 30000 });
    await continueButton.click();
    await this.waitForLoadingToFinish();
    await expect(this.reviewOrOtpIndicator()).toBeVisible({ timeout: 30000 });
    await this.captureTransferScreenScreenshot('local-transfer-saib-review-or-otp-opened', testInfo);
  }

  async expectReviewContains(pattern: RegExp) {
    await expect(this.page.locator('body')).toContainText(pattern);
  }

  async expectMaskedBeneficiaryOption(optionText: string) {
    expect(optionText, `Beneficiary option should not be empty.`).not.toEqual('');
    expect(
      optionText,
      `Beneficiary option should include a partially masked account or card-like identifier: ${optionText}`
    ).toMatch(/(?:\*{2,}|x{2,}|•{2,})\s*\d{2,}|\d{2,}\s*(?:\*{2,}|x{2,}|•{2,})/i);
  }

  async expectMultipleBeneficiaryOptions() {
    const options = await this.getBeneficiaryOptions();

    expect(options.length, `Beneficiary selector should list multiple saved beneficiaries. Options: ${options.join(' | ')}`).toBeGreaterThan(1);
    expect(new Set(options).size, 'Beneficiary rows should be separate entries, not duplicate text from one row.').toBeGreaterThan(1);
  }

  async expectProjectedBalanceMatches(sourceBalance: number, transferAmount: number) {
    const expected = sourceBalance - transferAmount;
    const amountPattern = this.amountPattern(expected);

    await expect(this.page.locator('.after-card')).toContainText(amountPattern);
  }

  async expectInsufficientBalanceBlocked() {
    const continueButton = this.repository.locator('TRANSFER.SAIB_CONTINUE_BUTTON');
    const validationMessage = this.page.getByText(/insufficient|exceed|available balance|not enough|greater than/i);
    const hasValidation = await validationMessage.isVisible({ timeout: 5000 }).catch(() => false);
    const isDisabled = await continueButton.isDisabled().catch(() => false);

    expect(
      hasValidation || isDisabled,
      'Amount above displayed balance should either keep Continue disabled or show a balance validation message.'
    ).toBe(true);
  }

  async expectCurrencyMismatchBlocked() {
    const continueButton = this.repository.locator('TRANSFER.SAIB_CONTINUE_BUTTON');
    const validationMessage = this.page.getByText(/currency|same currency|mismatch|not allowed|invalid/i);
    await this.waitForLoadingToFinish();
    const hasValidation = await validationMessage.isVisible({ timeout: 5000 }).catch(() => false);
    const isDisabled = await continueButton.isDisabled().catch(() => false);

    expect(
      hasValidation || isDisabled,
      'Cross-currency transfer setup should either keep Continue disabled or show a currency validation message.'
    ).toBe(true);
  }

  async captureTransferScreenScreenshot(name: string, testInfo?: TestInfo) {
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

  async waitForLoadingToFinish() {
    await expect(this.page.locator('.p-blockui')).toBeHidden({ timeout: 60000 });
  }

  private quickAmountButton(label: string): Locator {
    return this.repository.locator('TRANSFER.SAIB_QUICK_AMOUNT_BUTTONS').filter({ hasText: label }).first();
  }

  private beneficiaryOptions() {
    return this.page.locator('.beneficiary-item, .beneficiary-row, .dialog-account-item, .p-select-option, [role="option"]');
  }

  private beneficiaryDialog() {
    return this.page.getByRole('dialog', { name: /select beneficiary/i });
  }

  private selectedBeneficiary() {
    return this.page.locator('.beneficiary-selection-list .account-selector.selected').first();
  }

  private async firstBeneficiaryChoice(dialog: Locator, preferredText: RegExp = /exist account/i) {
    const preferred = dialog.locator('.dialog-account-item, .beneficiary-item, .beneficiary-row').filter({ hasText: preferredText }).first();
    const fallback = dialog.locator('.dialog-account-item, .beneficiary-item, .beneficiary-row').filter({ hasText: /SAIB\s+\*{2,}\d+/i }).first();

    if (await preferred.isVisible().catch(() => false)) {
      return preferred;
    }

    return fallback;
  }

  private reviewOrOtpIndicator() {
    return this.page
      .getByText(/review|confirm|otp|one time password|verification|summary/i)
      .or(this.page.locator('.review-card, .confirmation-card, .otp-card, .summary-card'))
      .first();
  }

  private transferMoneyUrl() {
    // Fall back to the current page URL when PORTAL_LOGIN_URL is not configured.
    return portalHashRoute(ROUTES.portal.transferHub, ENV.portal.loginUrl || this.page.url());
  }

  private toAnotherSaibAccountUrl() {
    return portalHashRoute('#/transfers/to-another-saib-account', ENV.portal.loginUrl || this.page.url());
  }

  private reasonOptions() {
    return this.page.getByRole('option').or(this.page.locator('.p-select-option'));
  }

  private async visibleTexts(locator: Locator) {
    const texts = await locator.evaluateAll((elements) =>
      elements
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
        })
        .map((element) => element.textContent ?? '')
    );

    return texts.map((text) => this.normalizeText(text)).filter(Boolean);
  }

  private parseAccountOption(optionText: string) {
    const currency = optionText.match(/\b(EGP|USD|EUR|GBP)\b/i)?.[1].toUpperCase() ?? '';
    const balanceText = optionText.match(/\b(?:EGP|USD|EUR|GBP)\s*([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i)?.[1] ?? '0';
    const maskedAccount = optionText.match(/\d{4}\s*(?:\*{2,}|x{2,}|•{2,})\d{2,}/i)?.[0] ?? optionText.split(/\b(?:EGP|USD|EUR|GBP)\b/i)[0].trim();

    return {
      rawText: optionText,
      maskedAccount,
      currency,
      balance: Number(balanceText.replace(/,/g, '')),
    };
  }

  private amountPattern(amount: number) {
    const escaped = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return new RegExp(`EGP\\s*${this.escapeRegex(escaped)}`, 'i');
  }

  private normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
