import { expect, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { LocatorRepository } from '../../utils/locatorRepository';
import { ENV, ROUTES, portalHashRoute } from '../../config/resources';

export class TransferRepositoryPage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  async gotoTransferHub() {
    // Fall back to the current page URL when PORTAL_LOGIN_URL is not configured.
    const baseUrl = ENV.portal.loginUrl || this.page.url();
    await this.page.goto(portalHashRoute(ROUTES.portal.transferHub, baseUrl));
  }

  async expectTransferHubLoaded(testInfo?: TestInfo) {
    await this.repository.validateVisible('TRANSFER.HUB_HEADING');
    await this.repository.validateVisible('TRANSFER.SIDEBAR_TRANSFERS_LINK');

    const screenshotPath = path.resolve('reports', 'transfer', 'repository-transfer-hub.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    if (testInfo) {
      await testInfo.attach('repository-transfer-hub', {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }

  async expectTransferShellReusable() {
    await this.repository.validateVisible('TRANSFER.HUB_HEADING');
    await this.repository.validateVisible('TRANSFER.LANGUAGE_TOGGLE');
  }
}
