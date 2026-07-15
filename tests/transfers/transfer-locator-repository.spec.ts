import { test, expect } from '../../fixtures/portalRepositoryFixture';
import { getLocatorRepositoryUsage } from '../../utils/locatorRepository';

test.describe('Transfer Locator Repository Validation', () => {
  test('LR-TRANSFER-001 - Transfer shell consumes repository locators', async ({ authenticatedTransferPage }, testInfo) => {
    await authenticatedTransferPage.expectTransferHubLoaded(testInfo);

    const usage = getLocatorRepositoryUsage();
    expect(usage['TRANSFER.HUB_HEADING']).toBeGreaterThan(0);
    expect(usage['TRANSFER.SIDEBAR_TRANSFERS_LINK']).toBeGreaterThan(0);
  });

  test('LR-TRANSFER-002 - Transfer repository locators are reused without rediscovery', async ({ authenticatedTransferPage }) => {
    await authenticatedTransferPage.expectTransferShellReusable();

    const usage = getLocatorRepositoryUsage();
    expect(usage['TRANSFER.HUB_HEADING']).toBeGreaterThan(0);
    expect(usage['TRANSFER.LANGUAGE_TOGGLE']).toBeGreaterThan(0);
  });
});
