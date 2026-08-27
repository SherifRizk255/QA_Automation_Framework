import * as allure from 'allure-js-commons';
import { expect, test } from '../../../fixtures/portalFixtures';
import { ATTACHMENT_FIXTURE_PATH, generateRunValue } from '../../../utils/movement/movementLifecycle';

/**
 * New Movement validation negatives (TC-MOV-014, TC-MOV-015).
 *
 * The whole point of both cases is that Save is rejected, so NO container is
 * ever created and teardown is just closing the dialog — fully idempotent.
 *
 * Business rules under test (both confirmed live from the dialog's own inline
 * hint "Select a target location (with a memo) or a responsible person."):
 * - Location Memo is mandatory once a Target Location is selected.
 * - Reason is mandatory before the request can be saved.
 */
test.describe('Movement - Creation Validation', () => {
  test.beforeEach(async ({ roleApplier, openMovementPage }) => {
    await roleApplier.ensureRoleApplied('MAKER');
    await openMovementPage.openNewMovementDialog();
    await openMovementPage.selectMovementType('Selected Assets Movement');
  });

  test.afterEach(async ({ openMovementPage }) => {
    await openMovementPage.cancelNewMovementDialog();
  });

  test('TC-MOV-014 | Saving is rejected when a target location is selected without the mandatory location memo', async ({
    openMovementPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Creation Validation');
    await allure.severity('critical');

    const fixedAssetNumber = await openMovementPage.selectFirstEligibleDialogAsset();
    const targetLocation = await openMovementPage.pickTargetLocationDifferentFrom([]);
    await openMovementPage.selectTargetLocation(targetLocation);

    // Location Memo deliberately left empty; every OTHER required field is valid.
    await openMovementPage.uploadMovementAttachment(ATTACHMENT_FIXTURE_PATH);
    await openMovementPage.enterMovementReason(generateRunValue('QA reason'));

    await allure.attachment(
      'validation-context',
      JSON.stringify({ fixedAssetNumber, targetLocation, locationMemo: '' }, null, 2),
      'application/json'
    );

    await openMovementPage.assertSaveRejected();
  });

  test('TC-MOV-015 | Saving is rejected when the required Reason field is empty', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Creation Validation');
    await allure.severity('critical');

    const fixedAssetNumber = await openMovementPage.selectFirstEligibleDialogAsset();
    const targetLocation = await openMovementPage.pickTargetLocationDifferentFrom([]);
    const locationMemo = generateRunValue('QA memo');

    await openMovementPage.selectTargetLocation(targetLocation);
    await openMovementPage.enterLocationMemo(locationMemo);
    await openMovementPage.uploadMovementAttachment(ATTACHMENT_FIXTURE_PATH);
    // Reason deliberately left empty.

    await allure.attachment(
      'validation-context',
      JSON.stringify({ fixedAssetNumber, targetLocation, locationMemo, reason: '' }, null, 2),
      'application/json'
    );

    const { saveWasEnabled } = await openMovementPage.assertSaveRejected();
    expect(
      typeof saveWasEnabled,
      'assertSaveRejected should always report how the app gated the invalid form'
    ).toBe('boolean');
  });
});
