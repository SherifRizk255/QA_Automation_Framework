import path from 'node:path';

export async function handleFailureEvidence(page, testInfo, failureName) {
  const safeName = failureName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const screenshotPath = path.resolve('reports', `${safeName}-failure.png`);

  await page.screenshot({ path: screenshotPath, fullPage: true }).catch((screenshotError) => {
    console.warn(`[FailureHandler] Could not capture failure screenshot: ${screenshotError.message}`);
  });

  if (testInfo) {
    await testInfo.attach(`${safeName}-failure`, {
      path: screenshotPath,
      contentType: 'image/png',
    }).catch((attachError) => {
      console.warn(`[FailureHandler] Could not attach failure screenshot: ${attachError.message}`);
    });
  }

  await page.reload({ waitUntil: 'domcontentloaded' }).catch((reloadError) => {
    console.warn(`[FailureHandler] Recovery refresh skipped: ${reloadError.message}`);
  });
}
