import { expect, type Locator, type Page } from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/accounts/transactionNormalization.js';

export type AccountSelectorOption = {
  readonly optionIndex: number;
  readonly accountIdentity: string;
  readonly name: string;
  readonly currency: string;
  readonly value: string;
  readonly selected: boolean;
  readonly enabled: boolean;
};

export class AccountSelectorComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  private get root(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.SELECTOR.ROOT');
  }

  private get trigger(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.SELECTOR.TRIGGER', { scope: this.root });
  }

  private get position(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.SELECTOR.POSITION', { scope: this.root });
  }

  private get selectedProductName(): Locator {
    return this.repository.locator(
      'PORTAL.ACCOUNTS.SELECTOR.SELECTED_PRODUCT_NAME',
      { scope: this.root }
    );
  }

  private get options(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.SELECTOR.OPTIONS', { scope: this.root });
  }

  async openAndReadOptions(): Promise<readonly AccountSelectorOption[]> {
    await expect(this.root).toHaveCount(1);
    await expect(this.root).toBeVisible();
    await expect(this.position).toHaveText(/^\s*\d+\s+of\s+\d+\s*$/i);
    await expect(this.trigger).toBeVisible();
    if (!(await this.trigger.isEnabled())) {
      throw new Error('TEST_DATA: account selector requires at least two selectable accounts.');
    }
    await this.trigger.click();
    await expect(this.options.first()).toBeVisible();

    const count = await this.options.count();
    const values: AccountSelectorOption[] = [];
    for (let index = 0; index < count; index += 1) {
      const option = this.options.nth(index);
      const identity = this.repository.locator(
        'PORTAL.ACCOUNTS.SELECTOR.OPTION.IDENTITY',
        { scope: option }
      );
      const name = this.repository.locator(
        'PORTAL.ACCOUNTS.SELECTOR.OPTION.NAME',
        { scope: option }
      );
      const currency = this.repository.locator(
        'PORTAL.ACCOUNTS.SELECTOR.OPTION.CURRENCY',
        { scope: option }
      );
      const displayedValue = this.repository.locator(
        'PORTAL.ACCOUNTS.SELECTOR.OPTION.VALUE',
        { scope: option }
      );
      values.push({
        optionIndex: index,
        accountIdentity: normalizeText(await identity.innerText()),
        name: normalizeText(await name.innerText()),
        currency: normalizeText(await currency.innerText()),
        value: normalizeText(await displayedValue.innerText()),
        selected: (await option.getAttribute('aria-selected')) === 'true',
        enabled: (await option.getAttribute('aria-disabled')) !== 'true',
      });
    }
    return values;
  }

  async select(option: AccountSelectorOption): Promise<void> {
    const liveOption = this.options.nth(option.optionIndex);
    await expect(liveOption).toBeVisible();
    await expect(liveOption).toBeEnabled();
    const identity = this.repository.locator(
      'PORTAL.ACCOUNTS.SELECTOR.OPTION.IDENTITY',
      { scope: liveOption }
    );
    await expect(identity).toHaveText(option.accountIdentity);
    await liveOption.click();
    await expect(this.options.first()).toBeHidden();
  }

  async getSelectedProductName(): Promise<string> {
    await expect(this.selectedProductName).toBeVisible();
    return normalizeText(await this.selectedProductName.innerText());
  }
}
