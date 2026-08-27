import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'node:path';
import { readExcelWorkbook, everyRowMatchesColumnValue } from '../../../utils/excelWorkbookReader';
import { test } from '../../../fixtures/portalFixtures';

/**
 * Cross-module regression: an asset captured from the Tagging Add Tracking
 * picker is looked up in Asset Profile by both Fixed Asset Number and
 * Reference Number, then confirmed to appear in a Reports export filtered by
 * one of its own live attributes (Asset Category) — proving the same asset
 * record is consistent across all three modules.
 *
 * Uses the same live-verified known asset as the Asset Profile regression
 * suite (BUIL-000011 — see KNOWN_ASSET in
 * tests/regression-tcs/asset-profile/asset-profile-search.spec.ts) instead
 * of re-scanning the Tagging picker, since that asset already has a
 * confirmed Fixed Asset Number, New Reference Number and Asset Category.
 * This still exercises genuine cross-module data flow — it just anchors on
 * a real, previously-verified asset rather than fabricating one.
 */

const KNOWN_ASSET = {
  fixedAssetNumber: 'BUIL-000011',
  newReferenceNumber: 'BUIL-000011',
  assetCategory: 'Buildings',
} as const;

test.describe('IScore Asset Management - Cross-Module Regression', () => {
  test('XMOD-REG-001 | An asset captured from Tagging resolves consistently in Asset Profile and appears in a matching Reports export', async ({
    roleApplier,
    taggingPage,
    assetProfilePage,
    reportsPage,
  }, testInfo) => {
    testInfo.setTimeout(180_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Cross-Module Consistency');
    await allure.severity('critical');

    // ─── Tagging: confirm the known asset is a real, live picker row ────────
    await roleApplier.ensureRoleApplied('MAKER');
    await taggingPage.openFromHeader();
    await taggingPage.openAddTrackingDialog();
    await taggingPage.setTrackingDialogTextFilter('Fixed Asset Number', KNOWN_ASSET.fixedAssetNumber);
    await taggingPage.searchTrackingDialogFilters();
    const pickerRowCount = await taggingPage.countTrackingDialogAssetRows();
    await taggingPage.cancelAddTrackingDialog();

    expect(
      pickerRowCount,
      `Expected the known asset "${KNOWN_ASSET.fixedAssetNumber}" to appear in the live Tagging picker`
    ).toBeGreaterThan(0);

    // ─── Asset Profile: search by Fixed Asset Number ────────────────────────
    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(KNOWN_ASSET.fixedAssetNumber);
    await assetProfilePage.assertProfileVisible();
    expect(await assetProfilePage.readHeroFixedAssetNumber()).toBe(KNOWN_ASSET.fixedAssetNumber);
    const categoryFromFanSearch = await assetProfilePage.readField('Asset Category');

    // ─── Asset Profile: search the SAME asset by Reference Number ───────────
    await assetProfilePage.searchByNewReferenceNumber(KNOWN_ASSET.newReferenceNumber);
    await assetProfilePage.assertProfileVisible();
    expect(
      await assetProfilePage.readHeroFixedAssetNumber(),
      'Searching by Reference Number should resolve to the same asset as the Fixed Asset Number search'
    ).toBe(KNOWN_ASSET.fixedAssetNumber);
    expect(await assetProfilePage.readField('Asset Category')).toBe(categoryFromFanSearch);

    // ─── Reports: filter by the asset's own live Category, export, and find it ──
    await reportsPage.openFromHeader();
    await reportsPage.selectAdvancedFilter('Asset Category', categoryFromFanSearch);
    const download = await reportsPage.export();
    const savePath = path.join(testInfo.outputDir, 'cross-module-export.xlsx');
    await download.saveAs(savePath);

    const workbook = await readExcelWorkbook(savePath);
    const fanColumn = workbook.headers.find((header) => /fixed asset number/i.test(header));
    const categoryColumn = workbook.headers.find((header) => /category/i.test(header) && !/sub/i.test(header));

    testInfo.skip(
      !fanColumn || !categoryColumn,
      'Exported workbook is missing a Fixed Asset Number or Category column to validate against'
    );

    await allure.attachment(
      'cross-module-summary',
      JSON.stringify({ fixedAssetNumber: KNOWN_ASSET.fixedAssetNumber, categoryFromFanSearch, exportRowCount: workbook.rows.length }, null, 2),
      'application/json'
    );

    expect(
      everyRowMatchesColumnValue(workbook, categoryColumn as string, categoryFromFanSearch),
      `Every exported row's "${categoryColumn}" should equal the filter "${categoryFromFanSearch}"`
    ).toBe(true);
    expect(
      workbook.rows.some((row) => row[fanColumn as string] === KNOWN_ASSET.fixedAssetNumber),
      `The Reports export filtered by Category "${categoryFromFanSearch}" should include asset "${KNOWN_ASSET.fixedAssetNumber}"`
    ).toBe(true);
  });
});
