import {
  expect,
  type Locator,
} from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/dashboard/dashboardDisplayFormatter.js';

export type DashboardSummaryLabel =
  | 'Net Worth'
  | 'I Have'
  | 'I Owe';

export type DashboardSummaryUiValue = {
  readonly label: DashboardSummaryLabel;
  readonly currency: string;
  readonly displayedValue: string;
};

export class DashboardWelcomeComponent {
  constructor(private readonly repository: LocatorRepository) {}

  private get root(): Locator {
    return this.repository.locator('PORTAL.DASHBOARD.WELCOME.REGION');
  }

  private get heading(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WELCOME.HEADING',
      { scope: this.root }
    );
  }

  private get netWorthSummary(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WELCOME.SUMMARY.NET_WORTH.ITEM',
      { scope: this.root }
    );
  }

  private get netWorthCurrency(): Locator {
    return this.summaryCurrency(this.netWorthSummary);
  }

  private get netWorthValue(): Locator {
    return this.summaryValue(this.netWorthSummary);
  }

  private get iHaveSummary(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WELCOME.SUMMARY.I_HAVE.ITEM',
      { scope: this.root }
    );
  }

  private get iHaveCurrency(): Locator {
    return this.summaryCurrency(this.iHaveSummary);
  }

  private get iHaveValue(): Locator {
    return this.summaryValue(this.iHaveSummary);
  }

  private get iOweSummary(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WELCOME.SUMMARY.I_OWE.ITEM',
      { scope: this.root }
    );
  }

  private get iOweCurrency(): Locator {
    return this.summaryCurrency(this.iOweSummary);
  }

  private get iOweValue(): Locator {
    return this.summaryValue(this.iOweSummary);
  }

  async assertReady(): Promise<void> {
    await expect(this.root).toHaveCount(1);
    await expect(this.root).toBeAttached();
    await expect(this.root).toBeVisible();
    await expect(this.heading).toHaveCount(1);
    await expect(this.heading).toBeVisible();
  }

  async getCustomerName(): Promise<string> {
    await expect(this.heading).toHaveCount(1);
    await expect(this.heading).toBeVisible();
    const headingText = normalizeText(await this.heading.innerText());
    return normalizeText(headingText.replace(/^Welcome,\s*/i, ''));
  }

  async getSummaryValues(): Promise<readonly DashboardSummaryUiValue[]> {
    return [
      await this.readSummary(
        'Net Worth',
        this.netWorthSummary,
        this.netWorthCurrency,
        this.netWorthValue
      ),
      await this.readSummary(
        'I Have',
        this.iHaveSummary,
        this.iHaveCurrency,
        this.iHaveValue
      ),
      await this.readSummary(
        'I Owe',
        this.iOweSummary,
        this.iOweCurrency,
        this.iOweValue
      ),
    ];
  }

  private summaryCurrency(summary: Locator): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WELCOME.SUMMARY.CURRENCY',
      { scope: summary }
    );
  }

  private summaryValue(summary: Locator): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WELCOME.SUMMARY.VALUE',
      { scope: summary }
    );
  }

  private async readSummary(
    label: DashboardSummaryLabel,
    summary: Locator,
    currency: Locator,
    value: Locator
  ): Promise<DashboardSummaryUiValue> {
    await expect(summary, `${label} summary card must be unique.`).toHaveCount(1);
    await expect(currency).toBeVisible();
    await expect(value).toBeVisible();

    return {
      label,
      currency: normalizeText(await currency.innerText()),
      displayedValue: normalizeText(await value.innerText()),
    };
  }
}
