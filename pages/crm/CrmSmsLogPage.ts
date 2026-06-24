import { type Page, type Locator, type TestInfo, expect } from '@playwright/test';
import path from 'node:path';
import { extractOtpFromMessage } from '../../utils/otpExtractor.ts';
import { maskOtp } from '../../utils/sensitiveDataMasker.ts';

const CRM_CREDENTIAL_PLACEHOLDERS = ['your-crm-username', 'your-crm-password', 'replace-with'];

function isCrmCredentialsConfigured(): boolean {
  const username = process.env.CRM_USERNAME ?? '';
  const password = process.env.CRM_PASSWORD ?? '';
  return (
    username.length > 0 &&
    password.length > 0 &&
    !CRM_CREDENTIAL_PLACEHOLDERS.some(p => username.includes(p)) &&
    !CRM_CREDENTIAL_PLACEHOLDERS.some(p => password.includes(p))
  );
}

export class CrmSmsLogPage {
  readonly page: Page;

  // Entity list (grid view)
  readonly gridRows: Locator;
  readonly firstRow: Locator;

  constructor(page: Page) {
    this.page = page;

    // Microsoft Dynamics 365 grid rows
    this.gridRows = page
      .locator('[data-id*="row"], .ms-List-cell, [role="row"]')
      .filter({ hasNot: page.locator('[role="columnheader"]') });

    this.firstRow = page
      .locator('[data-id="row-0"]')
      .or(page.locator('.ms-List-cell').first())
      .or(page.getByRole('row').nth(1)); // nth(1) skips the header row
  }

  /**
   * Validates CRM credentials are configured; throws with clear message if not.
   */
  static assertCredentialsConfigured(): void {
    if (!isCrmCredentialsConfigured()) {
      throw new Error(
        'CRM credentials not configured. Set CRM_USERNAME and CRM_PASSWORD in .env. ' +
        'Tests that require OTP retrieval from CRM will be skipped or fail until credentials are provided.'
      );
    }
  }

  async navigate(testInfo: TestInfo | null = null): Promise<void> {
    const crmUrl = process.env.CRM_SMS_LOG_URL ?? '';
    if (!crmUrl) {
      throw new Error('CRM_SMS_LOG_URL is not configured in .env');
    }

    console.log('[CrmSmsLogPage] Navigating to CRM SMS Log...');
    await this.page.goto(crmUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Handle Microsoft login redirect if needed
    const currentUrl = this.page.url();
    if (
      currentUrl.includes('login.microsoftonline.com') ||
      currentUrl.includes('login.microsoft.com') ||
      currentUrl.includes('login.live.com')
    ) {
      console.log('[CrmSmsLogPage] Microsoft login redirect detected — authenticating...');
      await this.loginWithMicrosoftCredentials();
    } else if (currentUrl.includes('signin') || currentUrl.includes('auth')) {
      console.log('[CrmSmsLogPage] Auth redirect detected — attempting login...');
      await this.loginWithMicrosoftCredentials();
    }

    // Wait for Dynamics entity list to load
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      console.warn('[CrmSmsLogPage] networkidle timeout — continuing...');
    });

    if (testInfo) {
      const shotPath = path.resolve('reports/system-walkthrough/forgot-password', 'crm-smslog-list.png');
      await this.page.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('crm-smslog-list', { path: shotPath, contentType: 'image/png' });
    }

    console.log('[CrmSmsLogPage] CRM SMS Log page loaded. URL:', this.page.url());
  }

  private async loginWithMicrosoftCredentials(): Promise<void> {
    CrmSmsLogPage.assertCredentialsConfigured();
    const username = process.env.CRM_USERNAME ?? '';
    const password = process.env.CRM_PASSWORD ?? '';

    // Email/username step
    const emailInput = this.page
      .getByPlaceholder(/email.*phone.*skype|enter.*email|username/i)
      .or(this.page.locator('input[type="email"], input[name="loginfmt"], input[name="username"]'))
      .first();

    await expect(emailInput).toBeVisible({ timeout: 30000 });
    await emailInput.fill(username);

    const nextBtn = this.page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Password step
    const pwdInput = this.page
      .getByPlaceholder(/password/i)
      .or(this.page.locator('input[type="password"]'))
      .first();

    await expect(pwdInput).toBeVisible({ timeout: 15000 });
    await pwdInput.fill(password);

    const signInBtn = this.page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeEnabled();
    await signInBtn.click();

    // Handle "Stay signed in?" prompt
    const stayNoBtn = this.page.getByRole('button', { name: /no/i });
    const stayNoVisible = await stayNoBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (stayNoVisible) {
      await stayNoBtn.click();
    }

    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    console.log('[CrmSmsLogPage] Microsoft login completed. URL:', this.page.url());
  }

  async openLatestSmsLog(testInfo: TestInfo | null = null): Promise<void> {
    console.log('[CrmSmsLogPage] Looking for latest SMS Log row...');
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // Strategy 1: data-id="row-0" (Dynamics 365 UCIv2)
    const row0 = this.page.locator('[data-id="row-0"]');
    const row0Visible = await row0.isVisible({ timeout: 10000 }).catch(() => false);

    if (row0Visible) {
      console.log('[CrmSmsLogPage] Found row-0, clicking...');
      await row0.click();
    } else {
      // Strategy 2: first data row in a role="row" table (skip header)
      const rows = this.page.getByRole('row');
      const rowCount = await rows.count();
      if (rowCount > 1) {
        console.log(`[CrmSmsLogPage] Found ${rowCount} rows, clicking first data row...`);
        await rows.nth(1).click(); // nth(0) is header
      } else {
        // Strategy 3: any clickable cell in the list
        const cell = this.page.locator('[data-id*="cell"], .ms-List-cell a').first();
        await expect(cell).toBeVisible({ timeout: 15000 });
        await cell.click();
      }
    }

    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    console.log('[CrmSmsLogPage] SMS Log record opened. URL:', this.page.url());

    if (testInfo) {
      const shotPath = path.resolve('reports/system-walkthrough/forgot-password', 'crm-smslog-record.png');
      await this.page.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('crm-smslog-record', { path: shotPath, contentType: 'image/png' });
    }
  }

  async extractOtp(testInfo: TestInfo | null = null): Promise<string> {
    console.log('[CrmSmsLogPage] Extracting OTP from Message Details...');
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    const messageText = await this.getMessageDetailsText();
    const otp = extractOtpFromMessage(messageText);

    console.log(`[CrmSmsLogPage] OTP extracted: ${maskOtp(otp)}`);

    if (testInfo) {
      const shotPath = path.resolve('reports/system-walkthrough/forgot-password', 'crm-message-details.png');
      await this.page.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('crm-message-details', { path: shotPath, contentType: 'image/png' });
      testInfo.annotations.push({
        type: 'info',
        description: `OTP extracted from CRM SMS Log: ${maskOtp(otp)}`,
      });
    }

    return otp;
  }

  private async getMessageDetailsText(): Promise<string> {
    // Try Dynamics field labels for "Message Details" or message body
    const locators: Locator[] = [
      // Standard Dynamics field by label
      this.page.getByLabel(/message.*detail|sms.*message|message.*body/i).first(),
      // Field value container by field name
      this.page.locator('[data-id*="message"] .fieldControl-text-box-text').first(),
      this.page.locator('[aria-label*="Message" i]').first(),
      // Textarea (common for long text fields in Dynamics)
      this.page.locator('textarea').first(),
      // Readonly text control
      this.page.locator('[data-id*="message"][class*="text"]').first(),
    ];

    for (const loc of locators) {
      const visible = await loc.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) {
        const value =
          (await loc.inputValue().catch(() => '')) ||
          (await loc.textContent().catch(() => '')) ||
          '';
        if (value && value.includes('OTP')) {
          return value;
        }
      }
    }

    // Final fallback: scan all text on the page for the OTP pattern
    const fullText = await this.page.evaluate(() => document.body.innerText);
    return fullText;
  }
}
