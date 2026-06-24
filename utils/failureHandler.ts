import type { Page, TestInfo } from '@playwright/test';
import path from 'node:path';

export async function handleFailureEvidence(
  page: Page,
  testInfo: TestInfo | null,
  failureName: string
): Promise<void> {
  const safeName = failureName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const screenshotPath = path.resolve('reports', `${safeName}-failure.png`);

  await page
    .screenshot({ path: screenshotPath, fullPage: true })
    .catch((err: Error) => {
      console.warn(`[FailureHandler] Could not capture failure screenshot: ${err.message}`);
    });

  if (testInfo) {
    await testInfo
      .attach(`${safeName}-failure`, {
        path: screenshotPath,
        contentType: 'image/png',
      })
      .catch((err: Error) => {
        console.warn(`[FailureHandler] Could not attach failure screenshot: ${err.message}`);
      });
  }

  await page
    .reload({ waitUntil: 'domcontentloaded' })
    .catch((err: Error) => {
      console.warn(`[FailureHandler] Recovery reload skipped: ${err.message}`);
    });
}
