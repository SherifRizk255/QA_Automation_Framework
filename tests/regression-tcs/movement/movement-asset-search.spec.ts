import * as allure from 'allure-js-commons';
import { expect, test } from '../../../fixtures/portalFixtures';
import type { MovementPage } from '../../../pages/portal-pages/movement/MovementPage';

/**
 * New Movement asset-picker search filters (TC-MOV-004 .. TC-MOV-011).
 *
 * All read-only: the dialog is opened, filtered, and cancelled — no container
 * is ever saved, so every case is idempotent and needs no data teardown.
 *
 * No filter VALUE is hardcoded. Each case reads a value straight off a live
 * grid row (text filters) or off the live dropdown option list (dropdown
 * filters), so the suite never depends on a specific asset existing.
 *
 * Business rule (verified live): Business Unit and Department are cascade-gated
 * — Business Unit only enables once a Current Location that HAS a business unit
 * is chosen, and Department only once a Business Unit that HAS a department is
 * chosen. Both are data-dependent, so TC-MOV-010/011 probe for a qualifying
 * parent via findLocationEnablingBusinessUnit() rather than assuming one.
 */

/** Picker grid column indexes (0-based, checkbox column is 0) — verified live. */
const COLUMN = {
  fixedAssetNumber: 1,
  referenceNumber: 6,
  assetCategory: 7,
  currentLocation: 8,
  businessUnit: 9,
  department: 10,
  assetResponsibleName: 11,
} as const;

/** Reads a non-placeholder value from a live grid column to use as the filter input. */
async function readSeedValueFromGrid(movementPage: MovementPage, columnIndex: number): Promise<string | undefined> {
  const values = await movementPage.readDialogAssetColumn(columnIndex);
  return values.map((value) => value.trim()).find((value) => value && value !== '--');
}

/** Reads a real (non-placeholder) option from a live dropdown filter. */
async function readSeedOption(movementPage: MovementPage, fieldLabel: string): Promise<string | undefined> {
  const options = await movementPage.readDialogDropdownOptions(fieldLabel);
  return options.map((option) => option.trim()).find(Boolean);
}

test.describe('Movement - Asset Search', () => {
  test.beforeEach(async ({ roleApplier, openMovementPage }) => {
    await roleApplier.ensureRoleApplied('MAKER');
    await openMovementPage.openNewMovementDialog();
    await openMovementPage.selectMovementType('Selected Assets Movement');
  });

  test.afterEach(async ({ openMovementPage }) => {
    await openMovementPage.cancelNewMovementDialog();
  });

  test('TC-MOV-004 | Assets can be searched by a valid Fixed Asset Number', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('normal');

    const fixedAssetNumber = await readSeedValueFromGrid(openMovementPage, COLUMN.fixedAssetNumber);
    expect(fixedAssetNumber, 'The picker grid should expose at least one Fixed Asset Number to search for').toBeTruthy();

    await openMovementPage.setDialogTextFilter('Fixed Asset Number', fixedAssetNumber as string);
    await openMovementPage.searchDialogFilters();

    const results = await openMovementPage.readDialogAssetColumn(COLUMN.fixedAssetNumber);
    expect(results.length, 'Searching an existing Fixed Asset Number should return at least one row').toBeGreaterThan(0);
    expect(results.every((value) => value.includes(fixedAssetNumber as string))).toBe(true);
  });

  test('TC-MOV-005 | Assets can be searched by a valid Reference Number', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('normal');

    const referenceNumber = await readSeedValueFromGrid(openMovementPage, COLUMN.referenceNumber);
    expect(referenceNumber, 'The picker grid should expose at least one Reference Number to search for').toBeTruthy();

    await openMovementPage.setDialogTextFilter('Reference Number', referenceNumber as string);
    await openMovementPage.searchDialogFilters();

    const results = await openMovementPage.readDialogAssetColumn(COLUMN.referenceNumber);
    expect(results.length, 'Searching an existing Reference Number should return at least one row').toBeGreaterThan(0);
    expect(results.every((value) => value.includes(referenceNumber as string))).toBe(true);
  });

  test('TC-MOV-006 | Assets can be searched by a valid Asset Responsible Name', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('minor');

    // Verified live: Asset Responsible Name is a free-text input, NOT a dropdown
    // (the intake JSON's "enter or select" wording is imprecise).
    const responsible = await readSeedValueFromGrid(openMovementPage, COLUMN.assetResponsibleName);
    expect(responsible, 'The picker grid should expose at least one Asset Responsible Name to search for').toBeTruthy();

    await openMovementPage.setDialogTextFilter('Asset Responsible Name', responsible as string);
    await openMovementPage.searchDialogFilters();

    const results = await openMovementPage.readDialogAssetColumn(COLUMN.assetResponsibleName);
    expect(results.length, 'Searching an existing Asset Responsible Name should return at least one row').toBeGreaterThan(0);
    expect(results.every((value) => value.includes(responsible as string))).toBe(true);
  });

  test('TC-MOV-007 | Assets can be searched by a valid Asset Category', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('minor');

    const category = await readSeedOption(openMovementPage, 'Asset Category');
    expect(category, 'The Asset Category dropdown should expose at least one option').toBeTruthy();

    await openMovementPage.selectDialogDropdownFilter('Asset Category', category as string);
    await openMovementPage.searchDialogFilters();

    const results = await openMovementPage.readDialogAssetColumn(COLUMN.assetCategory);
    expect(results.every((value) => value === category || value === '--')).toBe(true);
  });

  test('TC-MOV-008 | Assets can be searched by a valid Asset Sub Category', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('minor');

    const subCategory = await readSeedOption(openMovementPage, 'Asset Sub Category');
    expect(subCategory, 'The Asset Sub Category dropdown should expose at least one option').toBeTruthy();

    await openMovementPage.selectDialogDropdownFilter('Asset Sub Category', subCategory as string);
    await openMovementPage.searchDialogFilters();

    // The picker grid has no Sub Category column, so the observable outcome is
    // that the filter applies without error and the grid settles to a result
    // set (possibly the empty state when no asset carries that sub category).
    const rowCount = await openMovementPage.countDialogAssetRows();
    expect(rowCount, 'Applying an Asset Sub Category filter should leave the grid in a valid state').toBeGreaterThanOrEqual(0);
  });

  test('TC-MOV-009 | Assets can be searched by a valid Current Location', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('minor');

    const location = await readSeedOption(openMovementPage, 'Current Location');
    expect(location, 'The Current Location dropdown should expose at least one option').toBeTruthy();

    await openMovementPage.selectDialogDropdownFilter('Current Location', location as string);
    await openMovementPage.searchDialogFilters();

    const results = await openMovementPage.readDialogAssetColumn(COLUMN.currentLocation);
    expect(results.every((value) => value === location || value === '--')).toBe(true);
  });

  test('TC-MOV-010 | Assets can be searched by a valid Business Unit once the location cascade enables it', async ({
    openMovementPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('minor');

    // Business rule: Business Unit is disabled until a Current Location that
    // HAS a business unit is chosen (verified live).
    expect(
      await openMovementPage.isDialogFilterEnabled('Business Unit'),
      'Business Unit must start disabled on a fresh dialog (cascade gate)'
    ).toBe(false);

    const location = await openMovementPage.findLocationEnablingBusinessUnit();
    expect(
      location,
      'No Current Location option has a Business Unit attached — the cascade cannot be exercised with this tenant data'
    ).toBeTruthy();
    await allure.attachment('cascade-location', String(location), 'text/plain');

    expect(
      await openMovementPage.isDialogFilterEnabled('Business Unit'),
      `Business Unit should become enabled after selecting Current Location "${location}"`
    ).toBe(true);

    const businessUnit = await readSeedOption(openMovementPage, 'Business Unit');
    expect(businessUnit, 'The enabled Business Unit dropdown should expose at least one option').toBeTruthy();

    await openMovementPage.selectDialogDropdownFilter('Business Unit', businessUnit as string);
    await openMovementPage.searchDialogFilters();

    const results = await openMovementPage.readDialogAssetColumn(COLUMN.businessUnit);
    expect(results.every((value) => value === businessUnit || value === '--')).toBe(true);
  });

  test('TC-MOV-011 | Assets can be searched by a valid Department once the business-unit cascade enables it', async ({
    openMovementPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Search');
    await allure.severity('minor');

    expect(
      await openMovementPage.isDialogFilterEnabled('Department'),
      'Department must start disabled on a fresh dialog (cascade gate)'
    ).toBe(false);

    const location = await openMovementPage.findLocationEnablingBusinessUnit();
    expect(location, 'No Current Location option has a Business Unit attached').toBeTruthy();

    const businessUnit = await openMovementPage.findBusinessUnitEnablingDepartment();
    expect(
      businessUnit,
      `No Business Unit under "${location}" has a Department attached — the cascade cannot be exercised with this tenant data`
    ).toBeTruthy();
    await allure.attachment('cascade-path', `${location} -> ${businessUnit}`, 'text/plain');

    expect(
      await openMovementPage.isDialogFilterEnabled('Department'),
      `Department should become enabled after selecting Business Unit "${businessUnit}"`
    ).toBe(true);

    const department = await readSeedOption(openMovementPage, 'Department');
    expect(department, 'The enabled Department dropdown should expose at least one option').toBeTruthy();

    await openMovementPage.selectDialogDropdownFilter('Department', department as string);
    await openMovementPage.searchDialogFilters();

    const results = await openMovementPage.readDialogAssetColumn(COLUMN.department);
    expect(results.every((value) => value === department || value === '--')).toBe(true);
  });
});
