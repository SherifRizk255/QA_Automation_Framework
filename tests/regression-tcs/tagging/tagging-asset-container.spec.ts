import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { TEST_DATA } from '../../../config/resources';
import { test } from '../../../fixtures/portalFixtures';

/**
 * Add Tracking asset-selection regression: single/multiple selection,
 * unselect, ineligible (dimmed) rows, and checked-count bookkeeping.
 *
 * REWRITTEN 2026-08-24 (skill 16 self-healing / stabilization): the previous
 * version drove `AssetSelectionGridComponent` directly against the Tagging
 * landing page, which has no checkbox grid or Submit button — that UI only
 * exists inside the Add Tracking dialog (proven live: 5 of 6 cases failed
 * outright, timing out on a `role=button[name=/submit/i]` that does not
 * exist on this screen). Rewritten to open the dialog (already verified by
 * the TC-TAG-ASSET-040 smoke test) and drive its picker grid instead.
 *
 * Every test cancels the dialog in afterEach — none of these cases save a
 * container, so no CRM data is created here (the create/save/submit path is
 * already covered end-to-end by the smoke test).
 */
test.describe('IScore Asset Management - Add Tracking Asset Selection', () => {
  test.beforeEach(async ({ makerTaggingPage }) => {
    await makerTaggingPage.openAddTrackingDialog();
  });

  test.afterEach(async ({ makerTaggingPage }) => {
    await makerTaggingPage.cancelAddTrackingDialog();
  });

  test('TC-TAG-ASSET-031 | [Positive] A single selected asset enables Save and is checked', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Asset Selection');
    await allure.severity('blocker');

    await makerTaggingPage.assertTrackingDialogSaveDisabled();

    const [selected] = await makerTaggingPage.selectEligibleTrackingDialogAssets(1);
    await makerTaggingPage.assertTrackingDialogAssetChecked(selected);
    expect(await makerTaggingPage.countCheckedTrackingDialogAssetsOnCurrentPage()).toBe(1);
    await makerTaggingPage.assertTrackingDialogSaveEnabled();
  });

  test('TC-TAG-ASSET-032 | [Positive] Multiple selected assets are all checked and enable Save', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Asset Selection');
    await allure.severity('critical');

    const targetCount = TEST_DATA.tagging.multiSelectCount;
    const selected = await makerTaggingPage.selectEligibleTrackingDialogAssets(targetCount);
    expect(selected.length).toBe(targetCount);

    for (const fixedAssetNumber of selected) {
      await makerTaggingPage.assertTrackingDialogAssetChecked(fixedAssetNumber);
    }

    expect(await makerTaggingPage.countCheckedTrackingDialogAssetsOnCurrentPage()).toBeGreaterThanOrEqual(
      Math.min(targetCount, await makerTaggingPage.countEligibleTrackingDialogAssetsOnCurrentPage())
    );
    await makerTaggingPage.assertTrackingDialogSaveEnabled();
  });

  test('TC-TAG-ASSET-033 | [Positive] Every eligible asset on the current page can be selected', async ({
    makerTaggingPage,
  }, testInfo) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Asset Selection');
    await allure.severity('critical');

    const eligibleCount = await makerTaggingPage.countEligibleTrackingDialogAssetsOnCurrentPage();

    if (eligibleCount === 0) {
      // Shared demo dataset: heavy regression/manual testing can temporarily
      // exhaust unlinked assets on the first picker page. Not a code or app
      // defect — skip rather than fail on a data-availability condition.
      testInfo.skip(true, 'No eligible (unlinked) asset available on the current picker grid page');
      return;
    }

    await makerTaggingPage.selectEligibleTrackingDialogAssets(eligibleCount);

    const checkedCount = await makerTaggingPage.countCheckedTrackingDialogAssetsOnCurrentPage();
    expect(
      checkedCount,
      `Expected all ${eligibleCount} eligible asset(s) on this page to be checked`
    ).toBe(eligibleCount);
    await makerTaggingPage.assertTrackingDialogSaveEnabled();
  });

  test('TC-TAG-ASSET-034 | [Negative] A dimmed (already-linked) asset row cannot be selected', async ({
    makerTaggingPage,
  }, testInfo) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Asset Selection');
    await allure.severity('normal');

    const dimmedFixedAssetNumber = await makerTaggingPage.findFirstDimmedTrackingDialogAsset();

    if (dimmedFixedAssetNumber === undefined) {
      testInfo.skip(true, 'No dimmed (already-linked) asset row available on the current picker grid page');
      return;
    }

    await makerTaggingPage.assertTrackingDialogAssetNotSelectable(dimmedFixedAssetNumber);
  });

  test('TC-TAG-ASSET-035 | [Positive] Unselecting the only selected asset returns the checked count to zero', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Asset Selection');
    await allure.severity('normal');

    const [selected] = await makerTaggingPage.selectEligibleTrackingDialogAssets(1);
    expect(await makerTaggingPage.countCheckedTrackingDialogAssetsOnCurrentPage()).toBe(1);

    await makerTaggingPage.unselectTrackingDialogAsset(selected);

    expect(await makerTaggingPage.countCheckedTrackingDialogAssetsOnCurrentPage()).toBe(0);
    await makerTaggingPage.assertTrackingDialogSaveDisabled();
  });
});
