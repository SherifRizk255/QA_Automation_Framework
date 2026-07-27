import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/dashboard/dashboardDisplayFormatter.js';
import { PortalSwiperCarouselComponent } from '../carousel/PortalSwiperCarouselComponent.js';

export type DashboardDepositUi = {
  readonly rawText: string;
  readonly totalAmount: string;
};

export class DashboardDepositsWidgetComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  private get root(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.DEPOSITS.ROOT'
    );
  }

  private get carousel(): PortalSwiperCarouselComponent {
    return new PortalSwiperCarouselComponent(this.page, this.root);
  }

  private get activeItemRoot(): Locator {
    return this.carousel.getActiveItemRoot();
  }

  private get totalAmount(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.DEPOSITS.TOTAL_AMOUNT',
      { scope: this.activeItemRoot }
    );
  }

  async assertReady(): Promise<void> {
    await expect(this.root).toHaveCount(1);
    await expect(this.root).toBeAttached();
    await expect(this.root).toBeVisible();
    expect(normalizeText(await this.root.innerText()).length).toBeGreaterThan(0);
    await this.carousel.assertReady();
  }

  async getActiveDeposit(): Promise<DashboardDepositUi> {
    await this.carousel.assertReady();
    await expect(this.totalAmount).toBeVisible();

    return {
      rawText: await this.carousel.getActiveItemText(),
      totalAmount: normalizeText(await this.totalAmount.innerText()),
    };
  }
}
