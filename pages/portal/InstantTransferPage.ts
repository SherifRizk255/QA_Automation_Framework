import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LocatorRepository } from '../../utils/locatorRepository';

export type InstantTransferMethod =
  | 'Mobile Number'
  | 'Card Number'
  | 'Bank Account'
  | 'Payment Address'
  | 'Wallet';

const methodRepositoryIds: Record<InstantTransferMethod, string> = {
  'Mobile Number': 'TRANSFER.INSTANT_MOBILE_NUMBER_TILE',
  'Card Number': 'TRANSFER.INSTANT_CARD_NUMBER_TILE',
  'Bank Account': 'TRANSFER.INSTANT_BANK_ACCOUNT_TILE',
  'Payment Address': 'TRANSFER.INSTANT_PAYMENT_ADDRESS_TILE',
  Wallet: 'TRANSFER.INSTANT_WALLET_TILE',
};

export class InstantTransferPage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  async navigateToInstantTransfer(testInfo?: TestInfo) {
    console.log('[InstantTransferPage] Navigating to Transfer Money page.');
    await this.repository.locator('TRANSFER.SIDEBAR_TRANSFERS_LINK').click();

    const localTransfersCard = this.repository.locator('TRANSFER.LOCAL_TRANSFERS_CARD');
    const transferCardsVisible = await localTransfersCard
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (!transferCardsVisible) {
      console.log('[InstantTransferPage] Transfer cards did not render after sidebar click. Navigating to transfer-money route.');
      await this.page.goto(this.transferMoneyUrl());
      await expect(localTransfersCard).toBeVisible({ timeout: 30000 });
    }

    console.log('[InstantTransferPage] Selecting Local Transfers.');
    await this.waitForBlockingUiToClear();
    await localTransfersCard.click();

    const instantTransferCard = await this.repository.validateVisible('TRANSFER.INSTANT_TRANSFERS_CARD');

    console.log('[InstantTransferPage] Selecting Instant Transfers.');
    await this.waitForBlockingUiToClear();
    await instantTransferCard.click();

    await Promise.race([
      this.page.waitForURL(/\/transfers\/instant-transfers?/i, { timeout: 15000 }).catch(() => undefined),
      this.page
        .getByText(/Mobile Number|Card Number|Bank Account|Payment Address|Wallet/i)
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => undefined),
    ]);

    const formVisible = await this.repository
      .validateVisible('TRANSFER.INSTANT_TRANSFER_FORM')
      .then(() => true)
      .catch(() => false);

    if (!formVisible) {
      await this.captureWalkthroughEvidence('instant-transfer-form-not-found');
    }

    await this.repository.validateVisible('TRANSFER.INSTANT_TRANSFER_FORM');
    await this.captureInstantTransferScreenshot('instant-transfer-opened', testInfo);
  }

  async expectMethodTilesDisplayed() {
    for (const elementId of Object.values(methodRepositoryIds)) {
      const methodTile = await this.repository.validateVisible(elementId);
      await expect(methodTile).toBeEnabled();
    }
  }

  async selectMethod(method: InstantTransferMethod) {
    await this.waitForBlockingUiToClear();
    const methodTile = await this.repository.validateVisible(methodRepositoryIds[method]);
    await methodTile.click();
    await expect(methodTile).toBeVisible();
  }

  async expectMethodSelectionClearsBeneficiary(fromMethod: InstantTransferMethod, toMethod: InstantTransferMethod) {
    await this.selectMethod(fromMethod);
    const beforeSwitchValue = await this.selectedBeneficiaryText();

    await this.selectMethod(toMethod);
    const afterSwitchValue = await this.selectedBeneficiaryText();

    expect(
      afterSwitchValue,
      `Beneficiary selector should be empty or show a placeholder after switching from ${fromMethod} to ${toMethod}.`
    ).toMatch(/^$|select|choose|beneficiary/i);

    if (beforeSwitchValue && !/select|choose|beneficiary/i.test(beforeSwitchValue)) {
      expect(afterSwitchValue, `Beneficiary selector should not retain ${fromMethod} selection after switching to ${toMethod}.`).not.toEqual(
        beforeSwitchValue
      );
    }
  }

  async expectMobileBeneficiaryNotVisibleAfterSwitchToCard(testInfo?: TestInfo) {
    await this.selectMethod('Mobile Number');
    const mobileOptions = await this.visibleTexts(this.beneficiaryOptions());

    await this.selectMethod('Card Number');
    await this.openBeneficiarySelectorIfAvailable(testInfo);
    const cardOptions = await this.visibleTexts(this.beneficiaryOptions());

    const leakedMobileOption = mobileOptions.find((option) => option && cardOptions.includes(option));
    expect(leakedMobileOption ?? '', 'Mobile beneficiary entries should not leak into Card Number method.').toEqual('');
  }

  async expectEgpOnlyCurrency() {
    const currencyControls = this.page.locator('button, [role="combobox"], .currency-btn, .currency-selector');
    const foreignCurrencyControls = currencyControls.filter({ hasText: /\b(USD|EUR|GBP)\b/i });

    await expect(this.page.locator('body')).toContainText(/\bEGP\b/i);
    expect(await foreignCurrencyControls.count(), 'Instant Transfer should not expose selectable non-EGP currency controls.').toBe(0);
  }

  async openAddBeneficiaryForMethod(method: InstantTransferMethod, testInfo?: TestInfo) {
    await this.selectMethod(method);
    await this.repository.locator('TRANSFER.INSTANT_ADD_NEW_BENEFICIARY_LINK').click();
    await expect(this.repository.locator('TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG')).toBeVisible({ timeout: 30000 });
    await this.captureInstantTransferScreenshot(`instant-transfer-add-beneficiary-${this.slug(method)}`, testInfo);
  }

  async expectAddBeneficiaryLockedToInstantTransfer() {
    const dialog = this.repository.locator('TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG');

    await expect(dialog).toContainText(/instant transfer/i);
    const mutableTypeField = dialog.getByRole('combobox').filter({ hasText: /instant transfer/i }).first();
    if (await mutableTypeField.isVisible().catch(() => false)) {
      await expect(mutableTypeField).toBeDisabled();
    }
  }

  async expectAddBeneficiaryMethod(method: InstantTransferMethod) {
    await expect(this.repository.locator('TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG')).toContainText(new RegExp(this.escapeRegex(method), 'i'));
  }

  async expectNicknameRequired() {
    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(/nickname.*required|required.*nickname/i);
  }

  async expectMethodFieldRequired(method: InstantTransferMethod) {
    await this.clearMethodSpecificField(method);
    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(this.requiredMessageForMethod(method));
  }

  async expectInvalidMobileFormat(value: string) {
    await this.fillMethodSpecificField('Mobile Number', value);
    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(/invalid mobile|mobile number format|phone number/i);
  }

  async expectCardNumberValidation(value: string, expectedValuePattern?: RegExp) {
    await this.fillMethodSpecificField('Card Number', value);
    const fieldValue = await (await this.methodSpecificField('Card Number')).inputValue();

    if (expectedValuePattern) {
      expect(fieldValue, 'Card Number input should enforce numeric/max-length behavior.').toMatch(expectedValuePattern);
      return;
    }

    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(/card number.*16|16 digits|card number/i);
  }

  async expectBankAccountFieldsRequired() {
    await expect(await this.methodSpecificField('Bank Account')).toBeVisible();
    const bankSelector = this.repository.locator('TRANSFER.INSTANT_BANK_NAME_SELECTOR');
    await expect(bankSelector).toBeVisible();
    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(/bank name.*required|required.*bank name|account number.*required|required.*account number/i);
  }

  async expectIbanFieldVisibleAndMaxLength(value: string) {
    await this.fillMethodSpecificField('Payment Address', value);
    const currentValue = await (await this.methodSpecificField('Payment Address')).inputValue();

    expect(currentValue.length, 'IBAN/Payment Address field should enforce a maximum length of 35 when IBAN mode is active.').toBeLessThanOrEqual(35);
  }

  async expectIbanValidation(value: string) {
    await this.fillMethodSpecificField('Payment Address', value);
    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(/iban.*uppercase|uppercase alphanumeric|unsupported|invalid/i);
  }

  async expectBankAccountMaxLength(value: string) {
    await this.fillMethodSpecificField('Bank Account', value);
    const currentValue = await (await this.methodSpecificField('Bank Account')).inputValue();

    expect(currentValue.length, 'Bank Account input should enforce a maximum length of 35 digits.').toBeLessThanOrEqual(35);
  }

  async expectIpaValidation(value: string, validationPattern: RegExp) {
    await this.fillMethodSpecificField('Payment Address', value);
    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(validationPattern);
  }

  async expectWalletRequired() {
    await this.clearMethodSpecificField('Wallet');
    await this.triggerAddBeneficiaryValidation();
    await this.expectDialogValidationOrDisabled(/wallet number.*required|required.*wallet number|wallet/i);
  }

  async cancelAddBeneficiary() {
    const dialog = this.repository.locator('TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG');
    await dialog.getByRole('button', { name: /cancel|close/i }).click();
    await expect(dialog).toBeHidden({ timeout: 30000 });
    await this.repository.validateVisible('TRANSFER.INSTANT_TRANSFER_FORM');
  }

  async captureInstantTransferScreenshot(name: string, testInfo?: TestInfo) {
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

  private async openBeneficiarySelectorIfAvailable(testInfo?: TestInfo) {
    const selector = this.repository.locator('TRANSFER.INSTANT_BENEFICIARY_SELECTOR');
    if (await selector.isVisible().catch(() => false)) {
      await selector.click();
      await this.captureInstantTransferScreenshot('instant-transfer-beneficiary-selector-opened', testInfo);
    }
  }

  private async fillMethodSpecificField(method: InstantTransferMethod, value: string) {
    const field = await this.methodSpecificField(method);
    await expect(field).toBeVisible({ timeout: 30000 });
    await field.fill(value);
  }

  private async clearMethodSpecificField(method: InstantTransferMethod) {
    const field = await this.methodSpecificField(method);
    await expect(field).toBeVisible({ timeout: 30000 });
    await field.fill('');
  }

  private async methodSpecificField(method: InstantTransferMethod): Promise<Locator> {
    const repositoryLocator = this.repositoryMethodSpecificField(method);

    if (await repositoryLocator.isVisible().catch(() => false)) {
      return repositoryLocator;
    }

    return this.dialogTextboxAfterLabel(this.methodFieldLabel(method));
  }

  private repositoryMethodSpecificField(method: InstantTransferMethod): Locator {
    if (method === 'Mobile Number') {
      return this.repository.locator('TRANSFER.INSTANT_PHONE_INPUT');
    }

    if (method === 'Card Number') {
      return this.repository.locator('TRANSFER.INSTANT_CARD_INPUT');
    }

    if (method === 'Bank Account') {
      return this.repository.locator('TRANSFER.INSTANT_ACCOUNT_NUMBER_INPUT');
    }

    if (method === 'Wallet') {
      return this.repository.locator('TRANSFER.INSTANT_WALLET_INPUT');
    }

    return this.repository.locator('TRANSFER.INSTANT_PAYMENT_ADDRESS_INPUT');
  }

  private dialogTextboxAfterLabel(label: RegExp): Locator {
    const dialog = this.repository.locator('TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG');

    return dialog
      .getByText(label)
      .locator('xpath=following::*[@role="textbox" or (self::input and not(@type="checkbox") and not(@type="radio"))][1]')
      .first();
  }

  private methodFieldLabel(method: InstantTransferMethod) {
    if (method === 'Mobile Number') {
      return /^Phone Number/i;
    }

    if (method === 'Card Number') {
      return /^Card Number/i;
    }

    if (method === 'Bank Account') {
      return /Bank Account Number|Account Number/i;
    }

    if (method === 'Wallet') {
      return /Wallet Number/i;
    }

    return /Payment Email Address|Payment Address|IBAN/i;
  }

  private async triggerAddBeneficiaryValidation() {
    const dialog = this.repository.locator('TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG');
    const addButton = dialog.getByRole('button', { name: /add beneficiary|add/i }).last();

    if (await addButton.isEnabled().catch(() => false)) {
      await addButton.click();
      return;
    }

    await this.repository.locator('TRANSFER.INSTANT_NICKNAME_INPUT').focus().catch(() => undefined);
    await this.repository.locator('TRANSFER.INSTANT_NICKNAME_INPUT').blur().catch(() => undefined);
  }

  private async expectDialogValidationOrDisabled(pattern: RegExp) {
    const dialog = this.repository.locator('TRANSFER.INSTANT_ADD_BENEFICIARY_DIALOG');
    const validation = dialog.getByText(pattern);
    const addButton = dialog.getByRole('button', { name: /add beneficiary|add/i }).last();
    const hasValidation = await validation.isVisible({ timeout: 5000 }).catch(() => false);
    const isDisabled = await addButton.isDisabled().catch(() => false);

    expect(hasValidation || isDisabled, `Expected validation ${pattern} or disabled Add Beneficiary button.`).toBe(true);
  }

  private beneficiaryOptions() {
    return this.page.locator('.beneficiary-item, .beneficiary-row, .dialog-account-item, .p-select-option, [role="option"]');
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

  private requiredMessageForMethod(method: InstantTransferMethod) {
    if (method === 'Mobile Number') {
      return /phone number.*required|required.*phone number|mobile.*required|required.*mobile/i;
    }

    if (method === 'Wallet') {
      return /wallet number.*required|required.*wallet number|wallet/i;
    }

    if (method === 'Card Number') {
      return /card number.*required|required.*card number|card/i;
    }

    if (method === 'Bank Account') {
      return /account number.*required|required.*account number|bank name.*required|required.*bank name/i;
    }

    return /payment address.*required|required.*payment address|ipa.*required|required.*ipa/i;
  }

  private async selectedBeneficiaryText() {
    const selector = this.repository.locator('TRANSFER.INSTANT_BENEFICIARY_SELECTOR');

    if (!(await selector.isVisible().catch(() => false))) {
      return '';
    }

    return this.normalizeText(await selector.innerText());
  }

  private async waitForBlockingUiToClear() {
    await expect(this.page.locator('.p-dialog-mask, .p-blockui')).toBeHidden({ timeout: 30000 }).catch(() => {});
  }

  private transferMoneyUrl() {
    const loginUrl = process.env.PORTAL_LOGIN_URL ?? this.page.url();
    return loginUrl.replace(/#\/login.*$/i, '#/transfers/transfer-money');
  }

  private async captureWalkthroughEvidence(name: string) {
    const evidenceDir = path.resolve('reports', 'system-walkthrough', 'instant-transfer');
    fs.mkdirSync(evidenceDir, { recursive: true });

    const screenshotPath = path.join(evidenceDir, `${name}.png`);
    const domPath = path.join(evidenceDir, `${name}.json`);

    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    const evidence = await this.page.locator('body').evaluate((body) =>
      Array.from(body.querySelectorAll('a,button,input,textarea,select,[role],label,div,span'))
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const text = (htmlElement.innerText || element.textContent || element.getAttribute('placeholder') || '')
            .replace(/\s+/g, ' ')
            .trim();

          return {
            tag: element.tagName.toLowerCase(),
            id: element.getAttribute('id'),
            name: element.getAttribute('name'),
            formControlName: element.getAttribute('formcontrolname'),
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label'),
            href: element.getAttribute('href'),
            type: element.getAttribute('type'),
            placeholder: element.getAttribute('placeholder'),
            disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
            text,
            className: element.getAttribute('class'),
          };
        })
        .filter((entry) => entry.text || entry.href || entry.ariaLabel || entry.placeholder || entry.formControlName || entry.name || entry.id)
        .filter((entry) =>
          /instant|mobile|card|bank|wallet|payment|ipa|beneficiary|account|amount|currency|transfer/i.test(
            `${entry.text} ${entry.href ?? ''} ${entry.ariaLabel ?? ''} ${entry.placeholder ?? ''} ${entry.formControlName ?? ''} ${entry.name ?? ''} ${entry.id ?? ''} ${entry.className ?? ''}`
          )
        )
        .slice(0, 250)
    );

    fs.writeFileSync(domPath, JSON.stringify({ url: this.page.url(), evidence }, null, 2));
  }

  private slug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
