import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export class AccountStatementsPage {
  readonly page: Page;
  readonly statementDateControls: Locator;
  readonly downloadButtons: Locator;
  readonly statementsText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statementDateControls = page.getByLabel(/statement|from date|to date|date/i);
    // Single .or kept intentionally: the statements flow has no active spec and the
    // download control was never live-verified as button vs link — resolve on the
    // next unblocked walkthrough run and commit to one.
    this.downloadButtons = page
      .getByRole('button', { name: /download/i })
      .or(page.getByRole('link', { name: /download/i }));
    this.statementsText = page.getByText(/statement/i);
  }

  async assertLoaded() {
    await expect(this.page.locator('body'), 'Account Statements screen body should be visible.').toBeVisible();
    await expect(
      this.statementsText.first(),
      'Account Statements screen should show statement content.'
    ).toBeVisible();
  }

  async validateFiltersIfAvailable(testInfo?: TestInfo) {
    // Filters are tenant-dependent; their absence is documented, not failed.
    const filterCount = await this.statementDateControls.count();

    if (filterCount === 0) {
      testInfo?.annotations.push({
        type: 'statement controls',
        description: 'No statement date/filter controls were visible during this run.',
      });
      return;
    }

    await expect(this.statementDateControls.first(), 'First statement date/filter control should be visible.').toBeVisible();
  }

  async validateDownloadIfAvailable(testInfo?: TestInfo) {
    // Downloads are tenant-dependent; their absence is documented, not failed.
    if (!(await this.downloadButtons.first().isVisible().catch(() => false))) {
      testInfo?.annotations.push({
        type: 'statement download',
        description: 'No statement download control was visible during this run.',
      });
      return;
    }

    const downloadDir = path.resolve('reports', 'downloads');
    fs.mkdirSync(downloadDir, { recursive: true });

    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadButtons.first().click(),
    ]);
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename, 'Statement download should have a filename.').toMatch(/\.[a-z0-9]{2,8}$/i);

    const downloadPath = path.join(downloadDir, suggestedFilename.replace(/[^a-z0-9._-]/gi, '_'));
    await download.saveAs(downloadPath);

    if (testInfo) {
      await testInfo.attach('statement-download-file', {
        path: downloadPath,
        contentType: 'application/octet-stream',
      });
    }
  }
}
