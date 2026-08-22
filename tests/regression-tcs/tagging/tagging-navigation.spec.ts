import * as allure from 'allure-js-commons';
import { TaggingPage } from '../../../pages/portal-pages/tagging/TaggingPage';
import { test } from '../../../fixtures/portalFixtures';

test.describe('IScore Asset Management - Tagging Navigation', () => {
  test('TC-TAG-ASSET-001 | Tagging is available and opens from the header', async ({ makerTaggingPage }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Navigation');
    await allure.severity('critical');

    await makerTaggingPage.assertModuleAvailableFromHeader();
    await makerTaggingPage.assertTaggingModuleLoaded();
  });

  test('TC-TAG-ASSET-002 | Header link and direct route both resolve to Tagging', async ({ authenticatedPortal }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Navigation');
    await allure.severity('normal');

    const taggingPage = new TaggingPage(authenticatedPortal);

    await taggingPage.openFromHeader();
    await taggingPage.assertTaggingModuleLoaded();

    await taggingPage.openByRoute();
    await taggingPage.assertTaggingModuleLoaded();
  });

  test('TC-TAG-ASSET-003 | Tagging opens by direct route without using the header', async ({
    authenticatedPortal,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Tagging Navigation');
    await allure.severity('normal');

    const taggingPage = new TaggingPage(authenticatedPortal);

    await taggingPage.openByRoute();
    await taggingPage.assertTaggingModuleLoaded();
  });
});
