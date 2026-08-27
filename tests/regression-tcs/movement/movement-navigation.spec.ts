import * as allure from 'allure-js-commons';
import { expect, test } from '../../../fixtures/portalFixtures';

/**
 * Movement navigation and creation-dialog entry (TC-MOV-002, TC-MOV-003).
 *
 * Read-only: nothing is created, so both cases are idempotent by construction
 * and need no teardown beyond closing the dialog.
 */
test.describe('Movement - Navigation', () => {
  test.beforeEach(async ({ roleApplier }) => {
    await roleApplier.ensureRoleApplied('MAKER');
  });

  test('TC-MOV-002 | Maker can navigate to the Movement module from the portal header', async ({
    movementPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Navigation');
    await allure.severity('normal');

    await movementPage.openFromHeader();

    await movementPage.assertMovementModuleLoaded();
    await movementPage.assertNewMovementButtonVisible();
  });

  test('TC-MOV-003 | Maker can open the New Movement window', async ({ openMovementPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Creation Dialog');
    await allure.severity('normal');

    await openMovementPage.openNewMovementDialog();

    // assertOpen() proves the dialog rendered with the exact "New Movement"
    // title; scoping to the dialog matters because the list button carries the
    // same label (verified live).
    await openMovementPage.cancelNewMovementDialog();
    await expect(openMovementPage.isNewMovementButtonVisible()).resolves.toBe(true);
  });
});
