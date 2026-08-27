import * as allure from 'allure-js-commons';
import { TEST_DATA } from '../../../config/resources';
import { expect, test } from '../../../fixtures/portalFixtures';
import { AssetProfilePage } from '../../../pages/portal-pages/asset-profile/AssetProfilePage';
import {
  attachMovementContext,
  type CheckerSession,
  openMovementAsChecker,
  cleanUpMovementContainer,
  createMovementContainerAsMaker,
} from '../../../utils/movement/movementLifecycle';

/**
 * TC-MOV-001 — the full Movement lifecycle in one pass: Maker creates a
 * container, extends it via Add Assets, submits it; the Checker reviews,
 * approves every asset and completes it; Asset Profile then reflects the
 * movement target data for the approved assets.
 *
 * Every id flowing between the Maker, Checker and Asset Profile stages is
 * captured at runtime (the AMC- container reference and the discovered Fixed
 * Asset Numbers) — nothing is hardcoded and nothing keys off "the newest row".
 */
test.describe('Movement - End-to-End Lifecycle', () => {
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

  test('TC-MOV-001 | A movement request completes from Maker creation through Checker completion and Asset Profile update', async ({
    openMovementPage,
    browser,
    roleApplier,
  }, testInfo) => {
    testInfo.setTimeout(600_000);
    await allure.feature('IScore Asset Management');
    await allure.story('Movement End-to-End Lifecycle');
    await allure.severity('blocker');

    // ─── Maker: create ────────────────────────────────────────────────────
    const created = await createMovementContainerAsMaker(openMovementPage, 1);
    containerId = created.containerId;
    await attachMovementContext('created-movement', created);

    await openMovementPage.assertContainerVisible(created.containerId);
    await openMovementPage.assertContainerStatus(created.containerId, 'Created');

    await openMovementPage.openShowDetails(created.containerId);
    expect(await openMovementPage.readShowDetailsStatusTag()).toBe('Created');
    expect(await openMovementPage.readShowDetailsValue('Target Location')).toBe(created.targetLocation);
    await openMovementPage.closeShowDetails();

    // ─── Maker: extend via Add Assets ──────────────────────────────────────
    const addedAssets = await openMovementPage.addAssetsFromActions(
      created.containerId,
      TEST_DATA.movement.multiAssetCount - 1,
      created.assetNumbers
    );
    const allAssets = [...created.assetNumbers, ...addedAssets];
    await attachMovementContext('all-assets', { containerId: created.containerId, allAssets });

    await openMovementPage.openShowDetails(created.containerId);
    for (const fixedAssetNumber of allAssets) {
      await openMovementPage.assertShowDetailsContainsAsset(fixedAssetNumber);
    }
    expect(await openMovementPage.readShowDetailsValue('Asset Count')).toBe(String(allAssets.length));
    await openMovementPage.closeShowDetails();

    // ─── Maker: submit ────────────────────────────────────────────────────
    await openMovementPage.submitContainer(created.containerId);
    await openMovementPage.assertContainerStatus(created.containerId, 'Pending Checker Approval');

    // ─── Checker: review, approve all, complete ───────────────────────────
    checkerSession = await openMovementAsChecker(browser, roleApplier, testInfo);
    const checkerMovement = checkerSession.movementPage;
    await checkerMovement.assertContainerStatus(created.containerId, 'Pending Checker Approval');

    await checkerMovement.openReviewAndApprove(created.containerId);
    expect(await checkerMovement.readReviewCounts()).toEqual({ selected: 0, pending: allAssets.length });
    await checkerMovement.assertCompleteReviewDisabled();

    await checkerMovement.selectAllAssetsForReview();
    await checkerMovement.approveSelectedAssets();
    await checkerMovement.ensureReviewOpen(created.containerId);

    expect((await checkerMovement.readReviewCounts()).pending).toBe(0);
    for (const fixedAssetNumber of allAssets) {
      expect(await checkerMovement.readReviewAssetStatus(fixedAssetNumber)).toBe('Checker Approved');
    }

    await checkerMovement.assertCompleteReviewEnabled();
    await checkerMovement.completeContainerReview();
    await checkerMovement.closeReviewDialog();

    await checkerMovement.openByRoute();
    await checkerMovement.assertContainerStatus(created.containerId, 'Completed');

    // ─── Asset Profile: every approved asset reflects the movement ─────────
    const assetProfile = new AssetProfilePage(checkerSession.page, testInfo);
    await assetProfile.openFromHeader();

    for (const fixedAssetNumber of allAssets) {
      await assetProfile.searchByFixedAssetNumber(fixedAssetNumber);
      await assetProfile.assertProfileVisible();
      await assetProfile.assertFixedAssetNumber(fixedAssetNumber);

      expect(
        await assetProfile.readField('Current Location'),
        `Approved asset ${fixedAssetNumber} should sit at the movement target location`
      ).toBe(created.targetLocation);
      expect(
        await assetProfile.readSectionText('Recent Transactions'),
        `Asset ${fixedAssetNumber} should record the completed movement container`
      ).toContain(created.containerId);
    }
  });
});
