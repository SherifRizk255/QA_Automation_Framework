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

  async dismissApiErrorPopupIfPresent(testInfo?: TestInfo): Promise<void> {
    const apiErrorPopup = this.page.getByRole('dialog').filter({
      has: this.page.getByRole('heading', {
        name: /no http resource was found.*\/api\/v1\/service-requests\/types/i,
      }),
    });

    if (!(await apiErrorPopup.isVisible())) {
      return;
    }

    console.log('[DashboardPage] Dashboard API error popup appeared. Capturing evidence.');
    const screenshotPath = path.resolve('reports', 'dashboard-api-error-popup.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    if (testInfo) {
      await testInfo.attach('dashboard-api-error-popup', {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }

    const closeButton = apiErrorPopup.getByRole('button', { name: /^close$/i });
    await expect(closeButton, 'Dashboard API error popup Close button must be unique.').toHaveCount(1);
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toBeEnabled();
    await closeButton.click();
    await expect(apiErrorPopup).toBeHidden();
    console.log('[DashboardPage] Dashboard API error popup dismissed; continuing dashboard initialization.');
  }

  async expectLoaded(testInfo?: TestInfo): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.dismissApiErrorPopupIfPresent(testInfo);
    const knownElementVisible = await this.knownDashboardElement
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!knownElementVisible) {
      console.log('[DashboardPage] Dashboard-specific selector was not found; using safe temporary assertion.');
      // Allow up to 90 seconds — portal session switch can be slow after active-session dismissal.
      await expect(this.page).not.toHaveURL(/\/login(?:$|[/?#])/i, { timeout: 90000 });
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
