import {
  expect,
  type Locator,
} from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/dashboard/dashboardDisplayFormatter.js';

type DashboardCardStatistic =
  | 'Card Limit'
  | 'Available Limit'
  | 'Outstanding';

type DashboardCardStatisticLocatorKeys = {
  readonly item: string;
  readonly value: string;
};

const CARD_STATISTIC_KEYS = {
  'Card Limit': {
    item: 'PORTAL.DASHBOARD.WIDGETS.CARDS.CARD_LIMIT.ITEM',
    value: 'PORTAL.DASHBOARD.WIDGETS.CARDS.CARD_LIMIT.VALUE',
  },
  'Available Limit': {
    item: 'PORTAL.DASHBOARD.WIDGETS.CARDS.AVAILABLE_LIMIT.ITEM',
    value: 'PORTAL.DASHBOARD.WIDGETS.CARDS.AVAILABLE_LIMIT.VALUE',
  },
  Outstanding: {
    item: 'PORTAL.DASHBOARD.WIDGETS.CARDS.OUTSTANDING.ITEM',
    value: 'PORTAL.DASHBOARD.WIDGETS.CARDS.OUTSTANDING.VALUE',
  },
} as const satisfies Readonly<
  Record<DashboardCardStatistic, DashboardCardStatisticLocatorKeys>
>;

const REQUIRED_CARD_STATISTIC_TIMEOUT = 15_000;

export type DashboardCardStatisticCurrencies = {
  readonly cardLimit: string;
  readonly availableLimit: string;
  readonly outstanding: string;
};

export type DashboardCardUi = {
  readonly identity: string;
  readonly cardLimit: string;
  readonly availableLimit: string;
  readonly outstanding: string;
  readonly currencies: DashboardCardStatisticCurrencies;
};

export class DashboardCardsWidgetComponent {
  constructor(private readonly repository: LocatorRepository) {}

  private get root(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.CARDS.ROOT'
    );
  }

  private get deck(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.CARDS.DECK',
      { scope: this.root }
    );
  }

  private get cardItems(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.CARDS.CARD_ITEMS',
      { scope: this.deck }
    );
  }

  private get nextButton(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.CARDS.NEXT_BUTTON',
      { scope: this.root }
    );
  }

  async assertReady(): Promise<void> {
    await expect(this.root).toHaveCount(1);
    await expect(this.root).toBeAttached();
    await expect(this.root).toBeVisible();
    expect(normalizeText(await this.root.innerText()).length).toBeGreaterThan(0);
    await expect(this.deck).toBeVisible();
  }

  async getActiveCard(): Promise<DashboardCardUi> {
    const frontCard = await this.findFrontCard();
    const identity = await this.getRequiredAttribute(
      frontCard,
      'aria-label',
      'active card identity'
    );

    return {
      identity,
      cardLimit: await this.readStatistic('Card Limit'),
      availableLimit: await this.readStatistic('Available Limit'),
      outstanding: await this.readStatistic('Outstanding'),
      currencies: await this.readStatisticCurrencies(),
    };
  }

  async moveNext(): Promise<void> {
    await expect(this.nextButton).toHaveCount(1);
    await expect(this.nextButton).toBeVisible();
    await expect(this.nextButton).toBeEnabled();
    await this.nextButton.click();
  }

  private statisticItem(label: DashboardCardStatistic): Locator {
    return this.repository.locator(
      CARD_STATISTIC_KEYS[label].item,
      { scope: this.root }
    );
  }

  private statisticValue(label: DashboardCardStatistic): Locator {
    return this.repository.locator(
      CARD_STATISTIC_KEYS[label].value,
      { scope: this.statisticItem(label) }
    );
  }

  private statisticCurrency(label: DashboardCardStatistic): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.CARDS.STAT.CURRENCY',
      {
        scope: this.statisticItem(label),
      }
    );
  }

  private async findFrontCard(): Promise<Locator> {
    const count = await this.cardItems.count();
    expect(
      count,
      'The Dashboard card deck must contain at least one card.'
    ).toBeGreaterThan(0);
    let frontIndex = -1;
    let highestZIndex = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < count; index += 1) {
      const candidate = this.cardItems.nth(index);
      const state = await candidate.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          opacity: Number(style.opacity),
          zIndex: Number(style.zIndex),
        };
      });

      if (state.opacity > 0 && state.zIndex > highestZIndex) {
        highestZIndex = state.zIndex;
        frontIndex = index;
      }
    }

    expect(
      frontIndex,
      'One visible card must own the front-most z-index.'
    ).toBeGreaterThanOrEqual(0);
    const frontCard = this.cardItems.nth(frontIndex);
    await expect(frontCard).toBeVisible();
    return frontCard;
  }

  private async readStatistic(
    label: DashboardCardStatistic
  ): Promise<string> {
    const value = this.statisticValue(label);
    await expect(value).toBeVisible({
      timeout: REQUIRED_CARD_STATISTIC_TIMEOUT,
    });
    return normalizeText(await value.innerText());
  }

  private async readStatisticCurrencies(): Promise<DashboardCardStatisticCurrencies> {
    return {
      cardLimit: await this.readStatisticCurrency('Card Limit'),
      availableLimit: await this.readStatisticCurrency('Available Limit'),
      outstanding: await this.readStatisticCurrency('Outstanding'),
    };
  }

  private async readStatisticCurrency(
    label: DashboardCardStatistic
  ): Promise<string> {
    const displayedCurrency = this.statisticCurrency(label);
    await expect(displayedCurrency).toBeVisible();
    return normalizeText(await displayedCurrency.innerText());
  }

  private async getRequiredAttribute(
    locator: Locator,
    attributeName: string,
    description: string
  ): Promise<string> {
    const value = await locator.getAttribute(attributeName);

    if (!value || value.trim().length === 0) {
      throw new Error(`${description} must expose ${attributeName}.`);
    }

    return value.trim();
  }
}
