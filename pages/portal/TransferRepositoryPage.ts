import { expect, type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';
import { LocatorRepository } from '../../utils/locatorRepository';

export class TransferRepositoryPage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  async gotoTransferHub() {
    const loginUrl = process.env.PORTAL_LOGIN_URL ?? this.page.url();
    const transferUrl = loginUrl.replace(/#\/login.*$/i, '#/transfers/transfer-money');
    await this.page.goto(transferUrl);
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
