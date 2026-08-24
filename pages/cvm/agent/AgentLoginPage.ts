import { expect, type Page } from '@playwright/test';
import { CVM } from '../../../config/resources';

/**
 * CVM Agent & Management Portal — login + desk-assignment confirmation.
 * Each agent role (teller / operations / customerService) signs into its own
 * isolated browser context (docs/analysis/cvm-kiosk-walkthrough.md).
 */
export class AgentLoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(CVM.agentUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('button', { name: /login/i })).toBeVisible({ timeout: 30_000 });
  }

  /** Sign in, then confirm the assigned branch/desk to reach the serving home. */
  async login(username: string, password: string): Promise<void> {
    await this.page.locator('form input').first().fill(username);
    await this.page.locator('input[type="password"]').fill(password);
    await this.page.getByRole('button', { name: /login|sign in/i }).click();

    // Desk-assignment screen ("Welcome Back … Current Branch/Desk") → Confirm.
    const confirm = this.page.getByRole('button', { name: 'Confirm', exact: true });
    await confirm.click();
    await expect(this.page.getByRole('heading', { name: /^Hello/i })).toBeVisible({ timeout: 30_000 });
  }
}
