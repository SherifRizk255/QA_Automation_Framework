import * as allure from 'allure-js-commons';
import { expect, test } from '../../fixtures/portalFixtures';
import { AssetProfilePage } from '../../pages/portal-pages/asset-profile/AssetProfilePage';
import {
  attachMovementContext,
  cleanUpMovementContainer,
  createMovementContainerAsMaker,
  openMovementAsChecker,
  type CheckerSession,
} from '../../utils/movement/movementLifecycle';

/**
 * Movement smoke: the single critical path proving the module works end to end
 * on a fresh environment — Maker creates and submits a container, the Checker
 * reviews, approves every asset and completes it, and Asset Profile then
 * reflects the movement target location for the approved asset.
 *
 * Deeper per-rule coverage (search filters, cascade, validation negatives,
 * mixed approve/reject decisions, completion gating, rejected-asset
 * verification) lives in tests/regression-tcs/movement/ as TC-MOV-001..032.
 *
 * All runtime data (the AMC- container id and the discovered Fixed Asset
 * Number) is captured live and flows between the Maker, Checker and Asset
 * Profile stages — nothing is hardcoded. Teardown deletes the container while
 * it is still deletable (Created state) and restores the shared demo account
 * to Maker.
 */
test.describe('IScore Asset Management - Movement Maker to Checker Container', () => {
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

  test('MOV-SM-001 | Maker creates and submits a movement container; Checker approves and completes it; Asset Profile reflects the movement', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(420_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Movement Maker to Checker Container Lifecycle');
    await allure.severity('blocker');

    // ─── Maker: create + submit ──────────────────────────────────────────
    const created = await createMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;
    await attachMovementContext('movement-container', created);

    expect(created.containerId, 'The container reference should follow the AMC- convention').toMatch(/^AMC-\d+$/);
    await openMovementPage.assertContainerVisible(created.containerId);
    await openMovementPage.assertContainerStatus(created.containerId, 'Created');

    await openMovementPage.submitContainer(created.containerId);
    await openMovementPage.assertContainerStatus(created.containerId, 'Pending Checker Approval');

    // ─── Checker: review, approve all, complete ──────────────────────────
    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;

    await checkerMovement.assertContainerStatus(created.containerId, 'Pending Checker Approval');
    await checkerMovement.openReviewAndApprove(created.containerId);

    // Source of truth for what the container holds is the review dialog itself —
    // the Maker picker return can under-count when a selected asset carries
    // components the module pulls in with it.
    const containerAssets = await checkerMovement.readReviewAssetNumbers();
    expect(containerAssets.length, 'The submitted container should hold at least one asset').toBeGreaterThan(0);

    expect(
      await checkerMovement.readReviewCounts(),
      'Every freshly submitted asset should start pending Checker review'
    ).toEqual({ selected: 0, pending: containerAssets.length });
    await checkerMovement.assertCompleteReviewDisabled();

    await checkerMovement.selectAllAssetsForReview();
    await checkerMovement.assertApproveSelectedEnabled();
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);

    expect((await checkerMovement.readReviewCounts()).pending).toBe(0);
    for (const fixedAssetNumber of containerAssets) {
      expect(await checkerMovement.readReviewAssetStatus(fixedAssetNumber)).toBe('Checker Approved');
    }

    await checkerMovement.assertCompleteReviewEnabled();
    await checkerMovement.completeContainerReview();
    await checkerMovement.closeReviewDialog();

    await checkerMovement.openByRoute();
    await checkerMovement.assertContainerStatus(created.containerId, 'Completed');

    // ─── Asset Profile: the approved asset reflects the movement ─────────
    const assetProfile = new AssetProfilePage(checkerSession.page, testInfo);
    await assetProfile.openFromHeader();

    for (const fixedAssetNumber of containerAssets) {
      await assetProfile.searchByFixedAssetNumber(fixedAssetNumber);
      await assetProfile.assertProfileVisible();
      await assetProfile.assertFixedAssetNumber(fixedAssetNumber);

      expect(
        await assetProfile.readField('Current Location'),
        `Approved asset ${fixedAssetNumber} should now sit at the movement target location`
      ).toBe(created.targetLocation);
      expect(
        await assetProfile.readSectionText('Recent Transactions'),
        `Asset ${fixedAssetNumber} should record the completed movement container`
      ).toContain(created.containerId);
    }
  });
});
