import { expect, type BrowserContext } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'node:path';
import { TEST_DATA } from '../../config/resources';
import { LoginPage } from '../../pages/portal-pages/LoginPage';
import { PortalShellPage } from '../../pages/portal-pages/PortalShellPage';
import { DisposalPage } from '../../pages/portal-pages/disposal/DisposalPage';
import { test } from '../../fixtures/portalFixtures';

/**
 * Disposal smoke coverage: full Maker -> Admin Checker -> Finance Checker
 * lifecycle, mirroring tests/smoke/tagging-maker-checker-tracking-container.spec.ts
 * for the shared Add/Show-Details mechanics (see DisposalPage, which reuses
 * AddTrackingDialogComponent and TrackingContainerDetailsComponent directly —
 * verified live 2026-08-25 that Disposal's dialogs are byte-identical DOM to
 * Tagging's, plus two Disposal-only fields: Disposal Method and Disposal
 * Reason). Disposal has ONE MORE approval stage than Tagging
 * (Maker -> Admin Checker -> Finance Checker -> ERP).
 *
 * Finance Checker gap (documented, not silently skipped): live discovery
 * found the demo account's Finance Checker CRM role is applied and read back
 * correctly on cis_users, but the PORTAL login itself rejects it with
 * "Your Role Not Accessible This Portal" (see LoginPage.isRoleNotAccessibleErrorVisible
 * and locator PORTAL.LOGIN.ROLE_NOT_ACCESSIBLE_ERROR). This looks like an
 * environment/entitlement gap rather than an automation defect — the Finance
 * Checker stage below probes for it and skips with a clear reason instead of
 * failing or being silently omitted.
 */

const ATTACHMENT_FIXTURE_PATH = path.resolve(process.cwd(), TEST_DATA.tagging.attachmentFixturePath);
const DISPOSAL_METHOD = 'Scrapped';
const DISPOSAL_REASON = 'Automation smoke test — end of life asset disposal';

test.describe('IScore Asset Management - Disposal Maker, Admin Checker & Finance Checker Lifecycle', () => {
  let checkerContext: BrowserContext | undefined;
  let financeContext: BrowserContext | undefined;

  test.beforeEach(async ({ roleApplier }) => {
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test.afterEach(async ({ roleApplier }) => {
    if (checkerContext) {
      await checkerContext.close();
      checkerContext = undefined;
    }
    if (financeContext) {
      await financeContext.close();
      financeContext = undefined;
    }
    await roleApplier.ensureRoleApplied('MAKER', { force: true });
  });

  test('DIS-SM-001 | Maker creates and submits a disposal container; Admin Checker approves and completes; Finance Checker stage is probed', async ({
    authenticatedPortal,
    roleApplier,
    browser,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Disposal Maker to Admin Checker to Finance Checker Lifecycle');
    await allure.severity('blocker');

    const disposalPage = new DisposalPage(authenticatedPortal, testInfo);
    const shell = new PortalShellPage(authenticatedPortal);

    // ─── Maker: create the disposal container ────────────────────────────
    await shell.assertDashboardVisible();
    await disposalPage.openFromHeader();

    await disposalPage.openAddDisposalDialog();
    const fixedAssetNumber = await disposalPage.selectFirstEligibleDialogAsset([]);
    await disposalPage.selectDisposalMethod(DISPOSAL_METHOD);
    await disposalPage.enterDisposalReason(DISPOSAL_REASON);
    await disposalPage.uploadDisposalAttachment(ATTACHMENT_FIXTURE_PATH);
    await disposalPage.assertDialogSaveEnabled();
    await disposalPage.saveNewDisposalContainer();

    const trackingNumber = await disposalPage.findLatestTrackingNumber();
    await allure.attachment('disposal-container', JSON.stringify({ trackingNumber, fixedAssetNumber }, null, 2), 'application/json');

    await disposalPage.assertContainerVisible(trackingNumber);
    await disposalPage.openShowDetails(trackingNumber);
    await disposalPage.assertShowDetailsContainsAsset(fixedAssetNumber);
    expect(await disposalPage.readShowDetailsDisposalMethod()).toBe(DISPOSAL_METHOD);
    await disposalPage.closeShowDetails();

    // ─── Submit to Admin Checker ───────────────────────────────────────────
    await disposalPage.submitContainerForApproval(trackingNumber);
    await disposalPage.assertContainerStatus(trackingNumber, 'Checker Review');

    // ─── Admin Checker: fresh session, approve and complete ────────────────
    await allure.step('Switch the CRM role to Checker via the corporate-network-only CRM (NTLM)', async () => {
      await roleApplier.ensureRoleApplied('CHECKER');
    });

    checkerContext = await browser.newContext();
    const checkerPage = await checkerContext.newPage();
    const checkerLoginPage = new LoginPage(checkerPage);
    await checkerLoginPage.goto();
    await checkerLoginPage.loginWithConfiguredUser();
    await checkerLoginPage.assertLoginRouteLeft();

    const checkerDisposal = new DisposalPage(checkerPage, testInfo);
    await checkerDisposal.openFromHeader();
    await checkerDisposal.assertContainerStatus(trackingNumber, 'Checker Review');

    await checkerDisposal.openShowDetails(trackingNumber);
    const initialReviewCounts = await checkerDisposal.readReviewCounts();
    expect(
      initialReviewCounts,
      'Expected the freshly submitted asset to start pending Admin Checker review'
    ).toEqual({ selected: 0, pending: 1 });

    await checkerDisposal.assertApproveSelectedDisabled();
    await checkerDisposal.assertCompleteReviewDisabled();

    await checkerDisposal.selectAssetForReview(fixedAssetNumber);
    await checkerDisposal.assertApproveSelectedEnabled();
    await checkerDisposal.approveSelectedAssets();

    const postApprovalCounts = await checkerDisposal.readReviewCounts();
    expect(postApprovalCounts.pending, 'Expected approving the ticked asset to leave none pending').toBe(0);

    await checkerDisposal.assertCompleteReviewEnabled();
    await checkerDisposal.completeContainerReview();
    await checkerDisposal.closeShowDetails();

    await checkerDisposal.openFromHeader();
    await checkerDisposal.assertContainerStatus(trackingNumber, 'Pending Finance Approval');

    // ─── Finance Checker: probe for portal access, skip gracefully if blocked ──
    await allure.step('Switch the CRM role to Finance Checker via the corporate-network-only CRM (NTLM)', async () => {
      await roleApplier.ensureRoleApplied('FINANCE_CHECKER', { force: true });
    });

    financeContext = await browser.newContext();
    const financePage = await financeContext.newPage();
    const financeLoginPage = new LoginPage(financePage);
    await financeLoginPage.goto();
    await financeLoginPage.loginWithConfiguredUser();

    const roleBlocked = await financeLoginPage.isRoleNotAccessibleErrorVisible();
    testInfo.skip(
      roleBlocked,
      'Environment gap (not an automation defect): the Finance Checker CRM role is applied and reads back ' +
        'correctly on cis_users, but this portal rejects that role at login with ' +
        '"Your Role Not Accessible This Portal" — see LoginPage.isRoleNotAccessibleErrorVisible. ' +
        'Finance Checker regression coverage is blocked until this environment/entitlement gap is resolved.'
    );

    await financeLoginPage.assertLoginRouteLeft();
    const financeDisposal = new DisposalPage(financePage, testInfo);
    await financeDisposal.openFromHeader();
    await financeDisposal.assertContainerStatus(trackingNumber, 'Pending Finance Approval');

    await financeDisposal.openShowDetails(trackingNumber);
    const financeReviewCounts = await financeDisposal.readReviewCounts();
    expect(
      financeReviewCounts,
      'Expected the Admin-approved asset to start pending Finance Checker review'
    ).toEqual({ selected: 0, pending: 1 });

    await financeDisposal.selectAssetForReview(fixedAssetNumber);
    await financeDisposal.approveSelectedAssets();
    await financeDisposal.completeContainerReview();
    await financeDisposal.closeShowDetails();
  });
});
