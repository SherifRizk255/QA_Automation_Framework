import { expect, type Page } from '@playwright/test';
import { BaseCrmPage } from './BaseCrmPage';

export class BetweenMyAccountsTransferLogPage extends BaseCrmPage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async openLatestLogRecord(): Promise<void> {
    // Skill 20 Rule 3: portal→CRM propagation takes seconds — reload-poll until data appears.
    // The CRM view sorts by Transaction Date descending so the latest record is always row 2.
    await expect(async () => {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.waitForGrid(30_000);
    }).toPass({ timeout: 120_000, intervals: [10_000] });

    await this.firstDataRow().dblclick();
    await this.waitForDynamicsReady();
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertStatusReasonCompleted(): Promise<void> {
    const indicator = this.repository.locator(
      'CRM.BETWEEN_MY_ACCOUNTS_LOG.STATUS_COMPLETED'
    );
    await expect(indicator).toBeVisible();
  }

  async assertTransferTypeBetweenMyAccounts(): Promise<void> {
    const typeLabel = this.repository.locator(
      'CRM.BETWEEN_MY_ACCOUNTS_LOG.TRANSFER_TYPE_VALUE'
    );
    await expect(typeLabel).toBeVisible();
  }

  async assertLogAmount(expectedAmount: string): Promise<void> {
    // Amount & Currency is at the very bottom of the General tab.
    await this.page
      .getByText('Amount & Currency', { exact: true })
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    // Hover so mouse.wheel targets the form body scroll container, not the sitemap or header.
    await this.page.getByRole('heading', { name: 'Amount & Currency' }).hover();
    await this.page.mouse.wheel(0, 8_000);
    await this.waitForDynamicsReady();
    // D365 renders form controls lazily on scroll — retry incremental scroll + check in a toPass loop.
    const amountField = this.page.getByRole('textbox', { name: /^Amount\b/i }).first();
    await expect(async () => {
      await this.page.mouse.wheel(0, 1_000);
      await expect(amountField).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000, intervals: [2_000] });
    // D365 money fields are contenteditable — no HTML value attribute; use inputValue().
    // ARIA name is "Amount. Last saved value: <formatted>"; /^Amount\b/ targets this field uniquely.
    const fieldValue = await amountField.inputValue();
    const escaped = expectedAmount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(fieldValue, `Amount field should contain "${expectedAmount}"`).toMatch(new RegExp(escaped));
  }

  async assertInternetBankingUser(expectedUser: string): Promise<void> {
    // Internet Banking User is a D365 lookup field rendered as a clickable link.
    await expect(
      this.page.getByRole('link', { name: expectedUser, exact: true })
    ).toBeVisible();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  // Readiness/grid waits live in BaseCrmPage — do not re-implement here.
}
