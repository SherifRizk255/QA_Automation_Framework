import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import { BaseComponent } from '../../core/BaseComponent';

export class AccountRowComponent extends BaseComponent {
  
  // ───── Component Configuration ─────

  private readonly supportedCurrencies = ['EGP','USD','EUR','GBP'] as const;

  constructor(page: Page, accountRow: Locator) {
    super(page, accountRow);
  }

  // ───── Row Actions ─────

  async getText(): Promise<string> {
    return (await this.root.innerText()).trim();
  }

  async click(): Promise<void> {
    await this.root.click();
  }

  // ───── Optional Field Discovery ─────

  async findAccountNumber(): Promise<string | undefined> {
    const accountNumberXPath = await this.getAccountNumberXPath();

    if (!accountNumberXPath) {
      return undefined;
    }

    const accountNumber = (
      await this.root
        .locator(accountNumberXPath)
        .innerText()
    ).trim();

    return accountNumber || undefined;
  }

  async findCurrency(): Promise<string | undefined> {
    const currencyXPath =await this.getCurrencyXPath();

    if (!currencyXPath) {
      return undefined;
    }

    const currency = (
      await this.root
        .locator(currencyXPath)
        .innerText()
    )
      .trim()
      .toUpperCase();

    return currency || undefined;
  }

  // ───── Required Field Validation ─────

  async getAccountNumber(): Promise<string> {
    return this.getRequiredFieldText(
      await this.getAccountNumberXPath(),'account number');
  }

  async getAccountType(): Promise<string> {
    return this.getRequiredFieldText(
      await this.getAccountTypeXPath(),'account type');
  }

  async getCurrency(): Promise<string> {
    const currency = await this.getRequiredFieldText(
      await this.getCurrencyXPath(),'supported currency');

    return currency.toUpperCase();
  }

  // ───── Scoped Field Locators ─────

  private async getAccountNumberXPath(): Promise<string | undefined> {
    const accountNumberXPath = 'xpath=.//span[contains(concat(" ", normalize-space(@class), " "), " account-card-number ")]';
    const accountNumberElement = this.root.locator(accountNumberXPath);

    if (await accountNumberElement.isVisible()) {
      return accountNumberXPath;
    }
    return undefined;
  }

  private async getAccountTypeXPath(): Promise<string | undefined> {
    const accountTypeXPath = 'xpath=.//span[contains(concat(" ", normalize-space(@class), " "), " account-card-name ")]';
    const accountTypeElement = this.root.locator(accountTypeXPath);

    if (await accountTypeElement.isVisible()) {
      return accountTypeXPath;
    }
    return undefined;
  }

  private async getCurrencyXPath(): Promise<string | undefined> {
    for (const currency of this.supportedCurrencies) {
      const currencyXPath = `xpath=.//span[normalize-space()="${currency}"]`;
      const currencyElement = this.root.locator(currencyXPath);

      if (await currencyElement.isVisible()) {
        return currencyXPath;
      }
    }
    return undefined;
  }

  // ───── Field Reading Helpers ─────

  private async getRequiredFieldText(fieldXPath: string | undefined, fieldName: string): Promise<string> {
    const rowText = await this.getText();

    if (!fieldXPath) {
      throw new Error(`Account row does not contain a visible ${fieldName}: "${rowText}"`);
    }

    const fieldElement =this.root.locator(fieldXPath);
    await expect(fieldElement).toBeVisible();
    const fieldText = (await fieldElement.innerText()).trim();
    expect(fieldText, `Account row must show a non-empty ${fieldName}: "${rowText}"`).not.toBe('');
    return fieldText;
  }
}
