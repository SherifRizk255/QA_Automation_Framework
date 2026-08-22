import * as allure from 'allure-js-commons';
import { test } from '../../../fixtures/portalRepositoryFixture.js';

test.describe('Account Management regression', () => {
  test.describe.configure({ timeout: 120_000 });

  test(
    'SAIB-0062 | Verify that Transaction History drill-down shows full transaction details including Reference Number, Description, Amount, Running Balance, Value Date, and Beneficiary Name sourced from accountstatement API',
    {
      tag: [
        '@regression',
        '@account-management',
        '@transaction-history',
        '@api-ui',
        '@p1',
      ],
    },
    async ({ authenticatedAccountManagementPage: accountsPage }) => {
      await allure.testCaseId('SAIB-0062');
      await allure.parentSuite('Portal');
      await allure.feature('Account Management');
      await allure.suite('Account Management General');
      await allure.subSuite('Transaction History');
      await allure.story('Transaction drill-down API-to-UI validation');
      await allure.severity('critical');
      await allure.description(
        'Inspect enabled accounts in deterministic UI order, stop at the first same-action accountstatement response with transactions, and validate the selected transaction drill-down.'
      );

      const accountContext = await accountsPage.establishSelectedAccountContext();
      await accountsPage.validateTransactionDrillDown(accountContext);
    }
  );
});
