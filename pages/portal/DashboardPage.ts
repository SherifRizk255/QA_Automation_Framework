import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';

export class DashboardPage {
  readonly page: Page;
  readonly body: Locator;

  constructor(page: Page) {
    this.page = page;
    this.body = page.locator('body');
  }

  async expectLoaded(testInfo?: TestInfo): Promise<void> {
    // Leaving the /login route is the reliable post-login signal on this portal:
    // dashboard widgets render as skeletons long after navigation completes.
    // Allow up to 90 seconds — session switch is slow after active-session dismissal.
    await expect(this.page).not.toHaveURL(/\/login(?:$|[/?#])/i, { timeout: 90_000 });
    await expect(this.body).toBeAttached();

    const screenshotPath = path.resolve('reports', 'dashboard-after-login.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    if (testInfo) {
      await testInfo.attach('dashboard-after-login', {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }
}
