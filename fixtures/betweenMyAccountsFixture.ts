import {
  test as crossSystemTest,
  expect,
} from './crossSystemFixture';
import { TransferBetweenOwnAccountsPage } from '../pages/portal-pages/transfers/TransferBetweenOwnAccountsPage';

type BetweenMyAccountsFixtures = {
  transferBetweenOwnAccountsPage: TransferBetweenOwnAccountsPage;
};

export const test = crossSystemTest.extend<BetweenMyAccountsFixtures>({
  transferBetweenOwnAccountsPage: async (
    { authenticatedTransferPage, page },
    use,
    testInfo
  ) => {
    void authenticatedTransferPage;

    const transferPage = new TransferBetweenOwnAccountsPage(page);

    await transferPage.navigateToTransferBetweenOwnAccounts(testInfo);

    await use(transferPage);
  },
});

export { expect };
