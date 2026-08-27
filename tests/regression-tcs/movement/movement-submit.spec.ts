import * as allure from 'allure-js-commons';
import { expect, test } from '../../../fixtures/portalFixtures';
import {
  attachMovementContext,
  type CheckerSession,
  openMovementAsChecker,
  cleanUpMovementContainer,
  createAndSubmitMovementContainerAsMaker,
  createMovementContainerAsMaker,
} from '../../../utils/movement/movementLifecycle';

/**
 * Submit to Checker and Checker visibility (TC-MOV-020, TC-MOV-021).
 *
 * TC-MOV-021 round-trips the shared demo account's role (Maker -> Checker), so
 * the suite restores MAKER in teardown with `{ force: true }` — the RoleApplier
 * caches per role per worker, and a cached hit would otherwise skip the switch
 * back (documented Tagging gotcha).
 *
 * A submitted container is an audit record with no Delete action, so teardown
 * only removes containers still in Created status. That is safe for repeat runs
 * because every run discovers fresh assets and captures a fresh AMC- id.
 */
test.describe('Movement - Submit to Checker', () => {
  let containerId: string | undefined;
  let checkerSession: CheckerSession | undefined;

  test.beforeEach(async ({ roleApplier }) => {
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test.afterEach(async ({ authenticatedPortal, roleApplier }, testInfo) => {
    if (checkerSession) {
      await checkerSession.context.close();
      checkerSession = undefined;
    }
    await cleanUpMovementContainer(authenticatedPortal, containerId, testInfo);
    containerId = undefined;
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test('TC-MOV-020 | A Created movement container can be submitted to the Checker', async ({
    openMovementPage,
  }, testInfo) => {
    testInfo.setTimeout(240_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Submit');
    await allure.severity('blocker');

    const created = await createMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;
    await attachMovementContext('created-movement', created);

    await openMovementPage.assertContainerStatus(created.containerId, 'Created');
    expect(
      await openMovementPage.readActionsMenuItems(created.containerId),
      'A Created container must offer Submit'
    ).toContain('Submit');

    // submitContainer() also asserts the confirmation dialog names this exact
    // container ("...assign AMC-xxxx to the checker?") before accepting.
    await openMovementPage.submitContainer(created.containerId);

    await openMovementPage.assertContainerStatus(created.containerId, 'Pending Checker Approval');
  });

  test('TC-MOV-021 | The Checker can find the submitted container with Pending Checker Approval status', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(300_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Checker Review');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;
    await attachMovementContext('submitted-movement', created);

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;

    await checkerMovement.assertContainerVisible(created.containerId);
    await checkerMovement.assertContainerStatus(created.containerId, 'Pending Checker Approval');

    expect(
      await checkerMovement.readActionsMenuItems(created.containerId),
      'The Checker must be offered the Review & Approve action for a pending container'
    ).toContain('Review & Approve');
  });
});
