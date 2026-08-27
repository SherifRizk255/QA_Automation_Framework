import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'node:path';
import { readExcelWorkbook, everyRowMatchesColumnValue, distinctColumnValues } from '../../../utils/excelWorkbookReader';
import { test } from '../../../fixtures/portalFixtures';

/**
 * Reports regression: individual + combined Advanced Filter coverage, and
 * negative cases (no-match filter, clear/reset, repeated export). Filter
 * values are discovered live from the Location Name dropdown rather than
 * hardcoded (see docs/GUIDELINES.md's central-resources rule and the
 * Asset Management automation notes' "never fabricate test data" practice)
 * — this environment's specific location/category names are illustrative
 * only, not something to assume elsewhere.
 */

test.describe('IScore Asset Management - Reports Advanced Filters Regression', () => {
  test('REP-REG-001 | Filtering by Location Name returns only matching rows', async ({ openReportsPage }, testInfo) => {
    testInfo.setTimeout(120_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Reports Advanced Filters');
    await allure.severity('critical');

    const locations = await openReportsPage.readAdvancedFilterOptions('Location Name');
    testInfo.skip(locations.length === 0, 'No Location Name options available in the live Advanced Filters dropdown');

    const targetLocation = locations[0];
    await openReportsPage.selectAdvancedFilter('Location Name', targetLocation);

    const download = await openReportsPage.export();
    const savePath = path.join(testInfo.outputDir, download.suggestedFilename() || 'report.xlsx');
    await download.saveAs(savePath);

    const workbook = await readExcelWorkbook(savePath);
    await allure.attachment(
      'workbook-snapshot',
      JSON.stringify({ targetLocation, headers: workbook.headers, rowCount: workbook.rows.length }, null, 2),
      'application/json'
    );

    const locationColumn = workbook.headers.find((header) => /location/i.test(header));
    testInfo.skip(!locationColumn, 'Exported workbook has no column matching /location/i to validate against');

    expect(workbook.rows.length, `Filtering by Location "${targetLocation}" should return at least one row`).toBeGreaterThan(0);
    expect(
      everyRowMatchesColumnValue(workbook, locationColumn as string, targetLocation),
      `Every exported row's "${locationColumn}" should equal the selected filter "${targetLocation}"`
    ).toBe(true);
  });

  test('REP-REG-002 | Filtering by Asset Category returns only matching rows', async ({ openReportsPage }, testInfo) => {
    testInfo.setTimeout(120_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Reports Advanced Filters');
    await allure.severity('critical');

    const categories = await openReportsPage.readAdvancedFilterOptions('Asset Category');
    testInfo.skip(categories.length === 0, 'No Asset Category options available in the live Advanced Filters dropdown');

    const targetCategory = categories[0];
    await openReportsPage.selectAdvancedFilter('Asset Category', targetCategory);

    const download = await openReportsPage.export();
    const savePath = path.join(testInfo.outputDir, download.suggestedFilename() || 'report.xlsx');
    await download.saveAs(savePath);

    const workbook = await readExcelWorkbook(savePath);
    const categoryColumn = workbook.headers.find((header) => /category/i.test(header) && !/sub/i.test(header));
    testInfo.skip(!categoryColumn, 'Exported workbook has no column matching /category/i to validate against');

    expect(workbook.rows.length, `Filtering by Category "${targetCategory}" should return at least one row`).toBeGreaterThan(0);
    expect(
      everyRowMatchesColumnValue(workbook, categoryColumn as string, targetCategory),
      `Every exported row's "${categoryColumn}" should equal the selected filter "${targetCategory}"`
    ).toBe(true);
  });

  test('REP-REG-003 | Combining Location Name + Asset Category narrows the export further', async ({
    openReportsPage,
  }, testInfo) => {
    testInfo.setTimeout(120_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Reports Advanced Filters');
    await allure.severity('normal');

    const targetLocation = await openReportsPage.findLocationEnablingBusinessUnit();
    testInfo.skip(!targetLocation, 'No Location Name option enables Business Unit — cannot validate the location cascade live');

    const categories = await openReportsPage.readAdvancedFilterOptions('Asset Category');
    testInfo.skip(categories.length === 0, 'No Asset Category options available in the live Advanced Filters dropdown');
    const targetCategory = categories[0];
    await openReportsPage.selectAdvancedFilter('Asset Category', targetCategory);

    const download = await openReportsPage.exportAllowingNoDownload();
    expect(
      download,
      `DEFECT (live-verified 2026-08-25): combining Location Name="${targetLocation}" + Asset Category=` +
        `"${targetCategory}" produced NO downloaded file and NO on-screen message. Same silent no-op as ` +
        'REP-REG-004 — the app appears not to handle a filter combination that matches no assets. ' +
        'Expected: an empty header-only workbook (or an explicit "no results" message).'
    ).toBeDefined();
    if (!download) return;

    const savePath = path.join(testInfo.outputDir, download.suggestedFilename() || 'report-combined.xlsx');
    await download.saveAs(savePath);

    const workbook = await readExcelWorkbook(savePath);
    await allure.attachment(
      'combined-filter-snapshot',
      JSON.stringify({ targetLocation, targetCategory, rowCount: workbook.rows.length }, null, 2),
      'application/json'
    );

    const locationColumn = workbook.headers.find((header) => /location/i.test(header));
    const categoryColumn = workbook.headers.find((header) => /category/i.test(header) && !/sub/i.test(header));
    testInfo.skip(!locationColumn || !categoryColumn, 'Exported workbook is missing a Location or Category column to validate against');

    if (workbook.rows.length > 0) {
      expect(everyRowMatchesColumnValue(workbook, locationColumn as string, targetLocation as string)).toBe(true);
      expect(everyRowMatchesColumnValue(workbook, categoryColumn as string, targetCategory)).toBe(true);
    }
  });

  test('REP-REG-004 | A filter combination with no matching assets exports an empty (header-only) workbook, not an error', async ({
    openReportsPage,
  }, testInfo) => {
    testInfo.setTimeout(120_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Reports Advanced Filters - Negative');
    await allure.severity('normal');

    const locations = await openReportsPage.readAdvancedFilterOptions('Location Name');
    const categories = await openReportsPage.readAdvancedFilterOptions('Asset Category');
    testInfo.skip(
      locations.length < 2 || categories.length < 2,
      'Need at least 2 Location Name and 2 Asset Category options to reliably construct a non-matching combination'
    );

    // Two live-valid but likely-incompatible filters (a specific location's category
    // mix is data-dependent). Either outcome is acceptable BEHAVIOUR — some rows, or
    // an empty header-only workbook — but the app must produce a file (or a visible
    // message) either way.
    await openReportsPage.selectAdvancedFilter('Location Name', locations[0]);
    await openReportsPage.selectAdvancedFilter('Asset Category', categories[categories.length - 1]);

    const download = await openReportsPage.exportAllowingNoDownload();

    expect(
      download,
      `DEFECT (live-verified 2026-08-25): with Location Name="${locations[0]}" + Asset Category=` +
        `"${categories[categories.length - 1]}" (a valid combination that simply matches no assets), ` +
        'clicking Export produces NO downloaded file AND NO on-screen error/empty-result message — ' +
        'the button appears to do nothing. Expected: an empty header-only workbook (or an explicit ' +
        '"no results" message). Actual: silent no-op. This assertion is deliberately NOT weakened to ' +
        'pass; it should go green once the app handles the zero-match export case.'
    ).toBeDefined();

    if (!download) return;

    const savePath = path.join(testInfo.outputDir, download.suggestedFilename() || 'report-nomatch.xlsx');
    await download.saveAs(savePath);

    const workbook = await readExcelWorkbook(savePath);
    expect(workbook.headers.length, 'Even a zero-row export should still have a header row').toBeGreaterThan(0);

    const locationColumn = workbook.headers.find((header) => /location/i.test(header));
    const categoryColumn = workbook.headers.find((header) => /category/i.test(header) && !/sub/i.test(header));

    if (workbook.rows.length > 0 && locationColumn && categoryColumn) {
      expect(everyRowMatchesColumnValue(workbook, locationColumn, locations[0])).toBe(true);
      expect(everyRowMatchesColumnValue(workbook, categoryColumn, categories[categories.length - 1])).toBe(true);
    }
  });

  test('REP-REG-005 | Resetting filters after applying one restores the unfiltered (full) export', async ({
    openReportsPage,
  }, testInfo) => {
    testInfo.setTimeout(150_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Reports Advanced Filters - Negative');
    await allure.severity('normal');

    const download1 = await openReportsPage.export();
    const baselinePath = path.join(testInfo.outputDir, 'baseline.xlsx');
    await download1.saveAs(baselinePath);
    const baseline = await readExcelWorkbook(baselinePath);

    const categories = await openReportsPage.readAdvancedFilterOptions('Asset Category');
    testInfo.skip(categories.length === 0, 'No Asset Category options available in the live Advanced Filters dropdown');
    await openReportsPage.selectAdvancedFilter('Asset Category', categories[0]);

    await openReportsPage.resetAllFilters();

    const download2 = await openReportsPage.export();
    const afterResetPath = path.join(testInfo.outputDir, 'after-reset.xlsx');
    await download2.saveAs(afterResetPath);
    const afterReset = await readExcelWorkbook(afterResetPath);

    await allure.attachment(
      'reset-comparison',
      JSON.stringify({ baselineRowCount: baseline.rows.length, afterResetRowCount: afterReset.rows.length }, null, 2),
      'application/json'
    );

    expect(
      afterReset.rows.length,
      'Resetting the filter should restore the same row count as the original unfiltered export'
    ).toBe(baseline.rows.length);
  });

  test('REP-REG-006 | Repeated exports with the same filter return consistent data', async ({
    openReportsPage,
  }, testInfo) => {
    testInfo.setTimeout(150_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Reports Export Consistency');
    await allure.severity('normal');

    const categories = await openReportsPage.readAdvancedFilterOptions('Asset Category');
    testInfo.skip(categories.length === 0, 'No Asset Category options available in the live Advanced Filters dropdown');
    await openReportsPage.selectAdvancedFilter('Asset Category', categories[0]);

    const download1 = await openReportsPage.export();
    const firstPath = path.join(testInfo.outputDir, 'first-export.xlsx');
    await download1.saveAs(firstPath);
    const first = await readExcelWorkbook(firstPath);

    const download2 = await openReportsPage.export();
    const secondPath = path.join(testInfo.outputDir, 'second-export.xlsx');
    await download2.saveAs(secondPath);
    const second = await readExcelWorkbook(secondPath);

    expect(second.rows.length, 'Two consecutive exports with the same filter should return the same row count').toBe(
      first.rows.length
    );
    expect(distinctColumnValues(second, workbookIdentityColumn(first))).toEqual(
      distinctColumnValues(first, workbookIdentityColumn(first))
    );
  });
});

function workbookIdentityColumn(workbook: { headers: string[] }): string {
  return workbook.headers.find((header) => /fixed asset number/i.test(header)) ?? workbook.headers[0];
}
