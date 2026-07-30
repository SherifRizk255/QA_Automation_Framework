import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/dashboard/dashboardDisplayFormatter.js';
import { PortalSwiperCarouselComponent } from '../carousel/PortalSwiperCarouselComponent.js';

export type DashboardLoanUi = {
  readonly rawText: string;
  readonly loanAmount: string;
  readonly outstandingAmount: string;
  readonly progressText: string;
  readonly displayedPaidPercentage: string;
  readonly progressAriaValue?: string;
  readonly progressFillRatio?: number;
};

export class DashboardLoansWidgetComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  private get root(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.LOANS.ROOT'
    );
  }

  private get carousel(): PortalSwiperCarouselComponent {
    return new PortalSwiperCarouselComponent(this.page, this.root);
  }

  private get activeItemRoot(): Locator {
    return this.carousel.getActiveItemRoot();
  }

  private get amounts(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.LOANS.AMOUNTS',
      { scope: this.activeItemRoot }
    );
  }

  private get progressText(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.LOANS.PROGRESS_TEXT',
      { scope: this.activeItemRoot }
    );
  }

  private get progressTrack(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.LOANS.PROGRESS_TRACK',
      { scope: this.activeItemRoot }
    );
  }

  private get progressFill(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.LOANS.PROGRESS_FILL',
      { scope: this.progressTrack }
    );
  }

  async assertReady(): Promise<void> {
    await expect(this.root).toHaveCount(1);
    await expect(this.root).toBeAttached();
    await expect(this.root).toBeVisible();
    expect(normalizeText(await this.root.innerText()).length).toBeGreaterThan(0);
    await this.carousel.assertReady();
  }

  async getActiveLoan(): Promise<DashboardLoanUi> {
    await this.carousel.assertReady();
    await expect(this.amounts).toHaveCount(2);

    // The registered collection contract orders Loan Amount first and
    // Outstanding Amount second within the active loan slide.
    const loanAmount = await this.amounts.nth(0).innerText();
    const outstandingAmount = await this.amounts.nth(1).innerText();
    const rawText = await this.carousel.getActiveItemText();
    await expect(this.progressText).toHaveCount(1);
    await expect(this.progressText).toBeVisible();
    await expect(this.progressTrack).toHaveCount(1);
    await expect(this.progressTrack).toBeVisible();
    const displayedPaidPercentage = normalizeText(
      await this.progressText.innerText()
    );
    const progressAriaValue = normalizeText(
      await this.progressTrack.getAttribute('aria-valuenow') ?? ''
    );

    return {
      rawText,
      loanAmount: normalizeText(loanAmount),
      outstandingAmount: normalizeText(outstandingAmount),
      progressText: displayedPaidPercentage,
      displayedPaidPercentage,
      progressAriaValue: progressAriaValue || undefined,
      progressFillRatio: progressAriaValue
        ? undefined
        : await this.readProgressFillRatio(),
    };
  }

  async moveNext(): Promise<void> {
    await this.carousel.moveNextAndAssertActiveItemChanged();
  }

  async getCurrencyOccurrenceCount(currency: string): Promise<number> {
    return this.currencyValues(currency).count();
  }

  private currencyValues(currency: string): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.LOANS.CURRENCY',
      {
        scope: this.activeItemRoot,
        parameters: { currency },
      }
    );
  }

  private async readProgressFillRatio(): Promise<number> {
    await expect(this.progressFill).toHaveCount(1);
    await expect(this.progressFill).toBeVisible();
    const trackBox = await this.progressTrack.boundingBox();
    const fillBox = await this.progressFill.boundingBox();

    if (!trackBox || trackBox.width <= 0 || !fillBox) {
      throw new Error(
        'The active loan progress track and fill must expose measurable widths.'
      );
    }

    return fillBox.width / trackBox.width * 100;
  }
}
