import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { TEST_DATA } from '../../../config/resources';
import { test } from '../../../fixtures/portalFixtures';

test.describe('IScore Asset Management - Tagging Asset Selection & Container Submit', () => {
  test('TC-TAG-ASSET-030 | Submit To Container is disabled with no selection', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Selection & Container Submit');
    await allure.severity('critical');

    await makerTaggingPage.assertSubmitToContainerDisabled();
  });

  test('TC-TAG-ASSET-031 | A single selected asset can be submitted to the container', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Selection & Container Submit');
    await allure.severity('blocker');

    const baselineCount = await makerTaggingPage.countAssetRows();
    const selectedCount = await makerTaggingPage.selectEligibleAssets(1);
    expect(selectedCount).toBe(1);

    await makerTaggingPage.assertSubmitToContainerEnabled();
    await makerTaggingPage.submitSelectionToContainer();
    await makerTaggingPage.assertAssetsLeftPendingList(baselineCount - selectedCount);
  });

  test('TC-TAG-ASSET-032 | Multiple selected assets can be submitted to the container', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Selection & Container Submit');
    await allure.severity('critical');

    const baselineCount = await makerTaggingPage.countAssetRows();
    const targetCount = TEST_DATA.tagging.multiSelectCount;
    const selectedCount = await makerTaggingPage.selectEligibleAssets(targetCount);
    expect(selectedCount).toBe(targetCount);

    await makerTaggingPage.assertSubmitToContainerEnabled();
    await makerTaggingPage.submitSelectionToContainer();
    await makerTaggingPage.assertAssetsLeftPendingList(baselineCount - selectedCount);
  });

  test('TC-TAG-ASSET-033 | Select-all submits every eligible asset to the container', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Selection & Container Submit');
    await allure.severity('critical');

    const eligibleCount = await makerTaggingPage.countEligibleAssets();
    await makerTaggingPage.selectAllAssets();

    const checkedCount = await makerTaggingPage.countCheckedAssets();
    expect(checkedCount).toBe(eligibleCount);

    await makerTaggingPage.assertSubmitToContainerEnabled();
    await makerTaggingPage.submitSelectionToContainer();
  });

  test('TC-TAG-ASSET-034 | An ineligible asset row cannot be selected', async ({ makerTaggingPage }, testInfo) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Selection & Container Submit');
    await allure.severity('normal');

    const ineligibleIndex = await makerTaggingPage.findFirstIneligibleAssetIndex();

    if (ineligibleIndex === undefined) {
      testInfo.skip(true, 'No ineligible asset row available in the current grid state');
      return;
    }

    await makerTaggingPage.assertNoIneligibleAssetSelectable(ineligibleIndex);
  });

  test('TC-TAG-ASSET-035 | Clearing the selection resets the checked asset count to zero', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Asset Selection & Container Submit');
    await allure.severity('normal');

    await makerTaggingPage.selectEligibleAssets(TEST_DATA.tagging.multiSelectCount);
    await makerTaggingPage.clearAssetSelection();

    const checkedCount = await makerTaggingPage.countCheckedAssets();
    expect(checkedCount).toBe(0);
  });
});
