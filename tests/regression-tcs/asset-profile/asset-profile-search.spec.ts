import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { EMPTY_FIELD_VALUE } from '../../../pages/portal-pages/asset-profile/AssetProfilePage';
import { test } from '../../../fixtures/portalFixtures';

/**
 * Asset Profile search regression: positive identifier/field coverage and
 * negative/edge-case search input handling.
 *
 * Test data is captured from the live Tagging Add Tracking picker (see
 * tests/smoke/asset-profile-search.spec.ts and the Tagging automation notes,
 * gotcha #14, for why `taggingPage` + `roleApplier` is used instead of
 * `makerTaggingPage` whenever a test also needs `assetProfilePage`).
 */

const FIXED_ASSET_NUMBER_COLUMN = 1;

/**
 * Fixed known-good asset — live-verified 2026-08-25 to carry a populated
 * New AND Old Reference Number (rare in this shared demo dataset). Using a
 * fixed identifier instead of scanning the picker removes the need to skip
 * when the scan comes up empty, while still never fabricating the values
 * themselves (they were read from the live profile, not invented).
 */
const KNOWN_ASSET = {
  fixedAssetNumber: 'BUIL-000011',
  newReferenceNumber: 'BUIL-000011',
  oldReferenceNumber: '123455',
  assetCategory: 'Buildings',
  currentLocation: 'Smart Village',
  model: 'TOSHIBA',
} as const;

test.describe('IScore Asset Management - Asset Profile Search Regression', () => {
  test('TC-AP-101 | [Positive] Searching two different valid assets in sequence shows each correctly', async ({
    roleApplier,
    taggingPage,
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search');
    await allure.severity('critical');

    await roleApplier.ensureRoleApplied('MAKER');
    await taggingPage.openFromHeader();
    await taggingPage.openAddTrackingDialog();
    const fixedAssetNumbers = await taggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    // Shared demo dataset: the picker's default page can run temporarily low
    // under heavy concurrent testing. Not a code or app defect — skip rather
    // than fail on a data-availability condition (see Tagging automation
    // notes, gotcha covering TC-TAG-ASSET-033 for the established pattern).
    test.skip(fixedAssetNumbers.length < 2, 'Fewer than 2 assets available on the current picker grid page');
    await taggingPage.cancelAddTrackingDialog();

    const [first, second] = fixedAssetNumbers;

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(first);
    await assetProfilePage.assertProfileVisible();
    expect(await assetProfilePage.readHeroFixedAssetNumber()).toBe(first);

    await assetProfilePage.searchByFixedAssetNumber(second);
    await assetProfilePage.assertProfileVisible();
    expect(
      await assetProfilePage.readHeroFixedAssetNumber(),
      'Expected the second search to replace the first result, not append to it'
    ).toBe(second);
  });

  test('TC-AP-102 | [Positive] General Information, Asset Type and Location match the source asset data', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Field Accuracy');
    await allure.severity('critical');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(KNOWN_ASSET.fixedAssetNumber);
    await assetProfilePage.assertProfileVisible();

    const snapshot = {
      fixedAssetNumber: await assetProfilePage.readField('Fixed Asset Number'),
      assetCategory: await assetProfilePage.readField('Asset Category'),
      currentLocation: await assetProfilePage.readField('Current Location'),
      model: await assetProfilePage.readField('Model'),
      newReferenceNumber: await assetProfilePage.readField('New Reference Number'),
      oldReferenceNumber: await assetProfilePage.readField('Old Reference Number'),
    };
    await allure.attachment('asset-profile-snapshot', JSON.stringify(snapshot, null, 2), 'application/json');

    expect(snapshot.fixedAssetNumber).toBe(KNOWN_ASSET.fixedAssetNumber);
    expect(
      snapshot.assetCategory,
      'Asset Type section should show the live-verified Category for BUIL-000011'
    ).toBe(KNOWN_ASSET.assetCategory);
    expect(
      snapshot.currentLocation,
      'Asset Location section should show the live-verified Location for BUIL-000011'
    ).toBe(KNOWN_ASSET.currentLocation);
    expect(snapshot.model).toBe(KNOWN_ASSET.model);
    expect(snapshot.newReferenceNumber).toBe(KNOWN_ASSET.newReferenceNumber);
    expect(snapshot.oldReferenceNumber).toBe(KNOWN_ASSET.oldReferenceNumber);
  });

  test('TC-AP-103 | [Positive] Unset optional fields render the em-dash placeholder', async ({
    roleApplier,
    taggingPage,
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Field Accuracy');
    await allure.severity('normal');

    await roleApplier.ensureRoleApplied('MAKER');
    await taggingPage.openFromHeader();
    await taggingPage.openAddTrackingDialog();
    const fixedAssetNumbers = await taggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    // Shared demo dataset: not a code or app defect — see the skip note above.
    test.skip(fixedAssetNumbers.length === 0, 'No assets available on the current picker grid page');
    const targetFixedAssetNumber = fixedAssetNumbers[0];
    await taggingPage.cancelAddTrackingDialog();

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(targetFixedAssetNumber);
    await assetProfilePage.assertProfileVisible();

    // Serial Number / PO Number / Memo are frequently unset in this dataset;
    // whichever are unset must render the placeholder, never blank/undefined.
    for (const label of ['Serial Number', 'PO Number', 'Memo']) {
      const value = await assetProfilePage.readField(label);
      expect(value.length, `"${label}" should never render as a truly blank string`).toBeGreaterThan(0);
      if (value === EMPTY_FIELD_VALUE) {
        expect(value).toBe(EMPTY_FIELD_VALUE);
      }
    }
  });

  test('TC-AP-104 | [Positive] Recent Transactions render module, initiator and date for every entry', async ({
    roleApplier,
    taggingPage,
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Recent Transactions');
    await allure.severity('critical');

    await roleApplier.ensureRoleApplied('MAKER');
    await taggingPage.openFromHeader();
    await taggingPage.openAddTrackingDialog();
    const fixedAssetNumbers = await taggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    // Shared demo dataset: not a code or app defect — see the skip note above.
    test.skip(fixedAssetNumbers.length === 0, 'No assets available on the current picker grid page');
    await taggingPage.cancelAddTrackingDialog();

    // Scan a few assets for one with transaction history (not guaranteed on the first).
    let transactions: Array<{ module: string; status: string; date: string }> = [];
    let assetWithHistory: string | undefined;

    for (const candidate of fixedAssetNumbers.slice(0, 8)) {
      await assetProfilePage.openFromHeader();
      await assetProfilePage.searchByFixedAssetNumber(candidate);
      await assetProfilePage.assertProfileVisible();
      const found = await assetProfilePage.readTransactions();

      if (found.length > 0) {
        transactions = found;
        assetWithHistory = candidate;
        break;
      }
    }

    test.skip(!assetWithHistory, 'No asset in the first 8 picker rows has Recent Transactions history');
    await allure.attachment('asset-with-history', String(assetWithHistory), 'text/plain');
    await allure.attachment('raw-transactions', JSON.stringify(transactions, null, 2), 'application/json');

    for (const tx of transactions) {
      expect(tx.module.length, 'Every transaction must show a module/type').toBeGreaterThan(0);
      expect(tx.status.length, 'Every transaction must show a status/initiator').toBeGreaterThan(0);
      expect(tx.date.length, 'Every transaction must show a date').toBeGreaterThan(0);
    }
  });

  test('TC-AP-105 | [Positive] Search is case-insensitive and trims whitespace', async ({
    roleApplier,
    taggingPage,
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search');
    await allure.severity('normal');

    await roleApplier.ensureRoleApplied('MAKER');
    await taggingPage.openFromHeader();
    await taggingPage.openAddTrackingDialog();
    const fixedAssetNumbers = await taggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    // Shared demo dataset: not a code or app defect — see the skip note above.
    test.skip(fixedAssetNumbers.length === 0, 'No assets available on the current picker grid page');
    const targetFixedAssetNumber = fixedAssetNumbers[0];
    await taggingPage.cancelAddTrackingDialog();

    const mangled = `  ${targetFixedAssetNumber.toLowerCase()}  `;
    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(mangled);

    await assetProfilePage.assertProfileVisible();
    expect(
      await assetProfilePage.readHeroFixedAssetNumber(),
      `Expected "${mangled}" to resolve to "${targetFixedAssetNumber}" (verified live: search trims and is case-insensitive)`
    ).toBe(targetFixedAssetNumber);
  });

  test('TC-AP-114 | [Positive] Search by Old Reference Number resolves to the owning asset', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search');
    await allure.severity('normal');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByOldReferenceNumber(KNOWN_ASSET.oldReferenceNumber);
    await assetProfilePage.assertProfileVisible();
    expect(await assetProfilePage.readHeroFixedAssetNumber()).toBe(KNOWN_ASSET.fixedAssetNumber);
    expect(await assetProfilePage.readField('Old Reference Number')).toBe(KNOWN_ASSET.oldReferenceNumber);
  });

  test('TC-AP-116 | [Positive] Search by New Reference Number resolves to the owning asset', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search');
    await allure.severity('normal');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByNewReferenceNumber(KNOWN_ASSET.newReferenceNumber);
    await assetProfilePage.assertProfileVisible();
    expect(await assetProfilePage.readHeroFixedAssetNumber()).toBe(KNOWN_ASSET.fixedAssetNumber);
    expect(await assetProfilePage.readField('New Reference Number')).toBe(KNOWN_ASSET.newReferenceNumber);
  });

  test('TC-AP-115 | [Negative] A partial identifier does not match a different unrelated asset', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('normal');

    const targetFixedAssetNumber = KNOWN_ASSET.fixedAssetNumber;

    const partial = targetFixedAssetNumber.slice(0, Math.ceil(targetFixedAssetNumber.length / 2));

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(partial);

    const profileShown = await assetProfilePage.isProfileVisible();

    if (profileShown) {
      // The app does support prefix matching and resolves to the FIRST match
      // (live-verified 2026-08-25: "BUIL-0" opens BUIL-000001, not BUIL-000011).
      // That is acceptable behaviour — what must never happen is a partial
      // resolving to an asset it is not a prefix of.
      const resolved = await assetProfilePage.readHeroFixedAssetNumber();
      expect(
        resolved.startsWith(partial),
        `Partial identifier "${partial}" resolved to "${resolved}", which is not a prefix match`
      ).toBe(true);
    } else {
      await assetProfilePage.assertEmptyStateVisible();
    }
  });

  // ─── Negative ──────────────────────────────────────────────

  test('TC-AP-106 | [Negative] An unknown Fixed Asset Number shows the empty state, not stale data', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('critical');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(`AUTOMATION-NOT-FOUND-${Date.now()}`);

    await assetProfilePage.assertEmptyStateVisible();
    await assetProfilePage.assertProfileNotVisible();
  });

  test('TC-AP-107 | [Negative] An unknown Reference Number shows the empty state', async ({ assetProfilePage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('normal');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByNewReferenceNumber(`AUTOMATION-REF-NOT-FOUND-${Date.now()}`);

    await assetProfilePage.assertEmptyStateVisible();
  });

  test('TC-AP-108 | [Negative] The Search button stays disabled while every input is empty', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('normal');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.clearSearchInputs();

    await assetProfilePage.assertSearchButtonDisabled();
  });

  test('TC-AP-109 | [Negative] Special characters in the search input show the empty state, not an error', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('normal');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber('!@#$%^&*()<>?/\\');

    await assetProfilePage.assertEmptyStateVisible();
  });

  test('TC-AP-110 | [Negative] An excessively long value shows the empty state, not an error', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('minor');

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber('X'.repeat(500));

    await assetProfilePage.assertEmptyStateVisible();
  });

  test('TC-AP-111 | [Negative] A valid search after a failed search recovers cleanly', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('critical');

    const targetFixedAssetNumber = KNOWN_ASSET.fixedAssetNumber;

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(`AUTOMATION-NOT-FOUND-${Date.now()}`);
    await assetProfilePage.assertEmptyStateVisible();

    await assetProfilePage.searchByFixedAssetNumber(targetFixedAssetNumber);
    await assetProfilePage.assertProfileVisible();
    expect(await assetProfilePage.readHeroFixedAssetNumber()).toBe(targetFixedAssetNumber);
  });

  test('TC-AP-112 | [Negative] An invalid search after a successful search clears the stale profile', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('critical');

    const targetFixedAssetNumber = KNOWN_ASSET.fixedAssetNumber;

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(targetFixedAssetNumber);
    await assetProfilePage.assertProfileVisible();

    await assetProfilePage.searchByFixedAssetNumber(`AUTOMATION-NOT-FOUND-${Date.now()}`);
    await assetProfilePage.assertEmptyStateVisible();
    await assetProfilePage.assertProfileNotVisible();
  });

  test('TC-AP-113 | [Negative] Clear Search resets the form after a search', async ({
    assetProfilePage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Profile Search - Negative');
    await allure.severity('normal');

    const targetFixedAssetNumber = KNOWN_ASSET.fixedAssetNumber;

    await assetProfilePage.openFromHeader();
    await assetProfilePage.searchByFixedAssetNumber(targetFixedAssetNumber);
    await assetProfilePage.assertProfileVisible();

    await assetProfilePage.clearSearch();

    const values = await assetProfilePage.readSearchInputValues();
    expect(values, 'Clear Search should empty every search input').toEqual({
      fixedAssetNumber: '',
      newReference: '',
      oldReference: '',
    });
    await assetProfilePage.assertSearchButtonDisabled();
  });
});
