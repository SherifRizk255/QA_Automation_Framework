import { expect, type Locator } from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeAccountText } from '../../../../utils/portal/accounts/accountDetailsNormalization.js';

export interface AccountDetailsUi {
  readonly accountType: string;
  readonly accountNumber: string;
  readonly iban: string;
  readonly branchName: string;
  readonly status: string;
  readonly openingDate: string;
  readonly availableBalance: string;
  readonly actualBalance: string;
  readonly holdBalance: string;
  readonly currency: string;
  readonly collateralAmount?: string;
}

export class AccountDetailsComponent {
  constructor(private readonly repository: LocatorRepository) {}

  private get detailsRoot(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.DETAILS.ROOT');
  }

  private get detailFields(): Locator {
    return this.repository.locator(
      'PORTAL.ACCOUNTS.DETAILS.FIELDS',
      { scope: this.detailsRoot }
    );
  }

  private get productCard(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.PRODUCT_CARD.ROOT');
  }

  private get balanceItems(): Locator {
    return this.repository.locator(
      'PORTAL.ACCOUNTS.PRODUCT_CARD.BALANCES',
      { scope: this.productCard }
    );
  }

  async read(): Promise<AccountDetailsUi> {
    await expect(this.detailsRoot).toBeVisible();
    await expect(this.productCard).toBeVisible();

    const details = await this.readLabelledValues(
      this.detailFields,
      'PORTAL.ACCOUNTS.DETAILS.FIELD.LABEL',
      'PORTAL.ACCOUNTS.DETAILS.FIELD.VALUE'
    );
    const balances = await this.readBalances();
    const value = (map: Map<string, string>, label: string): string => {
      const result = map.get(label.toLowerCase());
      if (!result) throw new Error(`APP_UI: Account Details is missing ${label}.`);
      return result;
    };

    return {
      accountType: value(details, 'Account type'),
      accountNumber: value(details, 'Account number'),
      iban: value(details, 'IBAN'),
      branchName: value(details, 'Branch'),
      status: value(details, 'Status'),
      openingDate: value(details, 'Opened'),
      availableBalance: value(balances.values, 'Available to Use'),
      actualBalance: value(balances.values, 'Balance'),
      holdBalance: value(balances.values, 'Held amount'),
      currency: balances.currency,
      collateralAmount: details.get('collateral amount'),
    };
  }

  private async readLabelledValues(
    items: Locator,
    labelKey: string,
    valueKey: string
  ): Promise<Map<string, string>> {
    const count = await items.count();
    const values = new Map<string, string>();
    for (let index = 0; index < count; index += 1) {
      const item = items.nth(index);
      const label = this.repository.locator(labelKey, { scope: item });
      const value = this.repository.locator(valueKey, { scope: item });
      values.set(
        normalizeAccountText(await label.innerText()).toLowerCase(),
        normalizeAccountText(await value.innerText())
      );
    }
    return values;
  }

  private async readBalances(): Promise<{
    values: Map<string, string>;
    currency: string;
  }> {
    const count = await this.balanceItems.count();
    const values = new Map<string, string>();
    const currencies = new Set<string>();
    for (let index = 0; index < count; index += 1) {
      const item = this.balanceItems.nth(index);
      const label = this.repository.locator(
        'PORTAL.ACCOUNTS.PRODUCT_CARD.BALANCE.LABEL',
        { scope: item }
      );
      const amount = this.repository.locator(
        'PORTAL.ACCOUNTS.PRODUCT_CARD.BALANCE.VALUE',
        { scope: item }
      );
      const currency = this.repository.locator(
        'PORTAL.ACCOUNTS.PRODUCT_CARD.BALANCE.CURRENCY',
        { scope: item }
      );
      values.set(
        normalizeAccountText(await label.innerText()).toLowerCase(),
        normalizeAccountText(await amount.innerText())
      );
      currencies.add(normalizeAccountText(await currency.innerText()));
    }
    if (currencies.size !== 1) {
      throw new Error('APP_UI: Account Details balances must use one currency.');
    }
    return { values, currency: [...currencies][0] };
  }
}
