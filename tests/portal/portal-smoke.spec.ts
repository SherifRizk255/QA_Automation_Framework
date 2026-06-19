import { test } from '@playwright/test';
import { LoginPage } from '../../pages/portal/LoginPage.js';

test.describe('Internet Banking Portal - Smoke Tests', () => {
  test('IB-PORTAL-SMOKE-001 - Login page should load successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.expectLoginPageLoaded();
  });
});
