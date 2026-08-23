import { expect, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { BasePortalPage } from './BasePortalPage';

/**
 * Generic authenticated portal shell, used when no specific feature page is
 * needed yet — e.g. reading back the active role right after a role switch,
 * before navigating to a feature module.
 */
export class PortalShellPage extends BasePortalPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertDashboardVisible(): Promise<void> {
    await allure.step('Assert the Dashboard page is visible', async () => {
      await expect(this.repository.locator('PORTAL.SHELL.DASHBOARD_HEADING')).toBeVisible({ timeout: 30_000 });
    });
  }
}
