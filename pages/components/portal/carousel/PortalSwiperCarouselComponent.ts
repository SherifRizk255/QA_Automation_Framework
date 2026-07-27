import { expect, type Locator, type Page } from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { BaseComponent } from '../../core/BaseComponent.js';

/**
 * Shared mechanics for the portal's Swiper-backed product collections.
 * Item fields intentionally remain with their feature owner because Accounts,
 * Deposits & Investments, and Loans expose different business contracts.
 */
export class PortalSwiperCarouselComponent extends BaseComponent {
  private readonly slides: Locator;
  private readonly activeSlide: Locator;
  private readonly nextButton: Locator;

  constructor(page: Page, root: Locator) {
    super(page, root);
    const repository = new LocatorRepository(page);
    this.slides = repository.resolve('PORTAL.COMPONENTS.SWIPER.SLIDES', {
      scope: root,
    });
    this.activeSlide = repository.resolve('PORTAL.COMPONENTS.SWIPER.ACTIVE_SLIDE', {
      scope: root,
    });
    this.nextButton = repository.resolve('PORTAL.COMPONENTS.SWIPER.NEXT_BUTTON', {
      scope: root,
    });
  }

  async assertReady(): Promise<void> {
    await expect(this.root).toBeVisible();
    expect(await this.slides.count(), 'The carousel must contain at least one item.').toBeGreaterThan(0);
    await expect(this.activeSlide, 'The carousel must expose one active item.').toHaveCount(1);
    await expect(this.activeSlide).toBeVisible();
  }

  getActiveItemRoot(): Locator {
    return this.activeSlide;
  }

  async getActiveItemText(): Promise<string> {
    await expect(this.activeSlide).toBeVisible();
    return (await this.activeSlide.innerText()).replace(/\s+/g, ' ').trim();
  }

  async moveNextAndAssertActiveItemChanged(): Promise<void> {
    const previousText = await this.getActiveItemText();

    await expect(this.nextButton).toHaveCount(1);
    await expect(this.nextButton).toBeVisible();
    await expect(this.nextButton).toBeEnabled();
    await this.nextButton.click();

    await expect(this.activeSlide).not.toHaveText(previousText);
    await expect(this.activeSlide).toBeVisible();
  }
}
