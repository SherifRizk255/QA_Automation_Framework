import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { TEST_DATA } from '../../../config/resources';
import { test } from '../../../fixtures/portalFixtures';

test.describe('IScore Asset Management - Tagging Advanced Filters', () => {
  test('TC-TAG-ASSET-020 | The advanced filter panel opens', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Advanced Filters');
    await allure.severity('normal');

    await makerTaggingPage.expandAdvancedFilters();
  });

  test('TC-TAG-ASSET-021 | Applying a matching filter narrows the grid', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Advanced Filters');
    await allure.severity('critical');

    const baselineCount = await makerTaggingPage.countAssetRows();
    await makerTaggingPage.expandAdvancedFilters();

    const matchValue = TEST_DATA.tagging.filterMatchValue || (await makerTaggingPage.readAssetIdentifier(0));
    await makerTaggingPage.applyAdvancedFilter(TEST_DATA.tagging.filterFieldLabel, matchValue);

    const filteredCount = await makerTaggingPage.countAssetRows();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(baselineCount);
  });

  test('TC-TAG-ASSET-022 | Resetting the filter restores the original grid', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Advanced Filters');
    await allure.severity('normal');

    const baselineCount = await makerTaggingPage.countAssetRows();
    await makerTaggingPage.expandAdvancedFilters();

    const matchValue = TEST_DATA.tagging.filterMatchValue || (await makerTaggingPage.readAssetIdentifier(0));
    await makerTaggingPage.applyAdvancedFilter(TEST_DATA.tagging.filterFieldLabel, matchValue);
    await makerTaggingPage.resetAdvancedFilters();

    await makerTaggingPage.assertAssetsLeftPendingList(baselineCount);
  });

  test('TC-TAG-ASSET-023 | A non-matching filter value shows the empty state', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Advanced Filters');
    await allure.severity('normal');

    await makerTaggingPage.expandAdvancedFilters();
    await makerTaggingPage.applyAdvancedFilter(
      TEST_DATA.tagging.filterFieldLabel,
      TEST_DATA.tagging.filterNoMatchValue
    );

    await makerTaggingPage.assertFilterResultsEmpty();
  });

  test('TC-TAG-ASSET-024 | The applied filter value is reflected back by the panel', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Advanced Filters');
    await allure.severity('minor');

    await makerTaggingPage.expandAdvancedFilters();

    const matchValue = TEST_DATA.tagging.filterMatchValue || (await makerTaggingPage.readAssetIdentifier(0));
    await makerTaggingPage.applyAdvancedFilter(TEST_DATA.tagging.filterFieldLabel, matchValue);

    const activeFilterLabels = await makerTaggingPage.readActiveFilterLabels();
    expect(activeFilterLabels.some((label) => label.includes(matchValue))).toBe(true);
  });
});
