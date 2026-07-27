import * as allure from 'allure-js-commons';
import { test } from '../../../fixtures/portalRepositoryFixture.js';

test.describe('Dashboard Smoke Tests', () => {
  test.describe.configure({ timeout: 120_000 });

  test(
    'SAIB-N-0139 | the user clicks the SAIB logo, then the user is navigated to the Dashboard/home page',
    { tag: ['@smoke', '@dashboard', '@extended-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0139');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Extended Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description('Verify the SAIB logo opens the configured Dashboard route and heading.');

      await dashboardPage.openDashboardFromLogo();
    }
  );

  test(
    'SAIB-N-0140 | Verify Dashboard is the active top-navigation tab after dashboard load',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0140');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('critical');
      await allure.description('Verify Dashboard exposes its approved active navigation state.');

      await dashboardPage.assertDashboardTabIsActive();
    }
  );

  test(
    'SAIB-N-0141 | the user clicks the "Accounts" tab, then the user is routed to the Accounts page',
    { tag: ['@smoke', '@dashboard', '@extended-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0141');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Extended Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description('Verify Accounts navigation opens its configured route and heading.');

      await dashboardPage.openAccounts();
    }
  );

  test(
    'SAIB-N-0142 | Verify Transfers navigation opens Between My Accounts',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0142');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('critical');
      await allure.description('Verify Transfers opens Between My Accounts without starting a transaction.');

      await dashboardPage.openTransfers();
    }
  );

  test(
    'SAIB-N-0143 | the user clicks the "Cards" tab, then the user is routed to the Cards page',
    { tag: ['@smoke', '@dashboard', '@extended-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0143');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Extended Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description('Verify Cards navigation opens its configured route and heading.');

      await dashboardPage.openCards();
    }
  );

  test(
    'SAIB-N-0144 | the user clicks the "Loans" tab, then the user is routed to the Loans page',
    { tag: ['@smoke', '@dashboard', '@extended-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0144');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Extended Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description('Verify Loans navigation opens its configured route and heading.');

      await dashboardPage.openLoans();
    }
  );

  test(
    'SAIB-N-0145 | the user clicks the "Investments" tab, then the user is routed to the Investments page',
    { tag: ['@smoke', '@dashboard', '@extended-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0145');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Extended Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description('Verify Investments navigation opens its configured route and heading.');

      await dashboardPage.openInvestments();
    }
  );

  test(
    'SAIB-N-0146 | the user clicks "More", then user is navigated to More page',
    { tag: ['@smoke', '@dashboard', '@extended-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0146');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Extended Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description('Verify More navigation opens its configured route and heading.');

      await dashboardPage.openMore();
    }
  );

  test(
    'SAIB-N-0149 | Verify avatar navigation opens Profile Details',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0149');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Top Navigation Bar');
      await allure.severity('critical');
      await allure.description('Verify the customer avatar opens Profile Details.');

      await dashboardPage.openProfile();
    }
  );

  test(
    'SAIB-N-0152 | Verify the dashboard currency defaults to EGP',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0152');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Header Info Bar');
      await allure.severity('critical');
      await allure.description('Verify a new authenticated Dashboard session defaults to EGP.');

      await dashboardPage.assertDefaultCurrencyIsEgp();
    }
  );

  test(
    'SAIB-N-0154 | Verify the welcome message matches the customer-profile API name',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0154');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Welcome Banner');
      await allure.severity('critical');
      await allure.description('Compare the welcome name with the authoritative profile API response.');

      await dashboardPage.assertWelcomeNameMatchesProfile(dashboardApi.profile);
    }
  );

  test(
    'SAIB-N-0159 | Verify Net Worth, I Have, and I Owe use the selected EGP currency',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0159');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Welcome Banner');
      await allure.severity('critical');
      await allure.description('Verify all three Dashboard summary values use EGP and valid numbers.');

      await dashboardPage.assertSummaryValuesUseSelectedCurrency();
    }
  );

  test(
    'SAIB-0046 | Verify the Accounts card matches the accounts API and displays the approved full account number',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-0046');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Accounts Widget');
      await allure.severity('critical');
      await allure.description('Match the active account to API identity and compare every required field.');

      await dashboardPage.assertActiveAccountMatches(dashboardApi.accounts);
    }
  );

  test(
    'SAIB-N-0163 | Verify Accounts carousel moves to the next API-backed account',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0163');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Accounts Widget');
      await allure.severity('critical');
      await allure.description('Verify Accounts Next changes identity and loads the matching API record.');

      await dashboardPage.moveToNextAccountAndAssertMatches(dashboardApi.accounts);
    }
  );

  test(
    'SAIB-N-0169 | Verify Accounts Manage opens the Accounts management page',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0169');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Accounts Widget');
      await allure.severity('critical');
      await allure.description('Verify Manage Accounts opens the centralized route and Accounts heading.');

      await dashboardPage.openAccountsManagement();
    }
  );

  test(
    'SAIB-N-0172 | Verify My Portfolio defaults to I Have using API-backed asset data',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0172');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('My Portfolio Widget');
      await allure.severity('critical');
      await allure.description('Verify I Have is selected and matches API-derived asset data.');

      await dashboardPage.assertPortfolioDefaultsToAssets(dashboardApi);
    }
  );

  test(
    'SAIB-N-0173 | Verify switching My Portfolio to I Owe re-renders liability data',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0173');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('My Portfolio Widget');
      await allure.severity('critical');
      await allure.description('Verify I Owe changes the chart and matches API-derived liabilities.');

      await dashboardPage.switchToLiabilitiesAndAssertMatches(dashboardApi);
    }
  );

  test(
    'SAIB-N-0181 | Verify Cards carousel updates values to the next API-backed card',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0181');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Cards Widget');
      await allure.severity('critical');
      await allure.description('Verify Cards Next selects a new identity and updates all API-backed figures.');

      await dashboardPage.moveToNextCardAndAssertMatches(dashboardApi.cards);
    }
  );

  test(
    'SAIB-N-0186 | Verify the active deposit/investment card matches API values',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0186');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Deposits and Investments Widget');
      await allure.severity('critical');
      await allure.description('Match the active deposit to API values including type, rate, date, and amount.');

      await dashboardPage.assertActiveDepositMatches(dashboardApi.deposits);
    }
  );

  test(
    'SAIB-N-0203 | Verify Loans carousel loads each loan independently from API data',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0203');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('Loans Widget');
      await allure.severity('critical');
      await allure.description('Verify Loans Next selects and renders a different API-backed loan.');

      await dashboardPage.moveToNextLoanAndAssertMatches(dashboardApi.loans);
    }
  );

  test(
    'SAIB-0115 | Verify the authenticated dashboard loads and renders all required widgets without a fatal UI error',
    { tag: ['@smoke', '@dashboard', '@core-smoke', '@regression'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-0115');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Smoke');
      await allure.subSuite('Core Smoke');
      await allure.story('General');
      await allure.severity('blocker');
      await allure.description('Verify Dashboard readiness and all five required widget contracts.');

      await dashboardPage.assertRequiredWidgetsAreReady();
    }
  );
});
