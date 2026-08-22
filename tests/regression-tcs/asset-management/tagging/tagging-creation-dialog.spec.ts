import * as allure from 'allure-js-commons';
import { test } from '../../../../fixtures/assetManagementFixtures';

test.describe('IScore Asset Management - Add Tracking Dialog', () => {
  test('TC-TAG-ASSET-010 | Add Tracking opens the creation dialog with title and fields', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Dialog');
    await allure.severity('critical');

    await makerTaggingPage.openAddTrackingDialog();
  });

  test('TC-TAG-ASSET-011 | Cancel closes the Add Tracking dialog', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Dialog');
    await allure.severity('normal');

    await makerTaggingPage.openAddTrackingDialog();
    await makerTaggingPage.cancelAddTrackingDialog();
  });

  test('TC-TAG-ASSET-012 | Escape dismisses the Add Tracking dialog', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Dialog');
    await allure.severity('normal');

    await makerTaggingPage.openAddTrackingDialog();
    await makerTaggingPage.dismissAddTrackingDialogWithEscape();
  });

  test('TC-TAG-ASSET-013 | Add Tracking dialog reopens cleanly after being cancelled', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Add Tracking Dialog');
    await allure.severity('minor');

    await makerTaggingPage.openAddTrackingDialog();
    await makerTaggingPage.cancelAddTrackingDialog();
    await makerTaggingPage.openAddTrackingDialog();
  });
});
