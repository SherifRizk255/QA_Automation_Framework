import * as allure from 'allure-js-commons';
import { TEST_DATA } from '../../../config/resources';
import { expect, test } from '../../../fixtures/portalFixtures';
import {
  attachMovementContext,
  cleanUpMovementContainer,
  createMovementContainerAsMaker,
} from '../../../utils/movement/movementLifecycle';

/**
 * Movement creation and created-container details (TC-MOV-016, TC-MOV-017).
 *
 * Both cases create a real container as Maker. TEARDOWN deletes it via the
 * Created-state-only "Delete" action (verified live), so repeated runs never
 * accumulate un-submitted containers.
 */
test.describe('Movement - Create Container', () => {
  let containerId: string | undefined;

  test.beforeEach(async ({ roleApplier }) => {
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test.afterEach(async ({ authenticatedPortal }, testInfo) => {
    await cleanUpMovementContainer(authenticatedPortal, containerId, testInfo);
    containerId = undefined;
  });

  test('TC-MOV-016 | A Selected Assets Movement request is created with valid required data and starts in Created status', async ({
    openMovementPage,
  }, testInfo) => {
    testInfo.setTimeout(180_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Creation');
    await allure.severity('critical');

    const created = await createMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;
    await attachMovementContext('created-movement', created);

    expect(created.containerId, 'The new container reference should follow the AMC- convention').toMatch(/^AMC-\d+$/);
    await openMovementPage.assertContainerVisible(created.containerId);
    await openMovementPage.assertContainerStatus(created.containerId, 'Created');
  });

  test('TC-MOV-017 | The created movement request details match the data used during creation', async ({
    openMovementPage,
  }, testInfo) => {
    testInfo.setTimeout(180_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Details');
    await allure.severity('critical');

    // TC_SETUP: this case asserts on an ALREADY-created container, so creation
    // is setup, not the test action.
    const created = await createMovementContainerAsMaker(openMovementPage, TEST_DATA.movement.multiAssetCount);
    containerId = created.containerId;
    await attachMovementContext('created-movement', created);

    await openMovementPage.openShowDetails(created.containerId);

    expect(await openMovementPage.readShowDetailsStatusTag()).toBe('Created');
    expect(await openMovementPage.readShowDetailsValue('Target Location')).toBe(created.targetLocation);
    expect(await openMovementPage.readShowDetailsValue('Asset Count')).toBe(String(created.assetNumbers.length));
    expect(
      await openMovementPage.readShowDetailsValue('Requested By'),
      'The container should be attributed to the Maker that created it'
    ).not.toBe('');

    for (const fixedAssetNumber of created.assetNumbers) {
      await openMovementPage.assertShowDetailsContainsAsset(fixedAssetNumber);
    }

    await openMovementPage.closeShowDetails();
  });
});
