import * as allure from 'allure-js-commons';
import { TEST_DATA } from '../../../config/resources';
import { expect, test } from '../../../fixtures/portalFixtures';
import {
  attachMovementContext,
  type CheckerSession,
  openMovementAsChecker,
  cleanUpMovementContainer,
  createAndSubmitMovementContainerAsMaker,
} from '../../../utils/movement/movementLifecycle';

/**
 * Checker completion gating and completion (TC-MOV-025 .. TC-MOV-028).
 *
 * Business rule under test: the Checker cannot Complete a container until EVERY
 * asset carries an Approve or Reject decision. The app expresses this through
 * the review bar's live "N selected · M pending" hint and by keeping Complete
 * disabled while M > 0 (verified live).
 *
 * TC-MOV-025 and TC-MOV-026 are negatives that never complete the container, so
 * their containers stay in Pending Checker Approval — which has no Delete
 * action. That is intentional and safe: nothing downstream keys off "the newest
 * row", every assertion uses the runtime-captured AMC- id.
 */
test.describe('Movement - Checker Completion', () => {
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

  test('TC-MOV-025 | Completion is prevented while no asset has an approval or rejection action', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(300_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Checker Completion Validation');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, TEST_DATA.movement.multiAssetCount);
    containerId = created.containerId;
    await attachMovementContext('submitted-movement', created);

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);

    expect(
      (await checkerMovement.readReviewCounts()).pending,
      'Every asset should still be pending because no decision was taken'
    ).toBe(created.assetNumbers.length);

    await checkerMovement.assertCompleteReviewDisabled();

    await checkerMovement.closeReviewDialog();
    await checkerMovement.assertContainerStatus(created.containerId, 'Pending Checker Approval');
  });

  test('TC-MOV-026 | Completion is prevented while some assets remain without a decision', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(360_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Checker Completion Validation');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, 2);
    containerId = created.containerId;
    const [decidedAsset, undecidedAsset] = created.assetNumbers;
    await attachMovementContext('submitted-movement', { ...created, decidedAsset, undecidedAsset });

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);

    // Decide only a SUBSET — one asset deliberately left without any action.
    await checkerMovement.selectAssetForReview(decidedAsset);
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);

    expect(
      (await checkerMovement.readReviewCounts()).pending,
      'The undecided asset must still count as pending'
    ).toBe(1);
    expect(await checkerMovement.readReviewAssetStatus(undecidedAsset)).toBe('Initiated by Maker');

    await checkerMovement.assertCompleteReviewDisabled();

    await checkerMovement.closeReviewDialog();
    await checkerMovement.assertContainerStatus(created.containerId, 'Pending Checker Approval');
  });

  test('TC-MOV-027 | The Checker can complete the container once every asset has a decision', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(420_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Checker Completion');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, TEST_DATA.movement.multiAssetCount);
    containerId = created.containerId;
    await attachMovementContext('submitted-movement', created);

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);

    await checkerMovement.assertCompleteReviewDisabled();
    await checkerMovement.selectAllAssetsForReview();
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);

    expect((await checkerMovement.readReviewCounts()).pending).toBe(0);
    await checkerMovement.assertCompleteReviewEnabled();
    await checkerMovement.completeContainerReview();
    await checkerMovement.closeReviewDialog();

    // The dialog's own tag lags the terminal status until the list refreshes
    // (same gotcha as Tagging) — re-read from the container grid.
    await checkerMovement.openByRoute();
    await checkerMovement.assertContainerStatus(created.containerId, 'Completed');
  });

  test('TC-MOV-028 | A completed container and its approved assets both read as Completed in the details', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(420_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Completed Container Details');
    await allure.severity('critical');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, TEST_DATA.movement.multiAssetCount);
    containerId = created.containerId;

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);
    await checkerMovement.selectAllAssetsForReview();
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);
    await checkerMovement.completeContainerReview();
    await checkerMovement.closeReviewDialog();

    await checkerMovement.openByRoute();
    await checkerMovement.assertContainerStatus(created.containerId, 'Completed');

    await checkerMovement.openShowDetails(created.containerId);
    expect(await checkerMovement.readShowDetailsStatusTag()).toBe('Completed');

    const statuses = await Promise.all(
      created.assetNumbers.map(async (fixedAssetNumber) => ({
        fixedAssetNumber,
        status: await checkerMovement.readReviewAssetStatus(fixedAssetNumber),
      }))
    );
    await attachMovementContext('completed-asset-statuses', statuses);

    for (const { fixedAssetNumber, status } of statuses) {
      expect(status, `Approved asset ${fixedAssetNumber} should read as a completed/approved status`).toMatch(
        /Completed|Approved/i
      );
    }

    await checkerMovement.closeShowDetails();
  });
});
