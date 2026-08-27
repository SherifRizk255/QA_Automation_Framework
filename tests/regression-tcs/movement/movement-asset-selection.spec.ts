import * as allure from 'allure-js-commons';
import { TEST_DATA } from '../../../config/resources';
import { expect, test } from '../../../fixtures/portalFixtures';

/**
 * New Movement asset selection (TC-MOV-012, TC-MOV-013).
 *
 * Read-only: assets are ticked in the picker but the dialog is cancelled, so
 * nothing is persisted and neither case needs data teardown.
 *
 * Business rule (verified live): the picker grid is pre-populated before any
 * search, so applying a filter first is optional — TC-MOV-012 proves exactly
 * that.
 */
test.describe('Movement - Asset Selection', () => {
  test.beforeEach(async ({ roleApplier, openMovementPage }) => {
    await roleApplier.ensureRoleApplied('MAKER');
    await openMovementPage.openNewMovementDialog();
    await openMovementPage.selectMovementType('Selected Assets Movement');
  });

  test.afterEach(async ({ openMovementPage }) => {
    await openMovementPage.cancelNewMovementDialog();
  });

  test('TC-MOV-012 | An eligible asset can be selected without applying any search filter', async ({
    openMovementPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Selection');
    await allure.severity('normal');

    expect(
      await openMovementPage.countDialogAssetRows(),
      'The picker grid should be pre-populated before any filter is applied'
    ).toBeGreaterThan(0);

    // No filter set — pick whatever asset is eligible right now.
    const fixedAssetNumber = await openMovementPage.selectFirstEligibleDialogAsset();
    await allure.attachment('selected-asset', fixedAssetNumber, 'text/plain');

    await openMovementPage.assertDialogAssetChecked(fixedAssetNumber);
  });

  test('TC-MOV-013 | Multiple eligible assets can be selected in the same movement request', async ({
    openMovementPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Selection');
    await allure.severity('normal');

    const assetNumbers = await openMovementPage.selectEligibleDialogAssets(TEST_DATA.movement.multiAssetCount);
    await allure.attachment('selected-assets', JSON.stringify(assetNumbers), 'application/json');

    expect(assetNumbers).toHaveLength(TEST_DATA.movement.multiAssetCount);
    expect(new Set(assetNumbers).size, 'Each selection should be a distinct asset').toBe(assetNumbers.length);

    for (const fixedAssetNumber of assetNumbers) {
      await openMovementPage.assertDialogAssetChecked(fixedAssetNumber);
    }
  });
});
