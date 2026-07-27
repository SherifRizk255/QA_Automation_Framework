import {
  expect,
  type Locator,
} from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/dashboard/dashboardDisplayFormatter.js';

export type DashboardPortfolioMode =
  | 'I Have'
  | 'I Owe';

export type DashboardPortfolioCategoryUi = {
  readonly label: string;
  readonly percentageText: string;
};

export type DashboardPortfolioUiState = {
  readonly mode: DashboardPortfolioMode;
  readonly displayedTotal: string;
  readonly categories: readonly DashboardPortfolioCategoryUi[];
  readonly panelText: string;
};

export class DashboardPortfolioWidgetComponent {
  constructor(private readonly repository: LocatorRepository) {}

  private get root(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.WIDGETS.PORTFOLIO.ROOT'
    );
  }

  private get tabList(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.TAB_LIST',
      { scope: this.root }
    );
  }

  private get assetsTab(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.I_HAVE_TAB',
      { scope: this.root }
    );
  }

  private get liabilitiesTab(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.I_OWE_TAB',
      { scope: this.root }
    );
  }

  private get assetsPanel(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.I_HAVE_PANEL',
      { scope: this.root }
    );
  }

  private get liabilitiesPanel(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.I_OWE_PANEL',
      { scope: this.root }
    );
  }

  private get assetsTotalContainer(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.ASSETS_TOTAL',
      { scope: this.assetsPanel }
    );
  }

  private get liabilitiesTotalContainer(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.LIABILITIES_TOTAL',
      { scope: this.liabilitiesPanel }
    );
  }

  private get assetsTotalValue(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.TOTAL_VALUE',
      { scope: this.assetsTotalContainer }
    );
  }

  private get liabilitiesTotalValue(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.TOTAL_VALUE',
      { scope: this.liabilitiesTotalContainer }
    );
  }

  private get assetsLegendItems(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.LEGEND_ITEMS',
      { scope: this.assetsPanel }
    );
  }

  private get liabilitiesLegendItems(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.LEGEND_ITEMS',
      { scope: this.liabilitiesPanel }
    );
  }

  private get assetsChart(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.CHART',
      { scope: this.assetsPanel }
    );
  }

  private get liabilitiesChart(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.PORTFOLIO.CHART',
      { scope: this.liabilitiesPanel }
    );
  }

  async assertReady(): Promise<void> {
    await expect(this.root).toHaveCount(1);
    await expect(this.root).toBeAttached();
    await expect(this.root).toBeVisible();
    expect(normalizeText(await this.root.innerText()).length).toBeGreaterThan(0);
    await expect(this.tabList).toBeVisible();
  }

  async getActiveMode(): Promise<DashboardPortfolioMode> {
    const selectedModes: DashboardPortfolioMode[] = [];

    if (await this.assetsTab.getAttribute('aria-selected') === 'true') {
      selectedModes.push('I Have');
    }

    if (await this.liabilitiesTab.getAttribute('aria-selected') === 'true') {
      selectedModes.push('I Owe');
    }

    expect(
      selectedModes,
      'My Portfolio must expose exactly one active mode.'
    ).toHaveLength(1);
    return selectedModes[0];
  }

  async readState(): Promise<DashboardPortfolioUiState> {
    const mode = await this.getActiveMode();
    const panel = this.panelFor(mode);
    await expect(panel).toBeVisible();

    const totalText = await this.totalValueFor(mode).innerText();
    const legendTexts = await this.legendItemsFor(mode).allTextContents();
    const categories = legendTexts.map((legendText) =>
      this.readCategory(legendText)
    );

    return {
      mode,
      displayedTotal: normalizeText(totalText),
      categories,
      panelText: normalizeText(await panel.innerText()),
    };
  }

  async selectLiabilities(): Promise<void> {
    await expect(this.liabilitiesTab).toBeVisible();
    await expect(this.liabilitiesTab).toBeEnabled();
    await this.liabilitiesTab.click();
    await expect(this.liabilitiesTab).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(this.liabilitiesPanel).toBeVisible();
  }

  async captureChartScreenshot(): Promise<Buffer> {
    const mode = await this.getActiveMode();
    const chart = this.chartFor(mode);
    await expect(chart).toHaveCount(1);
    await expect(chart).toBeVisible();
    return chart.screenshot();
  }

  private panelFor(mode: DashboardPortfolioMode): Locator {
    return mode === 'I Have'
      ? this.assetsPanel
      : this.liabilitiesPanel;
  }

  private totalValueFor(mode: DashboardPortfolioMode): Locator {
    return mode === 'I Have'
      ? this.assetsTotalValue
      : this.liabilitiesTotalValue;
  }

  private legendItemsFor(mode: DashboardPortfolioMode): Locator {
    return mode === 'I Have'
      ? this.assetsLegendItems
      : this.liabilitiesLegendItems;
  }

  private chartFor(mode: DashboardPortfolioMode): Locator {
    return mode === 'I Have'
      ? this.assetsChart
      : this.liabilitiesChart;
  }

  private readCategory(legendText: string): DashboardPortfolioCategoryUi {
    const match = normalizeText(legendText).match(
      /^(\d+(?:\.\d+)?)%\s+(.+)$/
    );

    if (!match) {
      throw new Error(`Unsupported portfolio legend format: ${legendText}`);
    }

    return {
      label: match[2],
      percentageText: `${match[1]}%`,
    };
  }
}
