import {
  test,
  expect,
} from '../../../fixtures/portalRepositoryFixture';
import { getLocatorRepositoryUsage } from '../../../utils/locatorRepository';

test.describe('Transfer Locator Repository Validation', () => {
  test(
    'LR-TRANSFER-001 - Transfer shell consumes repository locators',
    async ({ authenticatedTransferPage }, testInfo) => {
      const usageBeforeValidation = getLocatorRepositoryUsage();

      await authenticatedTransferPage.expectTransferHubLoaded(testInfo);

      const usageAfterValidation = getLocatorRepositoryUsage();
      expect(
        (usageAfterValidation['TRANSFER.HUB_HEADING'] ?? 0) -
          (usageBeforeValidation['TRANSFER.HUB_HEADING'] ?? 0)
      ).toBeGreaterThan(0);
      expect(
        (usageAfterValidation['TRANSFER.SIDEBAR_TRANSFERS_LINK'] ?? 0) -
          (usageBeforeValidation['TRANSFER.SIDEBAR_TRANSFERS_LINK'] ?? 0)
      ).toBeGreaterThan(0);
    }
  );

  test(
    'LR-TRANSFER-002 - Transfer repository locators are reused without rediscovery',
    async ({ authenticatedTransferPage }) => {
      const usageBeforeValidation = getLocatorRepositoryUsage();

      await authenticatedTransferPage.expectTransferShellReusable();

      const usageAfterValidation = getLocatorRepositoryUsage();
      expect(
        (usageAfterValidation['TRANSFER.HUB_HEADING'] ?? 0) -
          (usageBeforeValidation['TRANSFER.HUB_HEADING'] ?? 0)
      ).toBeGreaterThan(0);
      expect(
        (usageAfterValidation['TRANSFER.LANGUAGE_TOGGLE'] ?? 0) -
          (usageBeforeValidation['TRANSFER.LANGUAGE_TOGGLE'] ?? 0)
      ).toBeGreaterThan(0);
    }
  );
});
