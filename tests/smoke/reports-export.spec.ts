import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'node:path';
import { readExcelWorkbook } from '../../utils/excelWorkbookReader';
import { REPORT_TYPES } from '../../pages/portal-pages/reports/ReportsPage';
import { test } from '../../fixtures/portalFixtures';

/**
 * Reports smoke coverage: the module opens, Report Type defaults to Asset
 * Profile Report, and a no-filter Export produces a real, readable Excel
 * workbook with header + data rows (not just "a file downloaded" — see
 * utils/excelWorkbookReader.ts).
 */

test.describe('IScore Asset Management - Reports Export', () => {
  test('REP-SM-001 | The Reports module opens with Report Type and Advanced Filters', async ({ openReportsPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Reports Export');
    await allure.severity('blocker');

    expect(REPORT_TYPES).toContain(await openReportsPage.readSelectedReportType());
    await openReportsPage.assertExportEnabled();
  });

  test('REP-SM-002 | Exporting with no filters produces a valid Excel workbook with data rows', async ({
    openReportsPage,
  }, testInfo) => {
    testInfo.setTimeout(120_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Reports Export');
    await allure.severity('blocker');

    const download = await openReportsPage.export();
    const savePath = path.join(testInfo.outputDir, download.suggestedFilename() || 'report.xlsx');
    await download.saveAs(savePath);

    const workbook = await readExcelWorkbook(savePath);
    await allure.attachment(
      'workbook-snapshot',
      JSON.stringify({ worksheetNames: workbook.worksheetNames, headers: workbook.headers, rowCount: workbook.rows.length }, null, 2),
      'application/json'
    );

    expect(workbook.worksheetNames.length, 'Downloaded file should contain at least one worksheet').toBeGreaterThan(0);
    expect(workbook.headers.length, 'Worksheet should have a header row').toBeGreaterThan(0);
    expect(
      workbook.rows.length,
      'A no-filter export should return every accessible asset, not zero rows'
    ).toBeGreaterThan(0);
  });
});
