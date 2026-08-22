import { expect, type Locator } from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/accounts/transactionNormalization.js';

export type TransactionDetailsUi = {
  readonly amount: string;
  readonly reference: string;
  readonly description: string;
  readonly postingDate: string;
  readonly valueDate: string;
  readonly runningBalance?: string;
  readonly partyName?: string;
  readonly visibleLabels: readonly string[];
};

export class TransactionDetailsComponent {
  constructor(private readonly repository: LocatorRepository) {}

  private get dialog(): Locator {
    return this.repository.locator('PORTAL.ACCOUNTS.TRANSACTION_DETAILS.DIALOG');
  }

  private get amount(): Locator {
    return this.repository.locator(
      'PORTAL.ACCOUNTS.TRANSACTION_DETAILS.AMOUNT',
      { scope: this.dialog }
    );
  }

  private get labels(): Locator {
    return this.repository.locator(
      'PORTAL.ACCOUNTS.TRANSACTION_DETAILS.LABELS',
      { scope: this.dialog }
    );
  }

  private get values(): Locator {
    return this.repository.locator(
      'PORTAL.ACCOUNTS.TRANSACTION_DETAILS.VALUES',
      { scope: this.dialog }
    );
  }

  async read(): Promise<TransactionDetailsUi> {
    await expect(this.dialog).toHaveCount(1);
    await expect(this.dialog).toBeVisible();
    await expect(this.amount).toBeVisible();
    const labels = (await this.labels.allInnerTexts()).map(normalizeText);
    const values = (await this.values.allInnerTexts()).map(normalizeText);
    if (labels.length !== values.length) {
      throw new Error('Transaction details labels and values must have equal counts.');
    }
    const fields = new Map(labels.map((label, index) => [label.toLowerCase(), values[index]]));
    const required = (aliases: readonly string[], field: string): string => {
      for (const alias of aliases) {
        const value = fields.get(alias.toLowerCase());
        if (value !== undefined) return value;
      }
      throw new Error(`APP_UI: transaction details is missing required ${field} field.`);
    };
    const optional = (aliases: readonly string[]): string | undefined => {
      for (const alias of aliases) {
        const value = fields.get(alias.toLowerCase());
        if (value !== undefined) return value;
      }
      return undefined;
    };

    return {
      amount: normalizeText(await this.amount.innerText()),
      reference: required(
        ['Reference No', 'Reference Number', 'Transaction Reference', 'Transaction Reference No.'],
        'Transaction Reference'
      ),
      description: required(['Transaction Name', 'Description'], 'Description'),
      postingDate: required(['Transaction Date', 'Posting Date'], 'Posting Date'),
      valueDate: required(['Value Date'], 'Value Date'),
      runningBalance: optional(['Running Balance', 'Balance']),
      partyName: optional(['Beneficiary Name', 'Payer Name', 'Beneficiary/Payer Name']),
      visibleLabels: labels,
    };
  }
}
