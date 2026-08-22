import * as allure from 'allure-js-commons';
import { AssetPortalLoginPage } from '../../../../pages/portal-pages/asset-management/AssetPortalLoginPage';
import { PortalShellPage } from '../../../../pages/portal-pages/asset-management/PortalShellPage';
import { TaggingPage } from '../../../../pages/portal-pages/asset-management/TaggingPage';
import { test } from '../../../../fixtures/assetManagementFixtures';

test.describe('IScore Asset Management - Login & Tagging Session Cycle', () => {
  test('TC-AUTH-ASSET-010 | Maker signs in and opens Tagging from the header', async ({ signInAs }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Login & Tagging Session Cycle');
    await allure.severity('blocker');

    const { page } = await signInAs('MAKER');
    const taggingPage = new TaggingPage(page);

    await taggingPage.openFromHeader();
    await taggingPage.assertTaggingModuleLoaded();
  });

  test('TC-AUTH-ASSET-011 | Maker signs out of the portal', async ({ signInAs }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Login & Tagging Session Cycle');
    await allure.severity('critical');

    const { page } = await signInAs('MAKER');
    const shell = new PortalShellPage(page);

    await shell.logout();
  });

  test('TC-AUTH-ASSET-012 | Maker repeats the login-Tagging cycle after logout', async ({ signInAs }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Login & Tagging Session Cycle');
    await allure.severity('critical');

    const { page } = await signInAs('MAKER');

    const firstTaggingPage = new TaggingPage(page);
    await firstTaggingPage.openFromHeader();
    await firstTaggingPage.assertTaggingModuleLoaded();

    const shell = new PortalShellPage(page);
    await shell.logout();

    const loginPage = new AssetPortalLoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithConfiguredUser();
    await loginPage.assertLoginRouteLeft();

    const secondTaggingPage = new TaggingPage(page);
    await secondTaggingPage.openFromHeader();
    await secondTaggingPage.assertTaggingModuleLoaded();
  });
});
