import { type Page, type TestInfo } from '@playwright/test';
import path from 'node:path';

/**
 * Captures full-page failure evidence into `reports/` and attaches it to the
 * test result. Register once per spec file:
 *
 *   test.afterEach(async ({ page }, testInfo) => {
 *     await captureFailureEvidenceOnFailure(page, testInfo);
 *   });
 *
 * No-op when the test ended with its expected status, so specs stay free of
 * try/catch (skill 23).
 */
export async function captureFailureEvidenceOnFailure(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  const safeName = testInfo.title.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const screenshotPath = path.resolve('reports', `${safeName}-failure.png`);

  // Best-effort by design: evidence capture must never mask the original test failure.
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch((screenshotError) => {
    console.warn(`[FailureHandler] Could not capture failure screenshot: ${screenshotError.message}`);
  });

  await testInfo
    .attach(`${safeName}-failure`, {
      path: screenshotPath,
      contentType: 'image/png',
    })
    .catch((attachError) => {
      console.warn(`[FailureHandler] Could not attach failure screenshot: ${attachError.message}`);
    });
}
