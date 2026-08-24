import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { test } from '../../../fixtures/portalFixtures';

/**
 * Add Tracking asset-picker filter regression — the 8 advanced filters inside
 * the Add Tracking dialog.
 *
 * Filter values are captured from a live asset row before they are applied, so
 * the suite works against any dataset or release (dynamic test data). The
 * dialog is opened in beforeEach and cancelled in afterEach, so no test can
 * leave a half-built container behind.
 */

const FIXED_ASSET_NUMBER_COLUMN = 1;

test.describe('IScore Asset Management - Add Tracking Advanced Filters', () => {
  test.beforeEach(async ({ makerTaggingPage }) => {
    await makerTaggingPage.openAddTrackingDialog();
  });

  test.afterEach(async ({ makerTaggingPage }) => {
    // Never save: cancelling guarantees no container is created by a filter case.
    await makerTaggingPage.cancelAddTrackingDialog();
  });

  test('TC-TAG-ASSET-060 | [Positive] All 8 advanced filter fields are present', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('critical');

    await makerTaggingPage.assertAllTrackingDialogFilterFieldsPresent();
  });

  test('TC-TAG-ASSET-061 | [Positive] Filtering by a live Fixed Asset Number returns that asset', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('blocker');

    const fixedAssetNumbers = await makerTaggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    expect(fixedAssetNumbers.length, 'The asset picker needs at least one asset to filter').toBeGreaterThan(0);

    const target = fixedAssetNumbers[0];
    await makerTaggingPage.setTrackingDialogTextFilter('Fixed Asset Number', target);
    await makerTaggingPage.searchTrackingDialogFilters();

    const filtered = await makerTaggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    const offending = filtered.filter((value) => !value.includes(target));
    expect(
      offending,
      `Expected Fixed Asset Number "${target}" to return only matching assets, but saw: ${offending.join(', ')}`
    ).toHaveLength(0);
    expect(filtered.length, `Expected "${target}" to still be listed`).toBeGreaterThan(0);
  });

  test('TC-TAG-ASSET-062 | [Negative] An unknown Fixed Asset Number returns no assets', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('normal');

    const unknown = `AUTOMATION-NOT-FOUND-${Date.now()}`;
    await makerTaggingPage.setTrackingDialogTextFilter('Fixed Asset Number', unknown);
    await makerTaggingPage.searchTrackingDialogFilters();

    const rowCount = await makerTaggingPage.countTrackingDialogAssetRows();
    expect(rowCount, `Expected Fixed Asset Number "${unknown}" to match no assets`).toBe(0);
  });

  test('TC-TAG-ASSET-063 | [Negative] An unknown Reference Number returns no assets', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('normal');

    const unknown = `AUTOMATION-REF-NOT-FOUND-${Date.now()}`;
    await makerTaggingPage.setTrackingDialogTextFilter('Reference Number', unknown);
    await makerTaggingPage.searchTrackingDialogFilters();

    const rowCount = await makerTaggingPage.countTrackingDialogAssetRows();
    expect(rowCount, `Expected Reference Number "${unknown}" to match no assets`).toBe(0);
  });

  test('TC-TAG-ASSET-064 | [Negative] An unknown Asset Responsible Name returns no assets', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('normal');

    const unknown = `AUTOMATION-RESP-NOT-FOUND-${Date.now()}`;
    await makerTaggingPage.setTrackingDialogTextFilter('Asset Responsible Name', unknown);
    await makerTaggingPage.searchTrackingDialogFilters();

    const rowCount = await makerTaggingPage.countTrackingDialogAssetRows();
    expect(rowCount, `Expected Asset Responsible Name "${unknown}" to match no assets`).toBe(0);
  });

  test('TC-TAG-ASSET-065 | [Positive] Filtering by a live Asset Category narrows the grid', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('critical');

    const categories = await makerTaggingPage.readTrackingDialogDropdownOptions('Asset Category');
    expect(categories.length, 'The Asset Category dropdown should offer options').toBeGreaterThan(0);
    await allure.attachment('asset-categories', categories.join(', '), 'text/plain');

    const baselineCount = await makerTaggingPage.countTrackingDialogAssetRows();
    await makerTaggingPage.selectTrackingDialogDropdownFilter('Asset Category', categories[0]);
    await makerTaggingPage.searchTrackingDialogFilters();

    const filteredCount = await makerTaggingPage.countTrackingDialogAssetRows();
    expect(
      filteredCount,
      `Expected Asset Category "${categories[0]}" to return no more assets than the unfiltered grid`
    ).toBeLessThanOrEqual(baselineCount);
  });

  test('TC-TAG-ASSET-066 | [Positive] Asset Sub Category offers the same options regardless of Category', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('normal');

    const categories = await makerTaggingPage.readTrackingDialogDropdownOptions('Asset Category');
    expect(categories.length, 'The Asset Category dropdown should offer options').toBeGreaterThan(1);

    await makerTaggingPage.selectTrackingDialogDropdownFilter('Asset Category', categories[0]);
    const subCategoriesForFirst = await makerTaggingPage.readTrackingDialogDropdownOptions('Asset Sub Category');

    await makerTaggingPage.selectTrackingDialogDropdownFilter('Asset Category', categories[1]);
    const subCategoriesForSecond = await makerTaggingPage.readTrackingDialogDropdownOptions('Asset Sub Category');

    await allure.attachment(
      'sub-category-independence',
      `category "${categories[0]}" -> ${subCategoriesForFirst.length} options\n` +
        `category "${categories[1]}" -> ${subCategoriesForSecond.length} options`,
      'text/plain'
    );

    // Verified live: Sub Category is NOT scoped by Category on this build.
    expect(
      subCategoriesForSecond,
      'Asset Sub Category is not scoped by Asset Category on this build; the option list should be identical'
    ).toEqual(subCategoriesForFirst);
  });

  test('TC-TAG-ASSET-067 | [Positive] Business Unit is gated on Current Location, Department on Business Unit', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('critical');

    // Business rule: the cascade is Location -> Business Unit -> Department.
    expect(
      await makerTaggingPage.isTrackingDialogFilterEnabled('Business Unit'),
      'Business Unit must be disabled until a Current Location is chosen'
    ).toBe(false);
    expect(
      await makerTaggingPage.isTrackingDialogFilterEnabled('Department'),
      'Department must be disabled until a Business Unit is chosen'
    ).toBe(false);

    // The cascade is data-dependent: only a location that HAS a business unit opens the field.
    const enablingLocation = await makerTaggingPage.findLocationEnablingBusinessUnit();
    test.skip(
      enablingLocation === undefined,
      'No probed Current Location has a Business Unit attached in this dataset'
    );
    await allure.attachment('location-enabling-business-unit', String(enablingLocation), 'text/plain');

    expect(
      await makerTaggingPage.isTrackingDialogFilterEnabled('Business Unit'),
      `Expected Current Location "${enablingLocation}" to enable Business Unit`
    ).toBe(true);
    expect(
      await makerTaggingPage.isTrackingDialogFilterEnabled('Department'),
      'Department must stay disabled until a Business Unit is chosen'
    ).toBe(false);

    const businessUnits = await makerTaggingPage.readTrackingDialogDropdownOptions('Business Unit');
    expect(businessUnits.length, 'An enabled Business Unit dropdown should offer options').toBeGreaterThan(0);

    // Second level of the cascade is data-dependent too: only some business
    // units have departments, so probe rather than assuming the first one does.
    const enablingBusinessUnit = await makerTaggingPage.findBusinessUnitEnablingDepartment();
    test.skip(
      enablingBusinessUnit === undefined,
      `No Business Unit under location "${enablingLocation}" has a Department attached in this dataset`
    );
    await allure.attachment('business-unit-enabling-department', String(enablingBusinessUnit), 'text/plain');

    expect(
      await makerTaggingPage.isTrackingDialogFilterEnabled('Department'),
      `Expected Business Unit "${enablingBusinessUnit}" to enable Department`
    ).toBe(true);

    const departments = await makerTaggingPage.readTrackingDialogDropdownOptions('Department');
    expect(departments.length, 'An enabled Department dropdown should offer options').toBeGreaterThan(0);
  });

  test('TC-TAG-ASSET-068 | [Positive] Clear resets the picker filters and restores the grid', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('critical');

    const baselineCount = await makerTaggingPage.countTrackingDialogAssetRows();
    const fixedAssetNumbers = await makerTaggingPage.readTrackingDialogAssetColumn(FIXED_ASSET_NUMBER_COLUMN);
    expect(fixedAssetNumbers.length, 'The asset picker needs at least one asset').toBeGreaterThan(0);

    await makerTaggingPage.setTrackingDialogTextFilter('Fixed Asset Number', fixedAssetNumbers[0]);
    await makerTaggingPage.searchTrackingDialogFilters();
    expect(await makerTaggingPage.countTrackingDialogAssetRows()).toBeLessThanOrEqual(baselineCount);

    await makerTaggingPage.clearTrackingDialogFilters();

    // The control itself must reset, not only the grid.
    expect(
      await makerTaggingPage.readTrackingDialogTextFilter('Fixed Asset Number'),
      'Expected Clear to empty the Fixed Asset Number filter'
    ).toBe('');
    expect(
      await makerTaggingPage.countTrackingDialogAssetRows(),
      'Expected Clear to restore the unfiltered asset grid'
    ).toBe(baselineCount);
  });

  test('TC-TAG-ASSET-069 | [Negative] Save stays disabled while no asset is selected', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('blocker');

    // Business rule (verified live): a container cannot be saved with zero assets.
    await makerTaggingPage.assertTrackingDialogSaveDisabled();
  });

  test('TC-TAG-ASSET-070 | [Positive] Selecting then unselecting an asset returns Save to disabled', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Advanced Filters');
    await allure.severity('critical');

    await makerTaggingPage.assertTrackingDialogSaveDisabled();

    const selected = await makerTaggingPage.selectFirstEligibleTrackingDialogAsset();
    await makerTaggingPage.assertTrackingDialogAssetChecked(selected);
    await makerTaggingPage.assertTrackingDialogSaveEnabled();

    await makerTaggingPage.toggleTrackingDialogAsset(selected);
    await makerTaggingPage.assertTrackingDialogAssetUnchecked(selected);
    await makerTaggingPage.assertTrackingDialogSaveDisabled();
  });
});
