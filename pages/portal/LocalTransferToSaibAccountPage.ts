import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { ENV, ROUTES, portalHashRoute } from '../../config/resources';
import path from 'node:path';
import { LocatorRepository } from '../../utils/locatorRepository';
import {
  MASKED_IDENTIFIER_PATTERN,
  egpAmountPattern,
  escapeRegExp,
  normalizeWhitespace,
  parseAccountOption,
} from '../../utils/textParsers';

export class LocalTransferToSaibAccountPage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  async navigateToLocalTransferToSaibAccount(testInfo?: TestInfo) {
    console.log('[LocalTransferToSaibAccountPage] Navigating to Transfer Money page.');
    await this.repository.locator('TRANSFER.SIDEBAR_TRANSFERS_LINK').click();
    const localTransfersCard = this.repository.locator('TRANSFER.LOCAL_TRANSFERS_CARD');

    // Recovery: the sidebar click intermittently lands on a stale route —
    // navigating straight to the transfer-money hash route renders the cards.
    const transferCardsVisible = await localTransfersCard
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!transferCardsVisible) {
      console.log('[LocalTransferToSaibAccountPage] Transfer cards did not render after sidebar click. Navigating to transfer-money route.');
      await this.page.goto(this.transferMoneyUrl());
      await expect(localTransfersCard).toBeVisible();
    }

    console.log('[LocalTransferToSaibAccountPage] Selecting Local Transfers.');
    await this.waitForDialogMaskToClear();
    await localTransfersCard.click();
    await this.repository.validateVisible('TRANSFER.TO_ANOTHER_SAIB_ACCOUNT_CARD');

    console.log('[LocalTransferToSaibAccountPage] Selecting To Another SAIB Account.');
    await this.waitForDialogMaskToClear();
    await this.repository.locator('TRANSFER.TO_ANOTHER_SAIB_ACCOUNT_CARD').click();

    // Recovery: same stale-route behavior on the card click — fall back to the
    // walkthrough-validated direct route.
    const routedToSaibTransfer = await this.page
      .waitForURL(/\/transfers\/to-another-saib-account/i, { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!routedToSaibTransfer) {
      console.log('[LocalTransferToSaibAccountPage] SAIB transfer route did not load after card click. Navigating directly to validated route.');
      await this.page.goto(this.toAnotherSaibAccountUrl());
    }

    await expect(this.page).toHaveURL(/\/transfers\/to-another-saib-account/i);
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
      const parsed = parseAccountOption(normalizeWhitespace(await row.innerText()));
      const currencyMatches = !options.currency || parsed.currency === options.currency.toUpperCase();
      const minimumMatches = options.minimumBalance === undefined || parsed.balance >= options.minimumBalance;
      const maximumMatches = options.maximumBalance === undefined || parsed.balance <= options.maximumBalance;

      if (currencyMatches && minimumMatches && maximumMatches) {
        await row.click();
        await this.waitForDialogMaskToClear({ throwOnFailure: true });
        await expect(this.repository.locator('TRANSFER.SAIB_FROM_ACCOUNT_SELECTOR')).toContainText(parsed.maskedAccount);
        return parsed;
      }
    }

    throw new Error(`No source account matched ${JSON.stringify(options)}.`);
  }

  async openBeneficiarySelector(testInfo?: TestInfo) {
    await this.repository.locator('TRANSFER.SAIB_BENEFICIARY_SELECTOR').click();
    await expect(this.beneficiaryOptions().first()).toBeVisible();
    await this.captureTransferScreenScreenshot('local-transfer-saib-beneficiary-selector-opened', testInfo);
  }

  async getBeneficiaryOptions() {
    return this.visibleTexts(this.beneficiaryOptions());
  }

  async selectFirstBeneficiary(options: { preferredText?: RegExp } = {}) {
    await this.repository.locator('TRANSFER.SAIB_BENEFICIARY_SELECTOR').click();
    const dialog = this.beneficiaryDialog();
    await expect(dialog).toBeVisible();

    const option = await this.firstBeneficiaryChoice(dialog, options.preferredText);
    const optionText = normalizeWhitespace(await option.innerText());
    await option.click();
    await dialog.getByRole('button', { name: /^done$/i }).click();
    await this.waitForDialogMaskToClear({ throwOnFailure: true });
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

    // The PrimeNG select renders a dedicated trigger button only in some form
    // states; fall back to clicking the combobox itself.
    if (await dropdownTrigger.isVisible().catch(() => false)) {
      await dropdownTrigger.click();
    } else {
      await this.repository.locator('TRANSFER.SAIB_REASON_SELECTOR').click();
    }

    // Recovery: options load lazily and the first click occasionally closes an
    // empty panel — one re-open renders the list.
    const salaryTransferOption = this.page.getByText(/^Salary Transfer$/i);
    const optionLoaded = await salaryTransferOption
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!optionLoaded) {
      await dropdownTrigger.click().catch(() => this.repository.locator('TRANSFER.SAIB_REASON_SELECTOR').click());
      await expect(salaryTransferOption).toBeVisible();
    }

    await this.captureTransferScreenScreenshot('local-transfer-saib-reason-selector-opened', testInfo);
  }

  async getReasonOptions() {
    const texts = await this.reasonOptions().allTextContents();
    // Data-dependent: some tenants render the open panel without role=option
    // entries while Salary Transfer is visible as plain text.
    if (texts.length === 0 && await this.page.getByText(/^Salary Transfer$/i).isVisible().catch(() => false)) {
      return ['Salary Transfer'];
    }

    return texts.map(normalizeWhitespace).filter(Boolean);
  }

  async selectReason(reason: string) {
    await this.page.getByText(new RegExp(`^${escapeRegExp(reason)}$`, 'i')).click();
    await expect(this.repository.locator('TRANSFER.SAIB_SUMMARY_CARD')).toContainText(new RegExp(reason, 'i'));
  }

  async selectScheduleType(type: 'Instant' | 'Schedule' | 'Recurring') {
    await this.page.getByRole('button', { name: new RegExp(type, 'i') }).click();
    await expect(this.repository.locator('TRANSFER.SAIB_SUMMARY_CARD')).toContainText(new RegExp(`Transfer Type\\s+${type}`, 'i'));
  }

  async acceptTerms() {
    const terms = this.repository.locator('TRANSFER.SAIB_TERMS_CHECKBOX');
    // force: the PrimeNG checkbox input is visually covered by its styled box.
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
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    await this.waitForLoadingToFinish();
    await expect(this.reviewOrOtpIndicator()).toBeVisible();
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
    ).toMatch(MASKED_IDENTIFIER_PATTERN);
  }

  async expectMultipleBeneficiaryOptions() {
    const options = await this.getBeneficiaryOptions();

    expect(options.length, `Beneficiary selector should list multiple saved beneficiaries. Options: ${options.join(' | ')}`).toBeGreaterThan(1);
    expect(new Set(options).size, 'Beneficiary rows should be separate entries, not duplicate text from one row.').toBeGreaterThan(1);
  }

  async expectProjectedBalanceMatches(sourceBalance: number, transferAmount: number) {
    await expect(this.page.locator('.after-card')).toContainText(
      egpAmountPattern(sourceBalance - transferAmount)
    );
  }

  async expectInsufficientBalanceBlocked() {
    // Either blocking mechanism is a pass: Continue disabled (inline
    // pre-validation) or a visible balance validation message.
    const continueButton = this.repository.locator('TRANSFER.SAIB_CONTINUE_BUTTON');
    const validationMessage = this.page.getByText(/insufficient|exceed|available balance|not enough|greater than/i);
    const hasValidation = await validationMessage.isVisible({ timeout: 5_000 }).catch(() => false);
    const isDisabled = await continueButton.isDisabled().catch(() => false);

    expect(
      hasValidation || isDisabled,
      'Amount above displayed balance should either keep Continue disabled or show a balance validation message.'
    ).toBe(true);
  }

  async expectCurrencyMismatchBlocked() {
    // Either blocking mechanism is a pass, same as expectInsufficientBalanceBlocked.
    const continueButton = this.repository.locator('TRANSFER.SAIB_CONTINUE_BUTTON');
    const validationMessage = this.page.getByText(/currency|same currency|mismatch|not allowed|invalid/i);
    await this.waitForLoadingToFinish();
    const hasValidation = await validationMessage.isVisible({ timeout: 5_000 }).catch(() => false);
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
    // Form recalculation can block the UI for a while on UAT — above default.
    await expect(this.repository.locator('PORTAL.COMMON.BLOCK_UI')).toBeHidden({ timeout: 60_000 });
  }

  private async waitForDialogMaskToClear(options: { throwOnFailure?: boolean } = {}) {
    const mask = this.repository.locator('PORTAL.COMMON.DIALOG_MASK');
    if (options.throwOnFailure) {
      await expect(mask).toBeHidden();
      return;
    }
    // Best-effort variant for navigation steps where no dialog is expected.
    await mask.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
  }

  private quickAmountButton(label: string): Locator {
    return this.repository.locator('TRANSFER.SAIB_QUICK_AMOUNT_BUTTONS').filter({ hasText: label }).first();
  }

  private beneficiaryOptions() {
    return this.repository.locator('TRANSFER.ACCOUNT_DIALOG_ROW');
  }

  private beneficiaryDialog() {
    return this.page.getByRole('dialog', { name: /select beneficiary/i });
  }

  private selectedBeneficiary() {
    return this.repository.locator('TRANSFER.SAIB_SELECTED_BENEFICIARY').first();
  }

  private async firstBeneficiaryChoice(dialog: Locator, preferredText: RegExp = /exist account/i) {
    // Prefer the beneficiary matching the flow's currency hint; fall back to
    // any masked SAIB account row when no row matches the hint.
    const rows = dialog.locator('.dialog-account-item');
    const preferred = rows.filter({ hasText: preferredText }).first();
    if (await preferred.isVisible().catch(() => false)) {
      return preferred;
    }
    return rows.filter({ hasText: /SAIB\s+\*{2,}\d+/i }).first();
  }

  private reviewOrOtpIndicator() {
    return this.page
      .getByText(/review|confirm|otp|one time password|verification|summary/i)
      .first();
  }

  private transferMoneyUrl() {
    // Fall back to the current page URL when PORTAL_LOGIN_URL is not configured.
    return portalHashRoute(ROUTES.portal.transferHub, ENV.portal.loginUrl || this.page.url());
  }

  private toAnotherSaibAccountUrl() {
    return portalHashRoute(ROUTES.portal.toAnotherSaibAccount, ENV.portal.loginUrl || this.page.url());
  }

  private reasonOptions() {
    return this.page.getByRole('option');
  }

  private async visibleTexts(locator: Locator) {
    // evaluateAll is required: rows can be attached but display:none while the
    // dialog animates, and only rendered rows count as picker options.
    const texts = await locator.evaluateAll((elements) =>
      elements
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
        })
        .map((element) => element.textContent ?? '')
    );

    return texts.map(normalizeWhitespace).filter(Boolean);
  }
}
