import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/dashboard/dashboardDisplayFormatter.js';
import { PortalSwiperCarouselComponent } from '../carousel/PortalSwiperCarouselComponent.js';

export type DashboardAccountUi = {
  readonly rawText: string;
  readonly availableBalance: string;
  readonly hasDefaultBadge: boolean;
};

export class DashboardAccountsWidgetComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  private get root(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.ACCOUNTS.ROOT'
    );
  }

  private get carousel(): PortalSwiperCarouselComponent {
    return new PortalSwiperCarouselComponent(this.page, this.root);
  }

  private get activeItemRoot(): Locator {
    return this.carousel.getActiveItemRoot();
  }

  private get balance(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.ACCOUNTS.BALANCE',
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
      'PORTAL.DASHBOARD.WIDGETS.ACCOUNTS.MANAGE_LINK',
      { scope: this.root }
    );
  }

  private get defaultBadge(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.ACCOUNTS.DEFAULT_BADGE',
      { scope: this.activeItemRoot }
    );
  }

  private get previousButton(): Locator {
    return this.repository.locator(
      'PORTAL.COMPONENTS.SWIPER.PREVIOUS_BUTTON',
      { scope: this.root }
    );
  }

  private get openNewAccountLink(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.ACCOUNTS.OPEN_NEW_ACCOUNT_LINK',
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

  async getActiveAccount(): Promise<DashboardAccountUi> {
    const account = await this.findActiveAccount();

    if (!account) {
      throw new Error(
        'The active Accounts slide must contain an account balance.'
      );
    }

    return account;
  }

  async findActiveAccount(): Promise<DashboardAccountUi | undefined> {
    await this.carousel.assertReady();
    const balanceCount = await this.balance.count();

    if (balanceCount === 0) {
      return undefined;
    }

    expect(
      balanceCount,
      'An account product slide must expose exactly one balance.'
    ).toBe(1);
    await expect(this.balance).toBeVisible();
    const defaultBadgeCount = await this.defaultBadge.count();
    expect(
      defaultBadgeCount,
      'An account product slide may expose at most one Default badge.'
    ).toBeLessThanOrEqual(1);
    let hasDefaultBadge = false;

    if (defaultBadgeCount === 1) {
      hasDefaultBadge = await this.defaultBadge.isVisible();
    }

    return {
      rawText: await this.carousel.getActiveItemText(),
      availableBalance: normalizeText(await this.balance.innerText()),
      hasDefaultBadge,
    };
  }

  async moveNext(): Promise<void> {
    await this.carousel.moveNextAndAssertActiveItemChanged();
  }

  async movePrevious(): Promise<void> {
    const previousText = await this.carousel.getActiveItemText();
    await expect(this.previousButton).toHaveCount(1);
    await expect(this.previousButton).toBeVisible();
    await expect(this.previousButton).toBeEnabled();
    await this.previousButton.click();
    await expect(this.activeItemRoot).not.toHaveText(previousText);
    await expect(this.activeItemRoot).toBeVisible();
  }

  async getItemCount(): Promise<number> {
    const count = await this.slides.count();
    expect(
      count,
      'The Accounts carousel must contain at least one account.'
    ).toBeGreaterThan(0);
    return count;
  }

  async openManage(): Promise<void> {
    await expect(this.manageLink).toBeVisible();
    await this.manageLink.click();
  }

  async openNewAccount(): Promise<void> {
    const itemCount = await this.getItemCount();

    for (let index = 0; index < itemCount; index += 1) {
      const openLinkCount = await this.openNewAccountLink.count();

      if (openLinkCount === 1) {
        await expect(this.openNewAccountLink).toBeVisible();
        await this.openNewAccountLink.click();
        return;
      }

      expect(
        openLinkCount,
        'The active Accounts slide may expose at most one Open new account action.'
      ).toBe(0);

      if (index < itemCount - 1) {
        await this.moveNext();
      }
    }

    throw new Error(
      'The Accounts carousel did not expose the Open new account action.'
    );
  }
}
