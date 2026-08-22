import * as allure from 'allure-js-commons';
import { test } from '../../../fixtures/portalRepositoryFixture.js';

test.describe('Account Management regression', () => {
  test.describe.configure({ timeout: 120_000 });

  test(
    'SAIB-0059 | Verify that Account Details page displays all real-time CBS account information including Account Number, IBAN, Product Name, Currency, Available Balance, Actual Balance, Hold Balance, Status, Opening Date, and Branch via details API',
    {
      tag: [
        '@regression',
        '@account-management',
        '@account-details',
        '@api-ui',
        '@p1',
      ],
    },
    async ({ authenticatedAccountManagementPage: accountsPage }) => {
      await allure.testCaseId('SAIB-0059');
      await allure.parentSuite('Portal');
      await allure.feature('Account Management');
      await allure.suite('Account Management General');
      await allure.story('Real-time Account Details');
      await allure.severity('critical');
      await allure.description(
        'Validate the visible Account Details against the getaccountdetail response captured from the same Accounts navigation.'
      );

      await accountsPage.verifyRealTimeAccountDetails();
    }
  );
});
