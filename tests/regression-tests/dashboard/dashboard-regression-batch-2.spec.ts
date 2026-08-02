import * as allure from 'allure-js-commons';
import { test } from '../../../fixtures/portalRepositoryFixture.js';

test.describe('Dashboard Regression Batch 2', () => {
  test.describe.configure({ timeout: 120_000 });

  test(
    'SAIB-N-0147 | Verify clicking the notification bell opens the notification panel',
    { tag: ['@dashboard', '@regression', '@batch-2', '@notifications'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0147');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description(
        'Verify the notification bell opens the visible notification panel without assuming notification API behavior.'
      );

      await dashboardPage.openNotificationPanel();
    }
  );

  test(
    'SAIB-N-0148 | Verify the notification panel displays the current empty state',
    { tag: ['@dashboard', '@regression', '@batch-2', '@notifications'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0148');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Top Navigation Bar');
      await allure.severity('normal');
      await allure.description(
        'Verify the opened notification panel displays the exact current empty-state message.'
      );

      await dashboardPage.assertNotificationPanelShowsEmptyState();
    }
  );

  test(
    'SAIB-N-0150 | Verify Last Login matches the profile API timestamp converted to Cairo time',
    { tag: ['@dashboard', '@regression', '@batch-2', '@last-login', '@timezone'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0150');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Header Info Bar');
      await allure.severity('normal');
      await allure.description(
        'Verify Last Login equals the profile UTC timestamp converted through Africa/Cairo at minute precision.'
      );

      await dashboardPage.assertLastLoginMatchesProfile(
        dashboardApi.profile
      );
    }
  );

  test(
    'SAIB-0134 | Verify only the login-defined primary account displays the Default badge',
    { tag: ['@dashboard', '@regression', '@batch-2', '@accounts', '@default'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-0134');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Accounts Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify exactly one account displays Default and its masked identity matches login-defined PrimaryAccount.'
      );

      await dashboardPage.assertOnlyPrimaryAccountIsDefault(dashboardApi);
    }
  );

  test(
    'SAIB-N-0162 | Verify a negative account balance is displayed with the approved sign and format',
    { tag: ['@dashboard', '@regression', '@batch-2', '@accounts', '@negative-balance'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0162');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Accounts Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify the API-backed negative account uses its exact native amount, currency, leading sign, grouping, and two decimals.'
      );

      await dashboardPage.assertNegativeAccountBalanceMatches(
        dashboardApi.accounts
      );
    }
  );

  test(
    'SAIB-N-0164 | Verify the Accounts previous control returns from the second account to the first account',
    { tag: ['@dashboard', '@regression', '@batch-2', '@accounts', '@carousel'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0164');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Accounts Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify Accounts Next changes identity and Previous restores the originally active account.'
      );

      await dashboardPage.moveToNextAccountThenPreviousAndAssertOriginal(
        dashboardApi.accounts
      );
    }
  );

  test(
    'SAIB-N-0167 | Verify Open New Account navigates to the approved account-opening page',
    { tag: ['@dashboard', '@regression', '@batch-2', '@accounts', '@navigation'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0167');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Accounts Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify the final Accounts action card opens the centralized new-account route and exact heading.'
      );

      await dashboardPage.openNewAccount();
    }
  );

  test(
    'SAIB-N-0177 | Verify a zero-value I Have category remains visible as 0%',
    { tag: ['@dashboard', '@regression', '@batch-2', '@portfolio', '@zero-category'] },
    async ({ authenticatedDashboardPage: dashboardPage, dashboardApi }) => {
      await allure.testCaseId('SAIB-N-0177');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('My Portfolio Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify the approved ordered I Have breakdown retains each exact zero category as 0%.'
      );

      await dashboardPage.assertZeroValueAssetCategoryRemainsVisible(
        dashboardApi
      );
    }
  );

  test(
    'SAIB-N-0182 | Verify Cards Manage navigates to the Cards page',
    { tag: ['@dashboard', '@regression', '@batch-2', '@cards', '@navigation'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0182');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Cards Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify Cards Manage opens the centralized Cards route and exact heading.'
      );

      await dashboardPage.openCardsManagement();
    }
  );

  test(
    'SAIB-N-0193 | Verify Deposits and Investments Manage navigates to the Investments page',
    { tag: ['@dashboard', '@regression', '@batch-2', '@deposits', '@navigation'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0193');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Deposits and Investments Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify Deposits and Investments Manage opens the selected deposit on the centralized deposits route with the Investments heading.'
      );

      await dashboardPage.openDepositsManagement();
    }
  );

  test(
    'SAIB-N-0195 | Verify Open New Deposit navigates to the TD booking flow',
    { tag: ['@dashboard', '@regression', '@batch-2', '@deposits', '@navigation'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0195');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Deposits and Investments Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify the final Deposits action card opens the centralized TD booking route and New Deposit heading.'
      );

      await dashboardPage.openNewDeposit();
    }
  );

  test(
    'SAIB-N-0204 | Verify Loans Manage navigates to the Loans page',
    { tag: ['@dashboard', '@regression', '@batch-2', '@loans', '@navigation'] },
    async ({ authenticatedDashboardPage: dashboardPage }) => {
      await allure.testCaseId('SAIB-N-0204');
      await allure.parentSuite('Portal');
      await allure.feature('Dashboard');
      await allure.suite('Dashboard Regression');
      await allure.subSuite('Batch 2');
      await allure.story('Loans Widget');
      await allure.severity('normal');
      await allure.description(
        'Verify Loans Manage opens the selected loan on the centralized Loans route with the exact heading.'
      );

      await dashboardPage.openLoansManagement();
    }
  );
});
