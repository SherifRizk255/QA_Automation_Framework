import { expect, type Locator } from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/accounts/transactionNormalization.js';

export type TransactionRowUi = {
  readonly rowIndex: number;
  readonly reference: string;
  readonly description: string;
  readonly postingDate: string;
  readonly amount: string;
};

export class TransactionListComponent {
  constructor(private readonly repository: LocatorRepository) {}

  private get root(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.TRANSACTIONS.ROOT');
  }

  private get rows(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.TRANSACTIONS.ROWS', { scope: this.root });
  }

  async readRows(): Promise<readonly TransactionRowUi[]> {
    await expect(this.root).toBeVisible();
    const count = await this.rows.count();
    const values: TransactionRowUi[] = [];
    for (let index = 0; index < count; index += 1) {
      const row = this.rows.nth(index);
      const cells = this.repository.locator(
        'PORTAL.ACCOUNTS.TRANSACTIONS.ROW.CELLS',
        { scope: row }
      );
      const cellCount = await cells.count();
      if (cellCount < 4) {
        throw new Error(`Transaction row ${index} must expose at least four data cells.`);
      }
      values.push({
        rowIndex: index,
        reference: normalizeText(await cells.nth(0).innerText()),
        description: normalizeText(await cells.nth(1).innerText()),
        postingDate: normalizeText(await cells.nth(2).innerText()),
        amount: normalizeText(await cells.nth(3).innerText()),
      });
    }
    return values;
  }

  async openDetails(transaction: TransactionRowUi): Promise<void> {
    const row = this.rows.nth(transaction.rowIndex);
    const cells = this.repository.locator(
      'PORTAL.ACCOUNTS.TRANSACTIONS.ROW.CELLS',
      { scope: row }
    );
    await expect(cells.nth(0)).toHaveText(transaction.reference);
    const details = this.repository.locator(
      'PORTAL.ACCOUNTS.TRANSACTIONS.ROW.DETAILS',
      { scope: row }
    );
    await expect(details).toBeVisible();
    await expect(details).toBeEnabled();
    await details.click();
  }
}
