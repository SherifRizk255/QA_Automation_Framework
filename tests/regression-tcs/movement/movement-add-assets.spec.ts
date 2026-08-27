import * as allure from 'allure-js-commons';
import { expect, test } from '../../../fixtures/portalFixtures';
import {
  attachMovementContext,
  cleanUpMovementContainer,
  createMovementContainerAsMaker,
} from '../../../utils/movement/movementLifecycle';

/**
 * Add Assets to a Created movement container (TC-MOV-018, TC-MOV-019).
 *
 * Business rule (verified live): "Add Assets" is only offered while the
 * container is still in Created status — once submitted the Actions menu drops
 * it. Each case therefore creates its OWN container in setup so it stays
 * independently executable in any order, and deletes it in teardown.
 */
test.describe('Movement - Add Assets', () => {
  let containerId: string | undefined;

  test.beforeEach(async ({ roleApplier }) => {
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test.afterEach(async ({ authenticatedPortal }, testInfo) => {
    await cleanUpMovementContainer(authenticatedPortal, containerId, testInfo);
    containerId = undefined;
  });

  test('TC-MOV-018 | More eligible assets can be added while the container is in Created status', async ({
    openMovementPage,
  }, testInfo) => {
    testInfo.setTimeout(240_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Add Assets');
    await allure.severity('critical');

    const created = await createMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;
    await attachMovementContext('created-movement', created);
    await openMovementPage.assertContainerStatus(created.containerId, 'Created');

    expect(
      await openMovementPage.readActionsMenuItems(created.containerId),
      'A Created container must offer Add Assets'
    ).toContain('Add Assets');

    const added = await openMovementPage.addAssetsFromActions(created.containerId, 1, created.assetNumbers);
    await allure.attachment('added-assets', JSON.stringify(added), 'application/json');

    expect(added).toHaveLength(1);
    expect(created.assetNumbers, 'The added asset must not duplicate one already in the container').not.toContain(added[0]);
  });

  test('TC-MOV-019 | Newly added assets appear in the movement container details and update the asset count', async ({
    openMovementPage,
  }, testInfo) => {
    testInfo.setTimeout(240_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Add Assets');
    await allure.severity('critical');

    const created = await createMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;

    const added = await openMovementPage.addAssetsFromActions(created.containerId, 1, created.assetNumbers);
    const expectedAssets = [...created.assetNumbers, ...added];
    await attachMovementContext('expected-assets', { containerId: created.containerId, expectedAssets });

    await openMovementPage.openShowDetails(created.containerId);

    for (const fixedAssetNumber of expectedAssets) {
      await openMovementPage.assertShowDetailsContainsAsset(fixedAssetNumber);
    }
    expect(
      await openMovementPage.readShowDetailsValue('Asset Count'),
      'The container asset count should reflect the newly added asset'
    ).toBe(String(expectedAssets.length));

    await openMovementPage.closeShowDetails();
  });
});
