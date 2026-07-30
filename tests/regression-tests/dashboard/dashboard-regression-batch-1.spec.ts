import * as allure from 'allure-js-commons';
import { test } from '../../../fixtures/portalRepositoryFixture.js';

test.describe('Dashboard Regression', () => {
 test.describe.configure({ timeout: 120_000 });

  test(
    'SAIB-N-0155 | Verify Welcome Net Worth equals I Have minus I Owe to the exact cent',
    { tag: ['@dashboard', '@regression', '@welcome'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0155');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('Welcome Banner');
      await allure.severity('normal');
      await allure.description('Verify exact Dashboard Net Worth from the approved asset and liability calculations.');

      await dashboardPage.assertWelcomeNetWorthMatches(dashboardApi);
    }
  );

  test(
    'SAIB-N-0123 | Verify Welcome I Have equals the approved aggregate asset calculation',
    { tag: ['@dashboard', '@regression','@welcome', '@assets'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0123');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('Welcome Banner');
      await allure.severity('normal');
      await allure.description('Verify I Have from approved Current/Saving accounts, eligible deposits, and Prepaid cards.');

      await dashboardPage.assertWelcomeAssetsMatch(dashboardApi);
    }
  );

  test(
    'SAIB-N-0124 | Verify Welcome I Owe equals the approved aggregate liability calculation',
    { tag: ['@dashboard', '@regression','@welcome', '@liabilities'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0124');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');;
      await allure.story('Welcome Banner');
      await allure.severity('normal');
      await allure.description('Verify I Owe from Credit Card, Loan, and hold-based Overdraft liabilities.');

      await dashboardPage.assertWelcomeLiabilitiesMatch(dashboardApi);
    }
  );

  test(
    'SAIB-N-0157 | Verify Welcome Net Worth, I Have and I Owe always display exactly two decimal digits',
    { tag: ['@dashboard', '@regression','@welcome', '@format'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0157');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');

      await allure.story('Welcome Banner');
      await allure.severity('normal');
      await allure.description(
        'Verify each Welcome monetary value is visibly formatted as #,##0.00.'
      );

      await dashboardPage.assertWelcomeMonetaryValuesUseTwoDecimalFormat();
    }
  );

  test(
    'SAIB-0146 | Verify each account balance remains in its native currency when the Dashboard aggregate currency changes',
    { tag: ['@dashboard', '@regression', '@accounts', '@currency'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-0146');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('Accounts Widget');
      await allure.severity('normal');
      await allure.description('Verify changing the Dashboard aggregate currency does not convert account-level values.');

      await dashboardPage.assertAccountBalancesRemainNativeAfterAggregateCurrencyChange( dashboardApi.accounts, 'USD');
    }
  );

  test(
    'SAIB-N-0174 | Verify the Portfolio I Have total matches the Welcome I Have aggregate',
    { tag: ['@dashboard', '@regression', '@portfolio', '@total'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0174');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('My Portfolio Widget');
      await allure.severity('normal');
      await allure.description( 'Verify exact Welcome I Have and its separately rounded Portfolio total.');

      await dashboardPage.assertPortfolioAssetsTotalMatchesWelcome(dashboardApi);
    }
  );

  test(
    'SAIB-N-0175 | Verify Accounts, Deposits and Cards percentages represent the complete I Have breakdown',
    { tag: ['@dashboard', '@regression', '@portfolio', '@percentages'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0175');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('My Portfolio Widget');
      await allure.severity('normal');
      await allure.description('Verify the complete ordered I Have breakdown, including zero categories and the 99–101 rounded sum rule.');

      await dashboardPage.assertPortfolioAssetBreakdownIsComplete(dashboardApi);
    }
  );

  test(
    'SAIB-N-0176 | Verify each displayed I Have category percentage matches its exact underlying proportion',
    { tag: ['@dashboard', '@regression', '@portfolio', '@percentages'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0176');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('My Portfolio Widget');
      await allure.severity('normal');
      await allure.description('Verify each category percentage is independently rounded from exact unrounded values.');

      await dashboardPage.assertPortfolioAssetPercentagesMatch(dashboardApi);
    }
  );

  test(
    'SAIB-N-0192 | Verify Mutual Funds and CD/TD amounts contribute correctly to I Have and the Portfolio Deposits category',
    { tag: ['@dashboard', '@regression', '@deposits', '@portfolio'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0192');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('Deposits and Investments Widget');
      await allure.severity('normal');
      await allure.description('Verify eligible MF, CD, and TD records share the exact Portfolio Deposits contribution.');

      await dashboardPage.assertDepositContributionMatchesPortfolio(dashboardApi);
    }
  );

  test(
    'SAIB-N-0199 | Verify the loan progress-bar fill exactly matches the displayed percentage paid',
    { tag: ['@dashboard', '@regression', '@loans', '@progress'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0199');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.story('Loans Widget');
      await allure.severity('normal');
      await allure.description( 'Verify aria-valuenow or the rounded rendered fill ratio exactly equals the displayed whole percentage.');

      await dashboardPage.assertActiveLoanProgressMatchesDisplayedPercentage();
    }
  );
});
