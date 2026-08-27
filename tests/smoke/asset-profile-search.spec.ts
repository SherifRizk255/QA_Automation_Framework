import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { PROFILE_SECTIONS } from '../../pages/portal-pages/asset-profile/AssetProfilePage';
import { test } from '../../fixtures/portalFixtures';

/**
 * Asset Profile smoke coverage.
 *
 * Test data is discovered from the live Add Tracking asset picker (the same
 * grid the Tagging suite already reads) rather than hardcoded, so these tests
 * survive dataset changes. The picker exposes Fixed Asset Number and
 * Reference Number columns for every asset, which is exactly what Asset
 * Profile searches on.
 *
 * IMPORTANT: use `taggingPage` (not `makerTaggingPage`) when a test also
 * needs `assetProfilePage` in the same test. `makerTaggingPage` runs its own
 * inline login; `assetProfilePage` depends on `authenticatedPortal`. Both in
 * one test triggers a second `page.goto(login)` on an already-authenticated
 * session, and the app does not re-render the login form for it — `#UserName`
 * never appears and the test times out at login (reproduced consistently
 * while building this suite; not environment flakiness). `taggingPage` and
 * `assetProfilePage` both depend on the same cached `authenticatedPortal`, so
 * combining them logs in exactly once.
 */

const FIXED_ASSET_NUMBER_COLUMN = 1;

/** Live-verified 2026-08-25 asset with a populated Reference Number (rare in this shared demo dataset). */
const KNOWN_ASSET_WITH_REFERENCE_NUMBER = {
  fixedAssetNumber: 'BUIL-000011',
  referenceNumber: 'BUIL-000011',
} as const;

test.describe('IScore Asset Management - Asset Profile Search', () => {
  test('TC-AP-001 | The Asset Profile module opens with a usable search form', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search');
    await allure.severity('blocker');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.assertSearchFormVisible();
  });

  test('TC-AP-002 | Searching a live Fixed Asset Number opens that asset profile', async ({
    roleApplier,
    taggingPage,
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search');
    await allure.severity('blocker');

    await roleApplier.ensureRoleApplied('MAKER');
    await taggingPage.openFromHeader();

    // Capture a real asset from the Tagging picker rather than hardcoding one.
    await taggingPage.openAddTrackingDialog();
    const fixedAssetNumbers = await taggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    expect(fixedAssetNumbers.length, 'The asset picker needs at least one asset').toBeGreaterThan(0);
    const targetFixedAssetNumber = fixedAssetNumbers[0];
    await taggingPage.cancelAddTrackingDialog();
    await allure.attachment('captured-fixed-asset-number', targetFixedAssetNumber, 'text/plain');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(targetFixedAssetNumber);

    await assetProfilePage.assertProfileVisible();
    await assetProfilePage.assertFixedAssetNumber(targetFixedAssetNumber);
    expect(
      await assetProfilePage.readField('Fixed Asset Number'),
      'General Information should echo the searched Fixed Asset Number'
    ).toBe(targetFixedAssetNumber);
  });

  test('TC-AP-003 | Searching a live Reference Number opens the same asset', async ({ assetProfilePage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search');
    await allure.severity('critical');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByNewReferenceNumber(KNOWN_ASSET_WITH_REFERENCE_NUMBER.referenceNumber);

    await assetProfilePage.assertProfileVisible();
    expect(
      await assetProfilePage.readHeroFixedAssetNumber(),
      `Searching Reference Number "${KNOWN_ASSET_WITH_REFERENCE_NUMBER.referenceNumber}" should open asset "${KNOWN_ASSET_WITH_REFERENCE_NUMBER.fixedAssetNumber}"`
    ).toBe(KNOWN_ASSET_WITH_REFERENCE_NUMBER.fixedAssetNumber);
  });

  test('TC-AP-004 | A found profile renders all six information sections', async ({
    roleApplier,
    taggingPage,
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Sections');
    await allure.severity('critical');

    await roleApplier.ensureRoleApplied('MAKER');
    await taggingPage.openFromHeader();

    await taggingPage.openAddTrackingDialog();
    const fixedAssetNumbers = await taggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    expect(fixedAssetNumbers.length, 'The asset picker needs at least one asset').toBeGreaterThan(0);
    const targetFixedAssetNumber = fixedAssetNumbers[0];
    await taggingPage.cancelAddTrackingDialog();

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(targetFixedAssetNumber);
    await assetProfilePage.assertProfileVisible();

    await assetProfilePage.assertAllSectionsVisible();
    expect(
      await assetProfilePage.countSections(),
      `Expected exactly ${PROFILE_SECTIONS.length} profile sections`
    ).toBe(PROFILE_SECTIONS.length);
  });
});
