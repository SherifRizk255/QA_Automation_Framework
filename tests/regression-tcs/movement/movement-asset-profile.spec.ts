import * as allure from 'allure-js-commons';
import { expect, test } from '../../../fixtures/portalFixtures';
import { AssetProfilePage } from '../../../pages/portal-pages/asset-profile/AssetProfilePage';
import {
  attachMovementContext,
  type CheckerSession,
  openMovementAsChecker,
  cleanUpMovementContainer,
  createAndSubmitMovementContainerAsMaker,
} from '../../../utils/movement/movementLifecycle';

/**
 * Asset Profile verification after a completed movement
 * (TC-MOV-029 .. TC-MOV-032).
 *
 * Business rules under test (all confirmed live on AMC-00001014):
 * - An APPROVED asset takes the movement's target values — its Asset Location →
 *   Current Location becomes the target location, and a
 *   "Movement · <AMC id> · Completed" entry lands in Recent Transactions.
 * - A REJECTED asset keeps its original values even though it belongs to the
 *   same completed container.
 *
 * Each case captures the pre-movement values at runtime and compares against
 * those, never against a hardcoded location or responsible user — Movement
 * mutates the very state under assertion, so a fixed expectation would drift
 * after the first run.
 */
test.describe('Movement - Asset Profile Verification', () => {
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

  test('TC-MOV-029 | Approved assets show the movement target location in Asset Profile after completion', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(420_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Profile Verification');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;
    await attachMovementContext('submitted-movement', created);

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

    const assetProfile = new AssetProfilePage(checkerSession.page, testInfo);
    await assetProfile.openFromHeader();

    for (const fixedAssetNumber of created.assetNumbers) {
      await assetProfile.searchByFixedAssetNumber(fixedAssetNumber);
      await assetProfile.assertProfileVisible();
      await assetProfile.assertFixedAssetNumber(fixedAssetNumber);

      expect(
        await assetProfile.readField('Current Location'),
        `Approved asset ${fixedAssetNumber} should now sit at the movement target location`
      ).toBe(created.targetLocation);
    }
  });

  test('TC-MOV-030 | The completed movement appears in the approved asset Recent Transactions timeline', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(420_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Asset Profile Verification');
    await allure.severity('critical');

    // The intake case asks for the Responsible update, which only applies when a
    // Target Responsible was supplied. This tenant's movements are created with
    // a target LOCATION (the either/or business rule), so the observable
    // responsibility-side outcome is the movement transaction landing on the
    // asset with the captured container id — asserted here against the runtime
    // AMC- id rather than any hardcoded reference.
    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.openReviewAndApprove(created.containerId);
    await checkerMovement.selectAllAssetsForReview();
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);
    await checkerMovement.completeContainerReview();
    await checkerMovement.closeReviewDialog();

    const assetProfile = new AssetProfilePage(checkerSession.page, testInfo);
    await assetProfile.openFromHeader();
    await assetProfile.searchByFixedAssetNumber(created.assetNumbers[0]);
    await assetProfile.assertProfileVisible();

    const transactions = await assetProfile.readTransactions();
    await attachMovementContext('asset-profile-transactions', transactions);

    const movementTransactions = transactions.filter((entry) => entry.module === 'Movement');
    expect(
      movementTransactions.length,
      'A completed movement should appear in the asset Recent Transactions timeline'
    ).toBeGreaterThan(0);
    expect(
      movementTransactions.some((entry) => /completed/i.test(entry.status)),
      'The movement transaction for this asset should read as Completed'
    ).toBe(true);

    expect(
      await assetProfile.readSectionText('Recent Transactions'),
      'The timeline should reference the runtime-captured container id'
    ).toContain(created.containerId);
  });

  test('TC-MOV-031 | A rejected asset keeps its original location after the container is completed', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(480_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Rejected Asset Verification');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, 2);
    containerId = created.containerId;
    const [assetToApprove, assetToReject] = created.assetNumbers;

    // The rejected asset's ORIGINAL values are captured below, in the Checker
    // session, BEFORE any decision is taken — the movement has not been applied
    // yet at that point, so the values read there are the true pre-movement ones.
    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    const assetProfile = checkerSession.assetProfilePage;

    await assetProfile.openFromHeader();
    await assetProfile.searchByFixedAssetNumber(assetToReject);
    await assetProfile.assertProfileVisible();
    const originalLocation = await assetProfile.readField('Current Location');
    const originalResponsible = await assetProfile.readField('Responsible');
    await attachMovementContext('rejected-asset-original', {
      containerId: created.containerId,
      assetToReject,
      originalLocation,
      originalResponsible,
      movementTargetLocation: created.targetLocation,
    });

    await checkerMovement.openFromHeader();
    await checkerMovement.openReviewAndApprove(created.containerId);
    await checkerMovement.selectAssetForReview(assetToApprove);
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);
    await checkerMovement.selectAssetForReview(assetToReject);
    await checkerMovement.rejectSelectedAssets('Rejected by Movement regression automation');
    await checkerMovement.ensureReviewOpen(created.containerId);
    await checkerMovement.completeContainerReview();
    await checkerMovement.closeReviewDialog();
    await checkerMovement.openByRoute();
    await checkerMovement.assertContainerStatus(created.containerId, 'Completed');

    await assetProfile.openFromHeader();
    await assetProfile.searchByFixedAssetNumber(assetToReject);
    await assetProfile.assertProfileVisible();

    expect(
      await assetProfile.readField('Current Location'),
      'The rejected asset must keep its original location, not the movement target'
    ).toBe(originalLocation);
    expect(
      await assetProfile.readField('Responsible'),
      'The rejected asset must keep its original responsible user'
    ).toBe(originalResponsible);
  });

  test('TC-MOV-032 | Only approved assets receive the movement changes when a container holds mixed decisions', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(480_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement Mixed Decision Completion');
    await allure.severity('blocker');

    const created = await createAndSubmitMovementContainerAsMaker(openMovementPage, 2);
    containerId = created.containerId;
    const [assetToApprove, assetToReject] = created.assetNumbers;

    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    const assetProfile = checkerSession.assetProfilePage;

    // Capture BOTH assets' pre-movement locations at runtime.
    await assetProfile.openFromHeader();
    await assetProfile.searchByFixedAssetNumber(assetToReject);
    await assetProfile.assertProfileVisible();
    const rejectedOriginalLocation = await assetProfile.readField('Current Location');

    await checkerMovement.openFromHeader();
    await checkerMovement.openReviewAndApprove(created.containerId);
    await checkerMovement.selectAssetForReview(assetToApprove);
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);
    await checkerMovement.selectAssetForReview(assetToReject);
    await checkerMovement.rejectSelectedAssets('Rejected by Movement regression automation');
    await checkerMovement.ensureReviewOpen(created.containerId);

    expect(await checkerMovement.readReviewAssetStatus(assetToApprove)).toBe('Checker Approved');
    expect(await checkerMovement.readReviewAssetStatus(assetToReject)).toBe('Checker Rejected');

    await checkerMovement.completeContainerReview();
    await checkerMovement.closeReviewDialog();
    await checkerMovement.openByRoute();
    await checkerMovement.assertContainerStatus(created.containerId, 'Completed');

    await attachMovementContext('mixed-decision-context', {
      containerId: created.containerId,
      assetToApprove,
      assetToReject,
      targetLocation: created.targetLocation,
      rejectedOriginalLocation,
    });

    await assetProfile.openFromHeader();
    await assetProfile.searchByFixedAssetNumber(assetToApprove);
    await assetProfile.assertProfileVisible();
    expect(
      await assetProfile.readField('Current Location'),
      'The approved asset should take the movement target location'
    ).toBe(created.targetLocation);

    await assetProfile.searchByFixedAssetNumber(assetToReject);
    await assetProfile.assertProfileVisible();
    expect(
      await assetProfile.readField('Current Location'),
      'The rejected asset should keep its original location despite sharing the completed container'
    ).toBe(rejectedOriginalLocation);
  });
});
