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

  private get slides(): Locator {
    return this.repository.locator(
      'PORTAL.COMPONENTS.SWIPER.SLIDES',
      { scope: this.root }
    );
  }

  private get manageLink(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.DEPOSITS.MANAGE_LINK',
      { scope: this.root }
    );
  }

  private get openNewDepositLink(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.DEPOSITS.OPEN_NEW_DEPOSIT_LINK',
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

  async openManage(): Promise<void> {
    await expect(this.manageLink).toHaveCount(1);
    await expect(this.manageLink).toBeVisible();
    await this.manageLink.click();
  }

  async openNewDeposit(): Promise<void> {
    const itemCount = await this.slides.count();
    expect(
      itemCount,
      'The Deposits and Investments carousel must contain at least one item.'
    ).toBeGreaterThan(0);

    for (let index = 0; index < itemCount; index += 1) {
      const openLinkCount = await this.openNewDepositLink.count();

      if (openLinkCount === 1) {
        await expect(this.openNewDepositLink).toBeVisible();
        await this.openNewDepositLink.click();
        return;
      }

      expect(
        openLinkCount,
        'The active Deposits slide may expose at most one Open new deposit action.'
      ).toBe(0);

      if (index < itemCount - 1) {
        await this.carousel.moveNextAndAssertActiveItemChanged();
      }
    }

    throw new Error(
      'The Deposits and Investments carousel did not expose the Open new deposit action.'
    );
  }
}
