import { expect, type BrowserContext } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'node:path';
import { TEST_DATA } from '../../config/resources';
import { LoginPage } from '../../pages/portal-pages/LoginPage';
import { PortalShellPage } from '../../pages/portal-pages/PortalShellPage';
import { TaggingPage } from '../../pages/portal-pages/tagging/TaggingPage';
import { test } from '../../fixtures/portalFixtures';

const ATTACHMENT_FIXTURE_PATH = path.resolve(process.cwd(), TEST_DATA.tagging.attachmentFixturePath);
const ADDITIONAL_ASSET_COUNT = 1;

const computeNextTrackingNumber = (trackingNumber: string): string => {
  const match = trackingNumber.match(/^(.*?)(\d+)$/);
  if (!match) {
    throw new Error(`Unable to compute the next tracking number from "${trackingNumber}"`);
  }

  const [, prefix, numericPart] = match;
  return `${prefix}${String(Number(numericPart) + 1).padStart(numericPart.length, '0')}`;
};

test.describe('IScore Asset Management - Maker Creates & Submits Tracking Container, Then Checker Login', () => {
  let checkerContext: BrowserContext | undefined;

  test.beforeEach(async ({ roleApplier }) => {
    // Start state: force the shared demo account back to Maker before this test
    // drives its own Maker->Checker switch, even if a prior attempt failed mid-run.
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test.afterEach(async ({ roleApplier }) => {
    if (checkerContext) {
      await checkerContext.close();
      checkerContext = undefined;
    }
    // Restore start state on pass or failure so the next run begins Maker again.
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test('TC-TAG-ASSET-040 | Maker creates, updates and submits a tracking container; role then switches to Checker', async ({
    authenticatedPortal,
    roleApplier,
    browser,
  }, testInfo) => {
    // Complete's blocking loader (label printing) can run up to ~90s on its own
    // in an environment with no printer configured — budget accordingly.
    testInfo.setTimeout(330_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Maker to Checker Tracking Container Lifecycle');
    await allure.severity('blocker');

    const page = authenticatedPortal;
    const shell = new PortalShellPage(page);
    const taggingPage = new TaggingPage(page, testInfo);
    const substitutions: string[] = [];

    // ─── Maker: login & navigation ────────────────────────────────────────
    await shell.assertDashboardVisible();

    await taggingPage.openFromHeader();
    await taggingPage.assertTaggingModuleLoaded();

    // ─── Capture the current latest Tracking Number and compute the next one ──
    const previousTrackingNumber = await taggingPage.findLatestTrackingNumber();
    const expectedTrackingNumber = computeNextTrackingNumber(previousTrackingNumber);
    await allure.attachment(
      'tracking-number-sequence',
      `previous=${previousTrackingNumber} expected=${expectedTrackingNumber}`,
      'text/plain'
    );

    // ─── Add Tracking: open, validate filters, select assets, attach, save ──
    await taggingPage.openAddTrackingDialog();
    await taggingPage.assertAllTrackingDialogFilterFieldsPresent();

    await taggingPage.verifyAssetCheckUncheckCycle(TEST_DATA.tagging.preferredTrackingAssetNumbers);
    const dimmedAssetNumber = await taggingPage.findFirstDimmedTrackingDialogAsset();
    if (dimmedAssetNumber) {
      await taggingPage.assertTrackingDialogAssetNotSelectable(dimmedAssetNumber);
    }

    const initialSelectedAssetNumbers = await taggingPage.selectPreferredOrFallbackAssets(
      TEST_DATA.tagging.preferredTrackingAssetNumbers,
      substitutions
    );
    const initialSelectedAssetCount = initialSelectedAssetNumbers.length;
    expect(initialSelectedAssetCount).toBe(TEST_DATA.tagging.preferredTrackingAssetNumbers.length);

    await taggingPage.uploadContainerAttachment(ATTACHMENT_FIXTURE_PATH);
    await taggingPage.saveNewTrackingContainer();

    // ─── Validate the created container's Tracking Number ───────────────────
    await taggingPage.assertContainerVisible(expectedTrackingNumber);
    const createdTrackingNumber = expectedTrackingNumber;

    await taggingPage.openShowDetails(createdTrackingNumber);
    await taggingPage.assertShowDetailsAssetCount(initialSelectedAssetCount);
    for (const fixedAssetNumber of initialSelectedAssetNumbers) {
      await taggingPage.assertShowDetailsContainsAsset(fixedAssetNumber);
    }
    await taggingPage.closeShowDetails();

    // ─── Add Assets: extend the same container ──────────────────────────────
    const additionalSelectedAssetNumbers = await taggingPage.addAssetsFromActions(
      createdTrackingNumber,
      ADDITIONAL_ASSET_COUNT,
      initialSelectedAssetNumbers
    );
    const additionalSelectedAssetCount = additionalSelectedAssetNumbers.length;
    expect(additionalSelectedAssetCount).toBe(ADDITIONAL_ASSET_COUNT);

    const expectedAssetNumbers = [...initialSelectedAssetNumbers, ...additionalSelectedAssetNumbers];
    const expectedAssetCount = initialSelectedAssetCount + additionalSelectedAssetCount;

    await taggingPage.openShowDetails(createdTrackingNumber);
    await taggingPage.assertShowDetailsAssetCount(expectedAssetCount);
    for (const fixedAssetNumber of expectedAssetNumbers) {
      await taggingPage.assertShowDetailsContainsAsset(fixedAssetNumber);
    }
    await taggingPage.closeShowDetails();

    // ─── Submit to Checker ───────────────────────────────────────────────────
    await taggingPage.assertContainerStatus(createdTrackingNumber, 'Created');
    await taggingPage.submitContainerForApproval(createdTrackingNumber);
    await taggingPage.assertContainerStatus(createdTrackingNumber, 'Pending Checker Approval');

    await allure.attachment(
      'tracking-container-summary',
      JSON.stringify(
        {
          previousTrackingNumber,
          expectedTrackingNumber,
          createdTrackingNumber,
          initialSelectedAssetNumbers,
          initialSelectedAssetCount,
          additionalSelectedAssetNumbers,
          additionalSelectedAssetCount,
          expectedAssetNumbers,
          expectedAssetCount,
          substitutions,
        },
        null,
        2
      ),
      'application/json'
    );

    // ─── Logout ───────────────────────────────────────────────────────────
    await shell.logout();
    const loginPage = new LoginPage(page);
    await loginPage.assertIscoreBrandingVisible();

    // ─── CRM: switch this account's role from Maker to Checker ─────────────
    await allure.step('Switch the CRM role to Checker via the corporate-network-only CRM (NTLM)', async () => {
      await roleApplier.ensureRoleApplied('CHECKER');
    });

    // ─── Checker: fresh portal login reflects the new role ──────────────────
    checkerContext = await browser.newContext();
    const checkerPage = await checkerContext.newPage();
    const checkerLoginPage = new LoginPage(checkerPage);
    const checkerShell = new PortalShellPage(checkerPage);
    const checkerTaggingPage = new TaggingPage(checkerPage, testInfo);

    await checkerLoginPage.goto();
    await checkerLoginPage.loginWithConfiguredUser();
    await checkerLoginPage.assertLoginRouteLeft();
    await checkerShell.assertDashboardVisible();

    // ─── Checker: review and complete the container the Maker just submitted ──
    await checkerTaggingPage.openFromHeader();
    await checkerTaggingPage.assertTaggingModuleLoaded();

    await checkerTaggingPage.openShowDetails(createdTrackingNumber);
    await checkerTaggingPage.assertShowDetailsAssetCount(expectedAssetCount);

    const initialReviewCounts = await checkerTaggingPage.readReviewCounts();
    expect(
      initialReviewCounts,
      'Expected every asset in a freshly submitted container to start pending Checker review'
    ).toEqual({ selected: 0, pending: expectedAssetCount });

    await checkerTaggingPage.assertApproveSelectedDisabled();
    await checkerTaggingPage.assertCompleteReviewDisabled();

    await checkerTaggingPage.selectAllAssetsForReview();
    await checkerTaggingPage.assertApproveSelectedEnabled();

    await checkerTaggingPage.approveSelectedAssets();
    const postApprovalCounts = await checkerTaggingPage.readReviewCounts();
    expect(
      postApprovalCounts.pending,
      'Expected approving every ticked asset to leave none pending'
    ).toBe(0);

    await checkerTaggingPage.assertCompleteReviewEnabled();
    await checkerTaggingPage.completeContainerReview();
    await checkerTaggingPage.closeShowDetails();

    // The dialog's own Status tag does not reflect the terminal status until
    // the container list is refreshed (verified live) — reload before reading it.
    await checkerTaggingPage.openByRoute();
    await checkerTaggingPage.assertContainerStatus(createdTrackingNumber, 'Approved - Ready to Print');

    await checkerContext.close();
    checkerContext = undefined;
  });
});
