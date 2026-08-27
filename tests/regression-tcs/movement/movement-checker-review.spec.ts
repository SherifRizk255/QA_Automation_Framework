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
 * Checker asset-level decisions (TC-MOV-022, TC-MOV-023, TC-MOV-024).
 *
 * Each case performs the FULL Maker chain it needs (create -> submit -> switch
 * role) in its own setup rather than depending on a sibling test having run, so
 * every case stays independently executable in any order — skill 12's absolute
 * rule. That costs runtime but is what makes the suite pass on every run.
 *
 * Business rules under test (all confirmed live):
 * - Checker decisions are taken per asset; one container can hold both.
 * - Asset status moves "Initiated by Maker" -> "Checker Approved" / "Checker Rejected".
 * - Approve/Reject each open the shared Confirmation dialog and run async
 *   (a p-blockui overlay flashes) — the review component waits both out.
 * - The review dialog can close itself after an Approve, so every sequential
 *   step goes through `ensureReviewOpen()`.
 */
const PENDING_STATUS = 'Initiated by Maker';

test.describe('Movement - Checker Review Decisions', () => {
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

  test('TC-MOV-022 | The Checker can approve all assets in a movement container', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(360_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Checker Review');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, TEST_DATA.movement.multiAssetCount);
    containerId = created.containerId;
    await attachMovementContext('submitted-movement', created);

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);

    expect(
      await checkerMovement.readReviewCounts(),
      'Every asset in a freshly submitted container should start pending Checker review'
    ).toEqual({ selected: 0, pending: created.assetNumbers.length });

    await checkerMovement.selectAllAssetsForReview();
    await checkerMovement.assertApproveSelectedEnabled();
    await checkerMovement.approveSelectedAssets();

    await checkerMovement.ensureReviewOpen(created.containerId);
    expect(
      (await checkerMovement.readReviewCounts()).pending,
      'Approving every ticked asset should leave none pending'
    ).toBe(0);

    for (const fixedAssetNumber of created.assetNumbers) {
      expect(
        await checkerMovement.readReviewAssetStatus(fixedAssetNumber),
        `Asset ${fixedAssetNumber} should read as Checker Approved`
      ).toBe('Checker Approved');
    }

    await checkerMovement.assertCompleteReviewEnabled();
    await checkerMovement.closeReviewDialog();
  });

  test('TC-MOV-023 | The Checker can reject selected assets while the rest stay pending', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(360_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Checker Review');
    await allure.severity('critical');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, TEST_DATA.movement.multiAssetCount);
    containerId = created.containerId;
    const [assetToReject, ...untouchedAssets] = created.assetNumbers;
    await attachMovementContext('submitted-movement', { ...created, assetToReject });

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);

    await checkerMovement.selectAssetForReview(assetToReject);
    await checkerMovement.assertRejectSelectedEnabled();
    await checkerMovement.rejectSelectedAssets('Rejected by Movement regression automation');

    await checkerMovement.ensureReviewOpen(created.containerId);

    expect(
      await checkerMovement.readReviewAssetStatus(assetToReject),
      'The rejected asset should read as Checker Rejected'
    ).toBe('Checker Rejected');

    for (const fixedAssetNumber of untouchedAssets) {
      expect(
        await checkerMovement.readReviewAssetStatus(fixedAssetNumber),
        `Asset ${fixedAssetNumber} had no decision taken, so it must stay pending`
      ).toBe(PENDING_STATUS);
    }

    expect(
      (await checkerMovement.readReviewCounts()).pending,
      'Only the untouched assets should remain pending after rejecting one'
    ).toBe(untouchedAssets.length);

    await checkerMovement.closeReviewDialog();
  });

  test('TC-MOV-024 | The Checker can approve some assets and reject others in the same container', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(360_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Checker Mixed Decisions');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, 2);
    containerId = created.containerId;
    const [assetToApprove, assetToReject] = created.assetNumbers;
    await attachMovementContext('submitted-movement', { ...created, assetToApprove, assetToReject });

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);

    await checkerMovement.selectAssetForReview(assetToApprove);
    await checkerMovement.approveSelectedAssets();

    await checkerMovement.ensureReviewOpen(created.containerId);
    expect(
      (await checkerMovement.readReviewCounts()).pending,
      'One asset is still undecided after approving only the first'
    ).toBe(1);

    await checkerMovement.selectAssetForReview(assetToReject);
    await checkerMovement.rejectSelectedAssets('Rejected by Movement regression automation');

    await checkerMovement.ensureReviewOpen(created.containerId);

    expect(await checkerMovement.readReviewAssetStatus(assetToApprove)).toBe('Checker Approved');
    expect(await checkerMovement.readReviewAssetStatus(assetToReject)).toBe('Checker Rejected');
    expect(
      (await checkerMovement.readReviewCounts()).pending,
      'Every asset now has a decision (one approved, one rejected)'
    ).toBe(0);

    await checkerMovement.assertCompleteReviewEnabled();
    await checkerMovement.closeReviewDialog();
  });
});
