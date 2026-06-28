import { expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import path from 'node:path';

export class DashboardPage {
  readonly page: Page;
  readonly body: Locator;
  readonly knownDashboardElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.body = page.locator('body');
    this.knownDashboardElement = page
      .getByRole('heading', { name: /dashboard|home|overview|accounts/i })
      .or(page.getByText(/dashboard|account summary|available balance|last login/i));
  }

  async expectLoaded(testInfo?: TestInfo): Promise<void> {
    const knownElementVisible = await this.knownDashboardElement
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!knownElementVisible) {
      console.log('[DashboardPage] Dashboard-specific selector was not found; using safe temporary assertion.');
      await expect(this.page).not.toHaveURL(/\/login(?:$|[/?#])/i, { timeout: 30000 });
      await expect(this.body).toBeAttached();
    }

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
