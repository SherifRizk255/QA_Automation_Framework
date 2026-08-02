import {expect,type Locator,type Page,type TestInfo,} from '@playwright/test';
import * as allure from 'allure-js-commons';
import { portalHashRoute, ROUTES } from '../../config/resources.js';
import { decimalsEqual, decimalToNumber, decimalToString, parseDecimal, roundDecimal, type DecimalValue} from '../../utils/financial/decimal.js';
import { LocatorRepository } from '../../utils/locatorRepository.ts';
import {
  extractPercentage,
  formatApiDate,
  formatDashboardMoney,
  formatLastLoginForCairo,
  isDashboardMoneyDisplay,
  normalizeDashboardAccountNumber,
  normalizeText,
} from '../../utils/portal/dashboard/dashboardDisplayFormatter.js';
import { calculateAssetPortfolio,calculateLiabilityPortfolio,calculateNetWorth,type DashboardPortfolioCategoryExpectation, type DashboardPortfolioExpectation,} from '../../utils/portal/dashboard/DashboardPortfolioCalculator.js';
import {DashboardAccountsWidgetComponent,type DashboardAccountUi,} from '../components/portal/dashboard/DashboardAccountsWidgetComponent.js';
import {DashboardCardsWidgetComponent,type DashboardCardUi,} from '../components/portal/dashboard/DashboardCardsWidgetComponent.js';
import { DashboardDepositsWidgetComponent } from '../components/portal/dashboard/DashboardDepositsWidgetComponent.js';
import { DashboardLoansWidgetComponent, type DashboardLoanUi,} from '../components/portal/dashboard/DashboardLoansWidgetComponent.js';
import { DashboardNotificationsComponent } from '../components/portal/dashboard/DashboardNotificationsComponent.js';
import { DashboardPortfolioWidgetComponent,type DashboardPortfolioUiState,} from '../components/portal/dashboard/DashboardPortfolioWidgetComponent.js';
import { DashboardWelcomeComponent, type DashboardSummaryLabel, type DashboardSummaryUiValue,} from '../components/portal/dashboard/DashboardWelcomeComponent.js';
import { PortalLoadingComponent } from '../components/portal/loading/PortalLoadingComponent.js';
import type {
  DashboardAccount,
  DashboardApiSnapshot,
  DashboardCard,
  DashboardCustomerProfile,
  DashboardDeposit,
  DashboardLoan,
} from '../../utils/portal/DashboardApiObserver.js';

function maskIdentifier(value: string): string {
  const compact = value.replace(/\s+/g, '');
  return compact.length <= 4 ? '****' : `****${compact.slice(-4)}`;
}

type DashboardAccountDisplayValue = {
  readonly currency: string;
  readonly balance: string;
};

type DashboardMatchedAccountUi = {
  readonly account: DashboardAccount;
  readonly ui: DashboardAccountUi;
};

type DashboardDestinationQueryContract = {
  readonly requireProductIdentity: boolean;
  readonly queryType?: string;
};

export class DashboardPage {
  private readonly repository: LocatorRepository;
  private readonly loading: PortalLoadingComponent;

  constructor(
    private readonly page: Page,
    private readonly testInfo?: TestInfo
  ) {
    this.repository = new LocatorRepository(page);
    this.loading = new PortalLoadingComponent(page);
  }

  private get dashboardRegion(): Locator {
    return this.repository.locator('PORTAL.DASHBOARD.ROOT');
  }

  private get dashboardHeading(): Locator {
    return this.repository.locator('PORTAL.DASHBOARD.HEADING');
  }

  private get dashboardSections(): Locator {
    return this.repository.locator('PORTAL.DASHBOARD.SECTIONS');
  }

  private get lastLoginInfo(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.INFO.LAST_LOGIN',
      { scope: this.dashboardRegion }
    );
  }

  private get currencySelector(): Locator {
    return this.repository.locator('PORTAL.DASHBOARD.CURRENCY.SELECTOR');
  }

  private currencyOption(currency: string): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.CURRENCY.OPTION',
      { parameters: { currency } }
    );
  }

  private get dashboardTab(): Locator {
    return this.repository.locator('PORTAL.DASHBOARD.NAV.DASHBOARD_TAB');
  }

  private get welcomeComponent(): DashboardWelcomeComponent {
    return new DashboardWelcomeComponent(this.repository);
  }

  private get accountsComponent(): DashboardAccountsWidgetComponent {
    return new DashboardAccountsWidgetComponent(this.page, this.repository);
  }

  private get cardsComponent(): DashboardCardsWidgetComponent {
    return new DashboardCardsWidgetComponent(this.repository);
  }

  private get depositsComponent(): DashboardDepositsWidgetComponent {
    return new DashboardDepositsWidgetComponent(this.page, this.repository);
  }

  private get loansComponent(): DashboardLoansWidgetComponent {
    return new DashboardLoansWidgetComponent(this.page, this.repository);
  }

  private get portfolioComponent(): DashboardPortfolioWidgetComponent {
    return new DashboardPortfolioWidgetComponent(this.repository);
  }

  private get notificationsComponent(): DashboardNotificationsComponent {
    return new DashboardNotificationsComponent(this.repository);
  }

  async dismissApiErrorPopupIfPresent(testInfo: TestInfo | undefined = this.testInfo): Promise<void> {
    const apiErrorPopup = this.repository.locator('PORTAL.COMMON.API_ERROR_DIALOG');

    if (!(await apiErrorPopup.isVisible())) {
      return;
    }

    const closeButton = this.repository.locator(
      'PORTAL.COMMON.API_ERROR_DIALOG.CLOSE_BUTTON',
      { scope: apiErrorPopup }
    );
    await expect(closeButton, 'Dashboard API error popup Close button must be unique.').toHaveCount(1);
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toBeEnabled();

    const screenshot = await apiErrorPopup.screenshot();
    await testInfo?.attach('dashboard-api-error-popup', {
      body: screenshot,
      contentType: 'image/png',
    });
    await closeButton.click();
    await expect(apiErrorPopup).toBeHidden();
  }

  async expectLoaded(testInfo: TestInfo | undefined = this.testInfo): Promise<void> {
    await this.assertDashboardIsLoaded(testInfo);
  }

  async assertDashboardIsLoaded(testInfo: TestInfo | undefined = this.testInfo): Promise<void> {
    await allure.step('Open the authenticated Dashboard', async () => {
      await this.loading.waitForCompletion();
      await this.dismissApiErrorPopupIfPresent(testInfo);
      await expect(this.page).toHaveURL(portalHashRoute(ROUTES.portal.dashboard, this.page.url()), {
        timeout: 60_000,
      });
      await expect(this.dashboardHeading).toBeVisible();
      await expect(this.lastLoginInfo).toBeVisible();
      await expect(this.currencySelector).toBeVisible();
      await this.welcomeComponent.assertReady();
      await expect(this.dashboardSections).toBeVisible();

      const screenshot = await this.page.screenshot({ fullPage: true });
      await testInfo?.attach('dashboard-ready', {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  }

  async openDashboardFromLogo(): Promise<void> {
    await allure.step('Open Dashboard from the SAIB logo', async () => {
      const logo = this.repository.locator('PORTAL.DASHBOARD.NAV.LOGO');
      await this.clickAndAssertDestination(logo,ROUTES.portal.dashboard,'PORTAL.DASHBOARD.HEADING');
    });
  }

  async openNotificationPanel(): Promise<void> {
    await allure.step('Open the Dashboard notification panel', async () => {
      await this.notificationsComponent.openPanel();
      await this.attachComparison('notification-panel-state', {
        matchedRecordIdentity: 'authenticated-dashboard-notifications',
        expected: 'notification panel visible',
        actual: 'notification panel visible',
        comparisonOutcome: 'PASS',
      });
    });
  }

  async assertNotificationPanelShowsEmptyState(): Promise<void> {
    await allure.step('Verify the notification panel empty state', async () => {
      await this.notificationsComponent.openPanel();
      const actualText =
        await this.notificationsComponent.getEmptyStateText();
      const expectedText = 'No notifications yet';

      await this.attachComparison('notification-empty-state', {
        matchedRecordIdentity: 'authenticated-dashboard-notifications',
        expected: expectedText,
        actual: actualText,
        comparisonOutcome:
          actualText === expectedText
            ? 'PASS'
            : 'FAIL',
      });
      expect(
        actualText,
        'The notification panel must display the exact approved empty state.'
      ).toBe(expectedText);
    });
  }

  async assertDashboardTabIsActive(): Promise<void> {
    await allure.step('Verify Dashboard is the active top-navigation tab', async () => {
      await expect(this.dashboardTab).toHaveCount(1);
      await expect(this.dashboardTab).toBeVisible();
      await expect(this.dashboardTab).toHaveClass(/saib-nav-item--active/);
    });
  }

  async openAccounts(): Promise<void> {
    await this.openTopNavigationDestination(
      'PORTAL.DASHBOARD.NAV.ACCOUNTS',
      ROUTES.portal.accounts,
      'PORTAL.DASHBOARD.DESTINATION.ACCOUNTS_HEADING',
      'Accounts'
    );
  }

  async openTransfers(): Promise<void> {
    await this.openTopNavigationDestination(
      'PORTAL.DASHBOARD.NAV.TRANSFERS',
      ROUTES.portal.betweenMyAccounts,
      'PORTAL.DASHBOARD.DESTINATION.TRANSFER_HEADING',
      'Transfer'
    );
  }

  async openCards(): Promise<void> {
    await this.openTopNavigationDestination(
      'PORTAL.DASHBOARD.NAV.CARDS',
      ROUTES.portal.cards,
      'PORTAL.DASHBOARD.DESTINATION.CARDS_HEADING',
      'Cards'
    );
  }

  async openLoans(): Promise<void> {
    await this.openTopNavigationDestination(
      'PORTAL.DASHBOARD.NAV.LOANS',
      ROUTES.portal.loans,
      'PORTAL.DASHBOARD.DESTINATION.LOANS_HEADING',
      'Loans'
    );
  }

  async openInvestments(): Promise<void> {
    await this.openTopNavigationDestination(
      'PORTAL.DASHBOARD.NAV.INVESTMENTS',
      ROUTES.portal.investments,
      'PORTAL.DASHBOARD.DESTINATION.INVESTMENTS_HEADING',
      'Investments'
    );
  }

  async openMore(): Promise<void> {
    await this.openTopNavigationDestination(
      'PORTAL.DASHBOARD.NAV.MORE',
      ROUTES.portal.more,
      'PORTAL.DASHBOARD.DESTINATION.MORE_HEADING',
      'More'
    );
  }

  async openProfile(): Promise<void> {
    await allure.step('Open Profile Details from the customer avatar', async () => {
      const avatar = this.repository.locator('PORTAL.DASHBOARD.PROFILE.BUTTON');
      await this.clickAndAssertDestination(avatar, ROUTES.portal.profile,'PORTAL.DASHBOARD.DESTINATION.PROFILE_HEADING');
    });
  }

  async assertDefaultCurrencyIsEgp(): Promise<void> {
    await allure.step('Verify the Dashboard currency defaults to EGP', async () => {
      await expect(this.currencySelector).toHaveCount(1);
      await expect(this.currencySelector).toBeVisible();
      expect(normalizeText(await this.currencySelector.innerText())).toBe('EGP');
    });
  }

  async assertLastLoginMatchesProfile(
    profile: DashboardCustomerProfile
  ): Promise<void> {
    await allure.step('Verify Last Login matches Cairo local time', async () => {
      const expectedText = formatLastLoginForCairo(profile.lastLoginTime);
      const actualText = normalizeText(await this.lastLoginInfo.innerText());

      await this.attachComparison('last-login-cairo-comparison', {
        matchedRecordIdentity: 'authenticated-customer-profile',
        expected: {
          sourceUtc: profile.lastLoginTime,
          timezone: 'Africa/Cairo',
          displayedText: expectedText,
        },
        actual: {
          displayedText: actualText,
        },
        comparisonOutcome:
          actualText === expectedText
            ? 'PASS'
            : 'FAIL',
      });
      expect(
        actualText,
        'Last Login must equal the profile timestamp converted through Africa/Cairo.'
      ).toBe(expectedText);
    });
  }

  async assertWelcomeNameMatchesProfile(profile: DashboardCustomerProfile): Promise<void> {
    await allure.step('Verify the welcome name matches the customer profile', async () => {
      const actualName = await this.welcomeComponent.getCustomerName();
      const expectedName = normalizeText(profile.name);

      expect(actualName, 'Welcome name must preserve the profile API name and order.').toBe(expectedName);
      await this.attachComparison('welcome-name-comparison', {
        matchedRecordIdentity: 'authenticated-customer-profile',
        expected: '[profile name]',
        actual: '[matching welcome name]',
        comparisonOutcome: 'PASS',
      });
    });
  }

  async assertSummaryValuesUseSelectedCurrency(): Promise<void> {
    await allure.step('Verify Net Worth, I Have, and I Owe use EGP', async () => {
      const summaries = await this.welcomeComponent.getSummaryValues();

      for (const summary of summaries) {
        expect(summary.currency).toBe('EGP');
        parseDecimal(summary.displayedValue, `${summary.label} summary value`);
      }
    });
  }

  async assertWelcomeNetWorthMatches(api: DashboardApiSnapshot): Promise<void> {
    await allure.step('Verify Welcome Net Worth uses the exact approved calculation', async () => {
      await this.assertWelcomeSummaryValue(
        'Net Worth',
        calculateNetWorth(api),
        'welcome-net-worth-comparison'
      );
    });
  }

  async assertWelcomeAssetsMatch(api: DashboardApiSnapshot): Promise<void> {
    await allure.step('Verify Welcome I Have uses the approved asset calculation', async () => {
      await this.assertWelcomeSummaryValue(
        'I Have',
        calculateAssetPortfolio(api).total,
        'approved-i-have-calculation'
      );
    });
  }

  async assertWelcomeLiabilitiesMatch(api: DashboardApiSnapshot): Promise<void> {
    await allure.step('Verify Welcome I Owe uses the approved liability calculation', async () => {
      await this.assertWelcomeSummaryValue(
        'I Owe',
        calculateLiabilityPortfolio(api).total,
        'approved-i-owe-calculation'
      );
    });
  }

  async assertWelcomeMonetaryValuesUseTwoDecimalFormat(): Promise<void> {
    await allure.step('Verify all Welcome monetary values use #,##0.00', async () => {
      const summaries = await this.welcomeComponent.getSummaryValues();

      for (const summary of summaries) {
        expect(
          isDashboardMoneyDisplay(summary.displayedValue),
          `${summary.label} displayed value "${summary.displayedValue}" must use the visible #,##0.00 format.`
        ).toBe(true);
        expect(
          () => parseDecimal(
            summary.displayedValue,
            `${summary.label} displayed monetary value`
          ),
          `${summary.label} displayed value "${summary.displayedValue}" must represent a valid monetary number.`
        ).not.toThrow();
      }
    });
  }

  async assertAccountBalancesRemainNativeAfterAggregateCurrencyChange(
    accounts: readonly DashboardAccount[],
    targetAggregateCurrency: string
  ): Promise<void> {
    await allure.step('Verify account balances remain native after aggregate currency change', async () => {
      expect(accounts.length,'The account-currency case requires at least two API accounts.').toBeGreaterThanOrEqual(2);
      const beforeChange = await this.readAllDisplayedAccounts(accounts);

      await this.selectAggregateCurrency(targetAggregateCurrency);

      const afterChange = await this.readAllDisplayedAccounts(accounts);
      expect(afterChange.size).toBe(beforeChange.size);

      for (const [accountNumber, before] of beforeChange) {
        const after = afterChange.get(accountNumber);
        expect(after, 'Every account shown before the currency change must remain visible.').toBeDefined();
        expect(after?.currency).toBe(before.currency);
        expect(after?.balance).toBe(before.balance);
      }

      await this.attachComparison('account-native-currency-comparison', {
        matchedRecordIdentity: 'authenticated-customer-account-collection',
        expected: [...beforeChange.entries()].map(([accountNumber, value]) => ({
          account: maskIdentifier(accountNumber),
          currency: value.currency,
          balance: value.balance,
        })),
        actual: [...afterChange.entries()].map(([accountNumber, value]) => ({
          account: maskIdentifier(accountNumber),
          currency: value.currency,
          balance: value.balance,
        })),
        comparisonOutcome: 'PASS',
      });
    });
  }

  async assertActiveAccountMatches(accounts: readonly DashboardAccount[]): Promise<void> {
    await allure.step('Verify the active account matches the accounts API', async () => {
      const activeAccount = await this.accountsComponent.getActiveAccount();
      const account = this.findAccountByIdentity(accounts, activeAccount.rawText);
      await this.assertAccountFields(account, activeAccount);
    });
  }

  async moveToNextAccountAndAssertMatches(accounts: readonly DashboardAccount[]): Promise<void> {
    await allure.step('Move to the next account and verify its API-backed values', async () => {
      const previousUiAccount = await this.accountsComponent.getActiveAccount();
      const previousAccount = this.findAccountByIdentity(accounts,previousUiAccount.rawText);

      await this.accountsComponent.moveNext();

      const currentUiAccount = await this.accountsComponent.getActiveAccount();
      const currentAccount = this.findAccountByIdentity(accounts,currentUiAccount.rawText);
      expect(currentAccount.accountNumber).not.toBe(previousAccount.accountNumber);
      await this.assertAccountFields(currentAccount, currentUiAccount);
    });
  }

  async assertOnlyPrimaryAccountIsDefault(
    api: DashboardApiSnapshot
  ): Promise<void> {
    await allure.step('Verify only the login-defined primary account is Default', async () => {
      const displayedAccounts =
        await this.readDisplayedAccountRecords(api.accounts);
      const defaultAccounts = displayedAccounts.filter(
        ({ ui }) => ui.hasDefaultBadge
      );

      expect(
        displayedAccounts,
        'Every API account must be represented by one Dashboard account card.'
      ).toHaveLength(api.accounts.length);
      expect(
        defaultAccounts,
        'Exactly one Dashboard account card must display Default.'
      ).toHaveLength(1);

      const expectedIdentity = normalizeDashboardAccountNumber(
        api.primaryAccount
      );
      const actualIdentity = normalizeDashboardAccountNumber(
        defaultAccounts[0].account.accountNumber
      );
      const identityMatches = actualIdentity === expectedIdentity;

      await this.attachComparison('default-account-comparison', {
        matchedRecordIdentity: maskIdentifier(api.primaryAccount),
        expected: {
          primaryAccount: maskIdentifier(api.primaryAccount),
          defaultBadgeCount: 1,
        },
        actual: {
          account: maskIdentifier(
            defaultAccounts[0].account.accountNumber
          ),
          defaultBadgeCount: defaultAccounts.length,
        },
        comparisonOutcome: identityMatches ? 'PASS' : 'FAIL',
      });
      expect(
        identityMatches,
        'The sole Default account must match login-defined PrimaryAccount.'
      ).toBe(true);
    });
  }

  async assertNegativeAccountBalanceMatches(
    accounts: readonly DashboardAccount[]
  ): Promise<void> {
    await allure.step('Verify the API-backed negative account balance and native currency', async () => {
      const negativeAccounts = accounts.filter(
        (account) =>
          parseDecimal(
            account.availableBalance,
            'account API balance'
          ).units < 0n
      );
      expect(
        negativeAccounts,
        'The negative-balance case requires exactly one API account with a negative balance.'
      ).toHaveLength(1);

      const displayedAccounts =
        await this.readDisplayedAccountRecords(accounts);
      const negativeAccount = negativeAccounts[0];
      const displayedAccount = displayedAccounts.find(
        ({ account }) =>
          normalizeDashboardAccountNumber(account.accountNumber) ===
          normalizeDashboardAccountNumber(negativeAccount.accountNumber)
      );
      expect(
        displayedAccount,
        'The API-backed negative account must be visible in the Accounts carousel.'
      ).toBeDefined();

      const expectedBalance = parseDecimal(
        negativeAccount.availableBalance,
        'negative account API balance'
      );
      const expectedDisplay = formatDashboardMoney(expectedBalance);
      const actualDisplay = displayedAccount?.ui.availableBalance ?? '';
      const actualBalance = parseDecimal(
        actualDisplay,
        'displayed negative account balance'
      );
      const exactValueMatches = decimalsEqual(
        actualBalance,
        expectedBalance
      );
      const currencyMatches =
        displayedAccount?.ui.rawText.includes(
          negativeAccount.currency
        ) ?? false;

      await this.attachComparison('negative-account-balance-comparison', {
        matchedRecordIdentity: maskIdentifier(
          negativeAccount.accountNumber
        ),
        expected: {
          balance: expectedDisplay,
          currency: negativeAccount.currency,
        },
        actual: {
          balance: actualDisplay,
          currency: currencyMatches
            ? negativeAccount.currency
            : '[not matched]',
        },
        comparisonOutcome:
          exactValueMatches &&
          currencyMatches &&
          actualDisplay === expectedDisplay
            ? 'PASS'
            : 'FAIL',
      });
      expect(
        isDashboardMoneyDisplay(actualDisplay),
        `Negative account balance "${actualDisplay}" must use -#,##0.00.`
      ).toBe(true);
      expect(actualDisplay.startsWith('-')).toBe(true);
      expect(actualDisplay).toBe(expectedDisplay);
      expect(exactValueMatches).toBe(true);
      expect(
        currencyMatches,
        'The negative account must retain its native API currency.'
      ).toBe(true);
    });
  }

  async moveToNextAccountThenPreviousAndAssertOriginal(
    accounts: readonly DashboardAccount[]
  ): Promise<void> {
    await allure.step('Verify Accounts Previous returns to the original account', async () => {
      const firstUi = await this.accountsComponent.getActiveAccount();
      const firstAccount = this.findAccountByIdentity(
        accounts,
        firstUi.rawText
      );

      await this.accountsComponent.moveNext();
      const secondUi = await this.accountsComponent.getActiveAccount();
      const secondAccount = this.findAccountByIdentity(
        accounts,
        secondUi.rawText
      );
      const movedToDifferentAccount =
        normalizeDashboardAccountNumber(secondAccount.accountNumber) !==
        normalizeDashboardAccountNumber(firstAccount.accountNumber);
      expect(
        movedToDifferentAccount,
        'Accounts Next must activate a different account identity.'
      ).toBe(true);

      await this.accountsComponent.movePrevious();
      const returnedUi = await this.accountsComponent.getActiveAccount();
      const returnedAccount = this.findAccountByIdentity(
        accounts,
        returnedUi.rawText
      );
      const returnedToOriginal =
        normalizeDashboardAccountNumber(returnedAccount.accountNumber) ===
        normalizeDashboardAccountNumber(firstAccount.accountNumber);

      await this.attachComparison('accounts-previous-navigation', {
        matchedRecordIdentity: 'accounts-carousel',
        expected: {
          first: maskIdentifier(firstAccount.accountNumber),
          second: maskIdentifier(secondAccount.accountNumber),
          returned: maskIdentifier(firstAccount.accountNumber),
        },
        actual: {
          first: maskIdentifier(firstAccount.accountNumber),
          second: maskIdentifier(secondAccount.accountNumber),
          returned: maskIdentifier(returnedAccount.accountNumber),
        },
        comparisonOutcome: returnedToOriginal ? 'PASS' : 'FAIL',
      });
      expect(
        returnedToOriginal,
        'Accounts Previous must restore the original account identity.'
      ).toBe(true);
    });
  }

  async openAccountsManagement(): Promise<void> {
    await allure.step('Open Accounts management from the Dashboard', async () => {
      await this.accountsComponent.openManage();
      await this.loading.waitForCompletion();
      await expect( this.repository.locator('PORTAL.DASHBOARD.DESTINATION.ACCOUNTS_HEADING')).toBeVisible();});
  }

  async openNewAccount(): Promise<void> {
    await allure.step('Open the approved new-account page', async () => {
      await this.accountsComponent.openNewAccount();
      await this.assertDashboardDestination(
        ROUTES.portal.openNewAccount,
        'PORTAL.DASHBOARD.DESTINATION.OPEN_NEW_ACCOUNT_HEADING',
        'Open New Account',
        'open-new-account-navigation'
      );
    });
  }

  async assertPortfolioDefaultsToAssets(api: DashboardApiSnapshot): Promise<void> {
    await allure.step('Verify My Portfolio defaults to API-backed I Have data', async () => {
      expect(await this.portfolioComponent.getActiveMode()).toBe('I Have');

      const expectedPortfolio = calculateAssetPortfolio(api);
      const uiState = await this.portfolioComponent.readState();
      await this.assertPortfolioMatches(uiState, expectedPortfolio, 'I Have');
    });
  }

  async switchToLiabilitiesAndAssertMatches(api: DashboardApiSnapshot): Promise<void> {
    await allure.step('Switch My Portfolio to API-backed I Owe data', async () => {
      const assetsState = await this.portfolioComponent.readState();
      const assetsChart =await this.portfolioComponent.captureChartScreenshot();

      await this.portfolioComponent.selectLiabilities();

      const expectedPortfolio = calculateLiabilityPortfolio(api);
      const liabilitiesState = await this.portfolioComponent.readState();
      const liabilitiesChart = await this.portfolioComponent.captureChartScreenshot();
      expect(liabilitiesState.mode).toBe('I Owe');
      expect(liabilitiesState.panelText).not.toBe(assetsState.panelText);
      expect(liabilitiesChart.equals(assetsChart)).toBe(false);

      const expectedAssets = calculateAssetPortfolio(api);
      if (!decimalsEqual(expectedAssets.total, expectedPortfolio.total)) {
        expect(
          decimalToString(
            parseDecimal(
              liabilitiesState.displayedTotal,
              'I Owe displayed total'
            )
          )
        ).not.toBe(
          decimalToString(
            parseDecimal(
              assetsState.displayedTotal,
              'I Have displayed total'
            )
          )
        );
      }

      await this.assertPortfolioMatches(liabilitiesState, expectedPortfolio, 'I Owe');
    });
  }

  async assertPortfolioAssetsTotalMatchesWelcome(
    api: DashboardApiSnapshot
  ): Promise<void> {
    await allure.step('Verify Portfolio I Have total matches Welcome I Have', async () => {
      const expectedPortfolio = calculateAssetPortfolio(api);
      const welcomeSummary = await this.getWelcomeSummary('I Have');
      const uiState = await this.portfolioComponent.readState();
      const welcomeValue = parseDecimal(
        welcomeSummary.displayedValue,
        'Welcome I Have displayed value'
      );
      const portfolioValue = parseDecimal(
        uiState.displayedTotal,
        'Portfolio I Have displayed total'
      );

      expect(uiState.mode).toBe('I Have');
      expect(welcomeSummary.currency).toBe('EGP');
      expect(normalizeText(await this.currencySelector.innerText())).toBe('EGP');
      expect(decimalsEqual(welcomeValue, expectedPortfolio.total)).toBe(true);
      expect(
        decimalsEqual(portfolioValue, expectedPortfolio.roundedDisplayTotal)
      ).toBe(true);

      await this.attachComparison('portfolio-total-comparison', {
        matchedRecordIdentity: 'authenticated-customer-i-have',
        expected: {
          welcomeExactTotal: decimalToString(expectedPortfolio.total),
          portfolioRoundedTotal: decimalToString(
            expectedPortfolio.roundedDisplayTotal
          ),
          currency: 'EGP',
        },
        actual: {
          welcomeExactTotal: decimalToString(welcomeValue),
          portfolioRoundedTotal: decimalToString(portfolioValue),
          currency: 'EGP',
        },
        comparisonOutcome: 'PASS',
      });
    });
  }

  async assertPortfolioAssetBreakdownIsComplete(
    api: DashboardApiSnapshot
  ): Promise<void> {
    await allure.step('Verify the complete Portfolio I Have category breakdown', async () => {
      const expectedPortfolio = calculateAssetPortfolio(api);
      const uiState = await this.portfolioComponent.readState();
      const percentages = this.readPortfolioPercentages(uiState);

      expect(uiState.mode).toBe('I Have');
      expect([...percentages.keys()]).toEqual(
        expectedPortfolio.categories.map((category) => category.label)
      );
      this.assertExactDisplayedPercentages(percentages, expectedPortfolio);

      const displayedSum = [...percentages.values()].reduce(
        (total, percentage) => total + percentage,
        0
      );
      expect(displayedSum).toBeGreaterThanOrEqual(99);
      expect(displayedSum).toBeLessThanOrEqual(101);

      if (expectedPortfolio.total.units !== 0n) {
        const exactSum = expectedPortfolio.categories.reduce(
          (total, category) => total + category.percentage,
          0
        );
        expect(exactSum).toBeCloseTo(100, 10);
      }

      await this.attachPortfolioPercentageComparison(
        'portfolio-category-percentage-comparison',
        expectedPortfolio,
        percentages
      );
    });
  }

  async assertPortfolioAssetPercentagesMatch(
    api: DashboardApiSnapshot
  ): Promise<void> {
    await allure.step('Verify each Portfolio I Have percentage uses its exact proportion', async () => {
      const expectedPortfolio = calculateAssetPortfolio(api);
      const percentages = this.readPortfolioPercentages(
        await this.portfolioComponent.readState()
      );

      this.assertExactDisplayedPercentages(percentages, expectedPortfolio);
      await this.attachPortfolioPercentageComparison(
        'portfolio-individual-percentage-comparison',
        expectedPortfolio,
        percentages
      );
    });
  }

  async assertZeroValueAssetCategoryRemainsVisible(
    api: DashboardApiSnapshot
  ): Promise<void> {
    await allure.step('Verify zero-value I Have categories remain visible as 0%', async () => {
      const expectedPortfolio = calculateAssetPortfolio(api);
      const zeroCategories = expectedPortfolio.categories.filter(
        (category) => category.value.units === 0n
      );
      expect(
        zeroCategories.length,
        'The zero-category case requires at least one exact zero I Have category.'
      ).toBeGreaterThan(0);

      const uiState = await this.portfolioComponent.readState();
      const percentages = this.readPortfolioPercentages(uiState);

      expect(uiState.mode).toBe('I Have');
      expect([...percentages.keys()]).toEqual(
        expectedPortfolio.categories.map((category) => category.label)
      );
      this.assertExactDisplayedPercentages(
        percentages,
        expectedPortfolio
      );

      for (const category of zeroCategories) {
        expect(
          percentages.get(category.label),
          `${category.label} must remain visible as 0%.`
        ).toBe(0);
      }

      await this.attachComparison('portfolio-zero-category-comparison', {
        matchedRecordIdentity: 'authenticated-customer-i-have-categories',
        expected: zeroCategories.map((category) => ({
          label: category.label,
          exactValue: decimalToString(category.value),
          displayedPercentage: 0,
        })),
        actual: zeroCategories.map((category) => ({
          label: category.label,
          displayedPercentage: percentages.get(category.label),
        })),
        comparisonOutcome: 'PASS',
      });
    });
  }

  async assertDepositContributionMatchesPortfolio(
    api: DashboardApiSnapshot
  ): Promise<void> {
    await allure.step('Verify eligible deposits contribute to I Have and Portfolio Deposits', async () => {
      const eligibleDeposits = api.deposits.filter((deposit) =>
        ['MF', 'CD', 'TD'].includes(deposit.depositType)
      );
      expect(
        eligibleDeposits.length,
        'At least one eligible Mutual Fund, CD, or TD record is required.'
      ).toBeGreaterThan(0);

      const activeDeposit = await this.depositsComponent.getActiveDeposit();
      const activeAmount = parseDecimal(
        activeDeposit.totalAmount,
        'active deposit total amount'
      );
      const matchingDeposits = eligibleDeposits.filter((deposit) =>
        decimalsEqual(
          activeAmount,
          parseDecimal(deposit.totalAmount, 'eligible deposit API amount')
        ) &&
        activeDeposit.rawText.includes(formatApiDate(deposit.maturityDate)) &&
        activeDeposit.rawText.includes(deposit.currency)
      );
      expect(
        matchingDeposits.length,
        'The active deposit must uniquely match an eligible API record.'
      ).toBe(1);

      const expectedPortfolio = calculateAssetPortfolio(api);
      const expectedDeposits = this.getExpectedPortfolioCategory(
        expectedPortfolio,
        'Deposits'
      );
      await this.assertWelcomeSummaryValue(
        'I Have',
        expectedPortfolio.total,
        'deposits-welcome-i-have-comparison'
      );
      const percentages = this.readPortfolioPercentages(
        await this.portfolioComponent.readState()
      );
      expect(percentages.get('Deposits')).toBe(
        expectedDeposits.displayedPercentage
      );

      await this.attachComparison('deposits-contribution-comparison', {
        matchedRecordIdentity: 'eligible-deposit-collection',
        expected: {
          eligibleRecordCount: eligibleDeposits.length,
          exactDepositsTotal: decimalToString(expectedDeposits.value),
          displayedPercentage: expectedDeposits.displayedPercentage,
        },
        actual: {
          activeRecord: maskIdentifier(matchingDeposits[0].productId),
          exactDepositsTotal: decimalToString(expectedDeposits.value),
          displayedPercentage: percentages.get('Deposits'),
        },
        comparisonOutcome: 'PASS',
      });
    });
  }

  async moveToNextCardAndAssertMatches(cards: readonly DashboardCard[]): Promise<void> {
    await allure.step('Move to the next card and verify its API-backed values', async () => {
      expect(cards.length, 'Cards API must contain at least two records.').toBeGreaterThanOrEqual(2);
      const previousCard = await this.cardsComponent.getActiveCard();

      await this.cardsComponent.moveNext();

      const currentCard = await this.cardsComponent.getActiveCard();
      expect(normalizeText(currentCard.cardLimit)).not.toBe(
        normalizeText(previousCard.cardLimit)
      );
      expect(currentCard.identity).not.toBe(previousCard.identity);

      const matchingCards = cards.filter( (card) =>normalizeText(card.productName) ===normalizeText(currentCard.identity));
      expect( matchingCards.length, `The displayed card identity "${currentCard.identity}" must uniquely match the cards API.`).toBe(1);
      await this.assertCardFields(matchingCards[0], currentCard);
    });
  }

  async openCardsManagement(): Promise<void> {
    await allure.step('Open Cards management from the Dashboard', async () => {
      await this.cardsComponent.openManage();
      await this.assertDashboardDestination(
        ROUTES.portal.cards,
        'PORTAL.DASHBOARD.DESTINATION.CARDS_HEADING',
        'Cards',
        'cards-manage-navigation'
      );
    });
  }

  async assertActiveDepositMatches(deposits: readonly DashboardDeposit[]): Promise<void> {
    await allure.step('Verify the active deposit or investment matches the products API', async () => {
      const activeDeposit = await this.depositsComponent.getActiveDeposit();
      const activeText = activeDeposit.rawText;
      const amount = parseDecimal(
        activeDeposit.totalAmount,
        'active deposit total amount'
      );
      const matchingDeposits = deposits.filter((deposit) => {
        const expectedAmount = parseDecimal(deposit.totalAmount, 'deposit API total amount');
        return (
          decimalsEqual(amount, expectedAmount) &&
          activeText.includes(formatApiDate(deposit.maturityDate)) &&
          activeText.includes(deposit.currency)
        );
      });

      expect(
        matchingDeposits.length,
        'The active deposit must uniquely match an API record by amount, maturity date, and currency.'
      ).toBe(1);
      const deposit = matchingDeposits[0];
      const expectedTypeLabel = this.depositTypeLabel(deposit.depositType);
      const displayedRate = extractPercentage(activeText, 'active deposit interest rate');
      const displayedRateText = `${decimalToString(displayedRate)}%`;
      const displayedType = normalizeText(activeText.slice(0, activeText.indexOf(displayedRateText)));
      const typeMatches = displayedType === expectedTypeLabel;
      const rateMatches = decimalsEqual(
        displayedRate,
        parseDecimal(deposit.interestRate, 'deposit API interest rate')
      );

      await this.attachComparison('deposit-api-comparison', {
        matchedRecordIdentity: maskIdentifier(deposit.productId),
        expected: {
          productType: expectedTypeLabel,
          interestRate: decimalToString(parseDecimal(deposit.interestRate, 'deposit rate')),
          maturityDate: formatApiDate(deposit.maturityDate),
          currency: deposit.currency,
          totalAmount: decimalToString(parseDecimal(deposit.totalAmount, 'deposit amount')),
        },
        actual: {
          productType: displayedType,
          interestRate: decimalToString(displayedRate),
          maturityDate: formatApiDate(deposit.maturityDate),
          currency: deposit.currency,
          totalAmount: decimalToString(amount),
        },
        comparisonOutcome: typeMatches && rateMatches ? 'PASS' : 'FAIL',
      });
      expect(typeMatches, 'Displayed deposit type must match the API-backed product type.').toBe(true);
      expect(rateMatches).toBe(true);
    });
  }

  async openDepositsManagement(): Promise<void> {
    await allure.step('Open Investments management from the Dashboard', async () => {
      await this.depositsComponent.openManage();
      await this.assertDashboardDestination(
        ROUTES.portal.investments,
        'PORTAL.DASHBOARD.DESTINATION.INVESTMENTS_HEADING',
        'Investments',
        'deposits-manage-navigation',
        {
          requireProductIdentity: true,
          queryType: 'TD',
        }
      );
    });
  }

  async openNewDeposit(): Promise<void> {
    await allure.step('Open the approved new-deposit booking flow', async () => {
      await this.depositsComponent.openNewDeposit();
      await this.assertDashboardDestination(
        ROUTES.portal.bookTimeDeposit,
        'PORTAL.DASHBOARD.DESTINATION.NEW_DEPOSIT_HEADING',
        'New Deposit',
        'open-new-deposit-navigation'
      );
    });
  }

  async moveToNextLoanAndAssertMatches(loans: readonly DashboardLoan[]): Promise<void> {
    await allure.step('Move to the next loan and verify its API-backed values', async () => {
      expect(loans.length, 'Loans API must contain at least two records.').toBeGreaterThanOrEqual(2);
      const previousUiLoan = await this.loansComponent.getActiveLoan();
      const previousLoan = this.findLoanByIdentity(loans, previousUiLoan.rawText);
      const previousProgress = extractPercentage(
        previousUiLoan.progressText,
        'previous loan progress'
      );

      await this.loansComponent.moveNext();

      const activeUiLoan = await this.loansComponent.getActiveLoan();
      const activeLoan = this.findLoanByIdentity(loans, activeUiLoan.rawText);
      const activeProgress = extractPercentage(
        activeUiLoan.progressText,
        'active loan progress'
      );
      expect(activeLoan.loanId).not.toBe(previousLoan.loanId);
      expect(decimalToString(activeProgress)).not.toBe(decimalToString(previousProgress));
      expect(decimalToNumber(activeProgress)).toBeGreaterThanOrEqual(0);
      expect(decimalToNumber(activeProgress)).toBeLessThanOrEqual(100);
      await this.assertLoanFields(activeLoan, activeProgress, activeUiLoan);
    });
  }

  async assertActiveLoanProgressMatchesDisplayedPercentage(): Promise<void> {
    await allure.step('Verify loan progress fill matches the displayed percentage paid', async () => {
      const uiLoan = await this.loansComponent.getActiveLoan();
      const displayedPercentage = extractPercentage(
        uiLoan.displayedPaidPercentage,
        'displayed loan percentage paid'
      );
      let progressSource: 'aria-valuenow' | 'fill-width-ratio';
      let actualProgress: DecimalValue;

      if (uiLoan.progressAriaValue) {
        progressSource = 'aria-valuenow';
        actualProgress = parseDecimal(
          uiLoan.progressAriaValue,
          'loan progress aria-valuenow'
        );
      } else {
        expect(
          uiLoan.progressFillRatio,
          'Loan progress fill ratio must be available when aria-valuenow is absent.'
        ).toBeDefined();
        progressSource = 'fill-width-ratio';
        actualProgress = roundDecimal(
          parseDecimal(
            (uiLoan.progressFillRatio as number).toString(),
            'loan progress fill ratio'
          ),
          0
        );
      }

      expect(
        decimalsEqual(actualProgress, displayedPercentage),
        'The semantic or style-derived loan progress must exactly equal the displayed whole percentage.'
      ).toBe(true);

      await this.attachComparison('loan-progress-comparison', {
        matchedRecordIdentity: 'active-dashboard-loan',
        expected: {
          displayedPercentage: `${decimalToString(displayedPercentage)}%`,
        },
        actual: {
          source: progressSource,
          derivedPercentage: `${decimalToString(actualProgress)}%`,
        },
        comparisonOutcome: 'PASS',
      });
    });
  }

  async openLoansManagement(): Promise<void> {
    await allure.step('Open Loans management from the Dashboard', async () => {
      await this.loansComponent.openManage();
      await this.assertDashboardDestination(
        ROUTES.portal.loans,
        'PORTAL.DASHBOARD.DESTINATION.LOANS_HEADING',
        'Loans',
        'loans-manage-navigation',
        {
          requireProductIdentity: true,
        }
      );
    });
  }

  async assertRequiredWidgetsAreReady(): Promise<void> {
    await allure.step('Verify all required Dashboard widgets are ready', async () => {
      await this.assertDashboardIsLoaded();
      await this.cardsComponent.assertReady();
      await this.portfolioComponent.assertReady();

      await this.accountsComponent.assertReady();
      await this.depositsComponent.assertReady();
      await this.loansComponent.assertReady();
    });
  }

  private async selectAggregateCurrency(currency: string): Promise<void> {
    const currentCurrency = normalizeText(
      await this.currencySelector.innerText()
    );
    expect(
      currentCurrency,
      'The aggregate currency interaction must select a different currency.'
    ).not.toBe(currency);

    await this.currencySelector.click();
    const option = this.currencyOption(currency);
    await expect(option).toHaveCount(1);
    await expect(option).toBeVisible();
    await expect(option).toBeEnabled();
    await option.click();
    await this.loading.waitForCompletion();
    await expect(this.currencySelector).toHaveText(currency);
  }

  private async readAllDisplayedAccounts(
    accounts: readonly DashboardAccount[]
  ): Promise<ReadonlyMap<string, DashboardAccountDisplayValue>> {
    const itemCount = await this.accountsComponent.getItemCount();
    const displayedAccounts = new Map<string, DashboardAccountDisplayValue>();

    for (let index = 0; index < itemCount; index += 1) {
      const uiAccount = await this.accountsComponent.findActiveAccount();

      if (uiAccount) {
        const account = this.findAccountByIdentity(accounts, uiAccount.rawText);
        const actualBalance = parseDecimal(
          uiAccount.availableBalance,
          'displayed account balance'
        );
        const expectedBalance = parseDecimal(
          account.availableBalance,
          'account API balance'
        );

        expect(uiAccount.rawText).toContain(account.currency);
        expect(decimalsEqual(actualBalance, expectedBalance)).toBe(true);
        expect(
          displayedAccounts.has(account.accountNumber),
          'Each Accounts carousel item must expose a unique account identity.'
        ).toBe(false);
        displayedAccounts.set(account.accountNumber, {
          currency: account.currency,
          balance: decimalToString(actualBalance),
        });
      }

      if (index < itemCount - 1) {
        await this.accountsComponent.moveNext();
      }
    }

    expect(
      displayedAccounts.size,
      'The Accounts carousel must expose at least two distinct account products.'
    ).toBeGreaterThanOrEqual(2);
    return displayedAccounts;
  }

  private async readDisplayedAccountRecords(
    accounts: readonly DashboardAccount[]
  ): Promise<readonly DashboardMatchedAccountUi[]> {
    const itemCount = await this.accountsComponent.getItemCount();
    const displayedAccounts: DashboardMatchedAccountUi[] = [];
    const matchedIdentities = new Set<string>();

    for (let index = 0; index < itemCount; index += 1) {
      const ui = await this.accountsComponent.findActiveAccount();

      if (ui) {
        const account = this.findAccountByIdentity(
          accounts,
          ui.rawText
        );
        const identity = normalizeDashboardAccountNumber(
          account.accountNumber
        );
        expect(
          matchedIdentities.has(identity),
          'Each Dashboard account card must expose a unique API-backed identity.'
        ).toBe(false);
        matchedIdentities.add(identity);
        displayedAccounts.push({ account, ui });
      }

      if (index < itemCount - 1) {
        await this.accountsComponent.moveNext();
      }
    }

    return displayedAccounts;
  }

  private async getWelcomeSummary(
    label: DashboardSummaryLabel
  ): Promise<DashboardSummaryUiValue> {
    const summaries = await this.welcomeComponent.getSummaryValues();
    const matches = summaries.filter((summary) => summary.label === label);
    expect(matches, `${label} must appear exactly once in Welcome.`).toHaveLength(1);
    return matches[0];
  }

  private async assertWelcomeSummaryValue(
    label: DashboardSummaryLabel,
    expectedValue: DecimalValue,
    attachmentName: string
  ): Promise<void> {
    const summary = await this.getWelcomeSummary(label);
    const actualValue = parseDecimal(
      summary.displayedValue,
      `${label} displayed value`
    );
    const matches = decimalsEqual(actualValue, expectedValue);

    await this.attachComparison(attachmentName, {
      matchedRecordIdentity: `authenticated-customer-${label.toLowerCase().replaceAll(' ', '-')}`,
      expected: {
        currency: 'EGP',
        value: decimalToString(expectedValue),
      },
      actual: {
        currency: summary.currency,
        value: decimalToString(actualValue),
      },
      comparisonOutcome: matches && summary.currency === 'EGP' ? 'PASS' : 'FAIL',
    });
    expect(summary.currency).toBe('EGP');
    expect(
      matches,
      `${label} must match the exact API-derived value.`
    ).toBe(true);
  }

  private readPortfolioPercentages(
    uiState: DashboardPortfolioUiState
  ): ReadonlyMap<string, number> {
    const percentages = new Map<string, number>();

    for (const category of uiState.categories) {
      expect(
        percentages.has(category.label),
        `Portfolio category ${category.label} must be unique.`
      ).toBe(false);
      percentages.set(
        category.label,
        decimalToNumber(
          extractPercentage(
            category.percentageText,
            `${category.label} portfolio percentage`
          )
        )
      );
    }

    return percentages;
  }

  private assertExactDisplayedPercentages(
    actualPercentages: ReadonlyMap<string, number>,
    expectedPortfolio: DashboardPortfolioExpectation
  ): void {
    for (const category of expectedPortfolio.categories) {
      const actualPercentage = actualPercentages.get(category.label);
      expect(
        actualPercentage,
        `${category.label} must appear in the Portfolio legend.`
      ).toBeDefined();
      expect(
        actualPercentage,
        `${category.label} must use its independently rounded exact percentage.`
      ).toBe(category.displayedPercentage);
    }
  }

  private async attachPortfolioPercentageComparison(
    attachmentName: string,
    expectedPortfolio: DashboardPortfolioExpectation,
    actualPercentages: ReadonlyMap<string, number>
  ): Promise<void> {
    await this.attachComparison(attachmentName, {
      matchedRecordIdentity: 'authenticated-customer-i-have-categories',
      expected: expectedPortfolio.categories.map((category) => ({
        label: category.label,
        exactValue: decimalToString(category.value),
        exactPercentage: category.percentage,
        displayedPercentage: category.displayedPercentage,
      })),
      actual: expectedPortfolio.categories.map((category) => ({
        label: category.label,
        displayedPercentage: actualPercentages.get(category.label),
      })),
      comparisonOutcome: 'PASS',
    });
  }

  private getExpectedPortfolioCategory(
    expectation: DashboardPortfolioExpectation,
    label: DashboardPortfolioCategoryExpectation['label']
  ): DashboardPortfolioCategoryExpectation {
    const matches = expectation.categories.filter(
      (category) => category.label === label
    );
    expect(matches, `${label} must be calculated exactly once.`).toHaveLength(1);
    return matches[0];
  }

  private async assertDashboardDestination(
    route: string,
    headingLocatorKey: string,
    heading: string,
    attachmentName: string,
    queryContract?: DashboardDestinationQueryContract
  ): Promise<void> {
    await this.loading.waitForCompletion();

    if (queryContract) {
      await expect(this.page).toHaveURL((url) => {
        const [actualRoute, queryString = ''] = url.hash.split('?');
        const query = new URLSearchParams(queryString);

        if (actualRoute !== route) {
          return false;
        }

        if (
          queryContract.requireProductIdentity &&
          !query.get('ProductIdent')?.trim()
        ) {
          return false;
        }

        if (
          queryContract.queryType &&
          query.get('queryType') !== queryContract.queryType
        ) {
          return false;
        }

        return true;
      }, {
        timeout: 60_000,
      });
    } else {
      const expectedUrl = portalHashRoute(route, this.page.url());
      await expect(this.page).toHaveURL(expectedUrl, {
        timeout: 60_000,
      });
    }

    const destinationHeading =
      this.repository.locator(headingLocatorKey);
    await expect(destinationHeading).toHaveCount(1);
    await expect(destinationHeading).toBeVisible();
    const currentUrl = new URL(this.page.url());
    const [, queryString = ''] = currentUrl.hash.split('?');
    const actualQuery = new URLSearchParams(queryString);

    await this.attachComparison(attachmentName, {
      matchedRecordIdentity: 'dashboard-destination',
      expected: {
        route,
        heading,
        selectedProductIdentity: queryContract?.requireProductIdentity
          ? 'required'
          : 'not-required',
        queryType: queryContract?.queryType,
      },
      actual: {
        route: currentUrl.hash.split('?')[0],
        heading,
        selectedProductIdentity: actualQuery.get('ProductIdent')
          ? 'present'
          : 'absent',
        queryType: actualQuery.get('queryType') ?? undefined,
      },
      comparisonOutcome: 'PASS',
    });
  }

  private async openTopNavigationDestination(
    controlLocatorKey: string,
    route: string,
    headingLocatorKey: string,
    heading: string
  ): Promise<void> {
    await allure.step(`Open ${heading} from the top navigation`, async () => {
      const control = this.repository.locator(controlLocatorKey);
      await this.clickAndAssertDestination(control, route, headingLocatorKey);
    });
  }

  private async clickAndAssertDestination(
    control: Locator,
    route: string,
    headingLocatorKey: string
  ): Promise<void> {
    //await expect(control).toHaveCount(1);
    await expect(control).toBeVisible();
    //await expect(control).toBeEnabled();
    await control.click();
    await this.loading.waitForCompletion();
    //await expect(this.page).toHaveURL((url) => url.hash.split('?')[0] === route);
    await expect(this.repository.locator(headingLocatorKey)).toBeVisible();
  }

  private findAccountByIdentity(
    accounts: readonly DashboardAccount[],
    activeText: string
  ): DashboardAccount {
    const normalizedActiveText =
      normalizeDashboardAccountNumber(activeText);
    const matches = accounts.filter((account) =>
      normalizedActiveText.includes(
        normalizeDashboardAccountNumber(account.accountNumber)
      )
    );
    expect(matches.length, 'Active account number must uniquely match the accounts API.').toBe(1);
    return matches[0];
  }

  private async assertAccountFields(
    account: DashboardAccount,
    uiAccount: DashboardAccountUi
  ): Promise<void> {
    const actualBalance = parseDecimal(
      uiAccount.availableBalance,
      'active account balance'
    );
    const expectedBalance = parseDecimal(account.availableBalance, 'account API balance');

    expect(uiAccount.rawText).toContain(account.accountName);
    expect(uiAccount.rawText).toContain(account.accountNumber);
    expect(uiAccount.rawText).toContain(account.currency);
    expect(decimalsEqual(actualBalance, expectedBalance)).toBe(true);
    await this.attachComparison('account-api-comparison', {
      matchedRecordIdentity: maskIdentifier(account.accountNumber),
      expected: {
        accountName: account.accountName,
        accountNumber: maskIdentifier(account.accountNumber),
        currency: account.currency,
        availableBalance: decimalToString(expectedBalance),
      },
      actual: {
        accountName: account.accountName,
        accountNumber: maskIdentifier(account.accountNumber),
        currency: account.currency,
        availableBalance: decimalToString(actualBalance),
      },
      comparisonOutcome: 'PASS',
    });
  }

  private async assertCardFields(
    card: DashboardCard,
    uiCard: DashboardCardUi
  ): Promise<void> {
    const values = {
      cardLimit: parseDecimal(uiCard.cardLimit, 'displayed card limit'),
      availableLimit: parseDecimal( uiCard.availableLimit, 'displayed available limit'),
      outstanding: parseDecimal( uiCard.outstanding, 'displayed card outstanding'),
    };
    const expectedCardLimit = parseDecimal(card.cardLimit, 'cards API card limit');
    const expectedAvailableLimit = parseDecimal(card.availableLimit, 'cards API available limit');
    const expectedOutstanding = parseDecimal(card.outstanding, 'cards API outstanding');
    expect(
      uiCard.currencies.cardLimit,
      `Expected Card Limit currency to be ${card.currency}, but the UI displayed ${uiCard.currencies.cardLimit}.`
    ).toBe(card.currency);
    expect(
      uiCard.currencies.availableLimit,
      `Expected Available Limit currency to be ${card.currency}, but the UI displayed ${uiCard.currencies.availableLimit}.`).toBe(card.currency);
    expect(
      uiCard.currencies.outstanding,
      `Expected Outstanding currency to be ${card.currency}, but the UI displayed ${uiCard.currencies.outstanding}.`).toBe(card.currency);
    expect(decimalsEqual(values.cardLimit, expectedCardLimit)).toBe(true);
    expect(decimalsEqual(values.availableLimit, expectedAvailableLimit)).toBe(true);
    expect(decimalsEqual(values.outstanding, expectedOutstanding)).toBe(true);
    await this.attachComparison('card-api-comparison', {
      matchedRecordIdentity: maskIdentifier(card.cardIdentifier),
      expected: {
        cardLimit: decimalToString(expectedCardLimit),
        availableLimit: decimalToString(expectedAvailableLimit),
        outstanding: decimalToString(expectedOutstanding),
      },
      actual: {
        cardLimit: decimalToString(values.cardLimit),
        availableLimit: decimalToString(values.availableLimit),
        outstanding: decimalToString(values.outstanding),
      },
      comparisonOutcome: 'PASS',
    });
  }

  private findLoanByIdentity(loans: readonly DashboardLoan[], activeText: string): DashboardLoan {
    const matches = loans.filter((loan) => activeText.includes(loan.loanId));
    expect(matches.length, 'Active loan ID must uniquely match the loans API.').toBe(1);
    return matches[0];
  }

  private async assertLoanFields(
    loan: DashboardLoan,
    progress: DecimalValue,
    uiLoan: DashboardLoanUi
  ): Promise<void> {
    const actualLoanAmount = parseDecimal(uiLoan.loanAmount,'displayed loan amount');
    const actualOutstanding = parseDecimal( uiLoan.outstandingAmount,'displayed loan outstanding');
    const expectedLoanAmount = parseDecimal(loan.loanAmount, 'loans API loan amount');
    const expectedOutstanding = parseDecimal( loan.outstandingAmount,'loans API outstanding amount');

    expect(uiLoan.rawText).toContain(loan.productName);
    expect(uiLoan.rawText).toContain(loan.loanId);
    expect(await this.loansComponent.getCurrencyOccurrenceCount(loan.currency)).toBe(2);
    expect(decimalsEqual(actualLoanAmount, expectedLoanAmount)).toBe(true);
    expect(decimalsEqual(actualOutstanding, expectedOutstanding)).toBe(true);
    await this.attachComparison('loan-api-comparison', {
      matchedRecordIdentity: maskIdentifier(loan.loanId),
      expected: {
        productName: loan.productName,
        loanAmount: decimalToString(expectedLoanAmount),
        outstanding: decimalToString(expectedOutstanding),
        progressContract: 'valid and updated for the matched active loan',
      },
      actual: {
        productName: loan.productName,
        loanAmount: decimalToString(actualLoanAmount),
        outstanding: decimalToString(actualOutstanding),
        progress: `${decimalToString(progress)}%`,
      },
      comparisonOutcome: 'PASS',
    });
  }

  private depositTypeLabel(depositType: string): string {
    const labels: Readonly<Record<string, string>> = {
      CD: 'Certificate of deposits',
      TD: 'Time of deposit',
    };
    const label = labels[depositType.toUpperCase()];

    if (!label) {
      throw new Error(`No approved Dashboard label is mapped for deposit type ${depositType}.`);
    }

    return label;
  }

  private async assertPortfolioMatches(
    uiState: DashboardPortfolioUiState,
    expectedPortfolio: DashboardPortfolioExpectation,
    stateName: 'I Have' | 'I Owe'
  ): Promise<void> {
    const displayedTotal = parseDecimal(uiState.displayedTotal, `${stateName} displayed total`);
    const percentages = new Map<string, number>();

    for (const category of uiState.categories) {
      percentages.set(
        category.label,
        decimalToNumber(
          extractPercentage(
            category.percentageText,
            `${category.label} portfolio percentage`
          )
        )
      );
    }

    await this.attachComparison(`${stateName.toLowerCase().replaceAll(' ', '-')}-portfolio-comparison`, {
      matchedRecordIdentity: `authenticated-customer-${stateName.toLowerCase().replaceAll(' ', '-')}`,
      expected: {
        total: decimalToString(expectedPortfolio.roundedDisplayTotal),
        categories: expectedPortfolio.categories.map((category) => category.label)},
      actual: {
        total: decimalToString(displayedTotal),
        categories: [...percentages.keys()],
      },
      comparisonOutcome: decimalsEqual(displayedTotal,expectedPortfolio.roundedDisplayTotal) ? 'PASS' : 'FAIL',
    });
    expect(
      decimalsEqual(
        displayedTotal,
        expectedPortfolio.roundedDisplayTotal
      ),
      `${stateName} total must match the API-derived total after whole-unit display rounding.`
    ).toBe(true);

    for (const category of expectedPortfolio.categories) {
      const actualPercentage = percentages.get(category.label);
      expect(actualPercentage, `${category.label} must appear in the ${stateName} legend.`).toBeDefined();

      if (category.value.units === 0n) {
        expect(actualPercentage).toBe(0);
        continue;
      }

      expect(
        Math.abs((actualPercentage as number) - category.percentage),
        `${category.label} percentage must be within one percentage point of API-derived rounding.`
      ).toBeLessThanOrEqual(1);
    }

  }

  private async attachComparison(
    name: string,
    comparison: Readonly<Record<string, unknown>>
  ): Promise<void> {
    await allure.attachment(name, JSON.stringify(comparison, null, 2), 'application/json');
  }
}
