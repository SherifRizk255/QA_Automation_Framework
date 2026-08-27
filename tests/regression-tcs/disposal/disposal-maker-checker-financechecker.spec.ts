import { expect, type BrowserContext } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'node:path';
import { TEST_DATA } from '../../../config/resources';
import { LoginPage } from '../../../pages/portal-pages/LoginPage';
import { DisposalPage } from '../../../pages/portal-pages/disposal/DisposalPage';
import { PortalShellPage } from '../../../pages/portal-pages/PortalShellPage';
import { test } from '../../../fixtures/portalFixtures';

/**
 * Disposal regression: mixed Admin Checker decisions on a multi-asset
 * container, and the Finance Checker visibility rule for Admin-rejected
 * assets.
 *
 * Business rule under test (per explicit product spec): a reviewer (Admin
 * Checker or Finance Checker) cannot Complete a container while ANY asset in
 * it is still pending a decision — every asset must be individually Approved
 * or Rejected first. Approving some and rejecting others is allowed; only
 * the approved assets carry forward to the next stage (Finance Checker sees
 * only Admin-approved assets as actionable — Admin-rejected assets remain
 * visible for audit but are read-only).
 *
 * Finance Checker gap: same as tests/smoke/disposal-maker-checker-financechecker.spec.ts
 * — the demo account's Finance Checker CRM role is applied correctly but the
 * portal rejects it at login ("Your Role Not Accessible This Portal").
 * DIS-REG-002 probes for this and skips with a clear reason if still blocked,
 * so this coverage runs for real the moment the environment gap is fixed.
 */

const ATTACHMENT_FIXTURE_PATH = path.resolve(process.cwd(), TEST_DATA.tagging.attachmentFixturePath);
const DISPOSAL_METHOD = 'Scrapped';
const DISPOSAL_REASON = 'Automation regression — mixed approve/reject coverage';
const ASSET_COUNT = 2;

test.describe('IScore Asset Management - Disposal Mixed Approve/Reject Regression', () => {
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

  test('DIS-REG-001 | Admin Checker cannot Complete until every asset is decided; approving one and rejecting another is allowed', async ({
    authenticatedPortal,
    roleApplier,
    browser,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Disposal Admin Checker Mixed Decisions');
    await allure.severity('critical');

    const shell = new PortalShellPage(authenticatedPortal);
    await shell.assertDashboardVisible();
    const disposalPage = new DisposalPage(authenticatedPortal, testInfo);
    await disposalPage.openFromHeader();

    // ─── Maker: create a 2-asset disposal container ───────────────────────
    await disposalPage.openAddDisposalDialog();
    const [assetA, assetB] = await disposalPage.selectEligibleDialogAssets(ASSET_COUNT, []);
    await disposalPage.selectDisposalMethod(DISPOSAL_METHOD);
    await disposalPage.enterDisposalReason(DISPOSAL_REASON);
    await disposalPage.uploadDisposalAttachment(ATTACHMENT_FIXTURE_PATH);
    await disposalPage.saveNewDisposalContainer();

    const trackingNumber = await disposalPage.findLatestTrackingNumber();
    await allure.attachment('disposal-container', JSON.stringify({ trackingNumber, assetA, assetB }, null, 2), 'application/json');

    await disposalPage.assertContainerVisible(trackingNumber);
    await disposalPage.submitContainerForApproval(trackingNumber);
    await disposalPage.assertContainerStatus(trackingNumber, 'Checker Review');

    // ─── Admin Checker: mixed decisions, gated Complete ─────────────────────
    await roleApplier.ensureRoleApplied('CHECKER');
    checkerContext = await browser.newContext();
    const checkerPage = await checkerContext.newPage();
    const checkerLoginPage = new LoginPage(checkerPage);
    await checkerLoginPage.goto();
    await checkerLoginPage.loginWithConfiguredUser();
    await checkerLoginPage.assertLoginRouteLeft();

    const checkerDisposal = new DisposalPage(checkerPage, testInfo);
    await checkerDisposal.openFromHeader();
    await checkerDisposal.openShowDetails(trackingNumber);

    expect(
      await checkerDisposal.readReviewCounts(),
      'Both freshly submitted assets should start pending'
    ).toEqual({ selected: 0, pending: ASSET_COUNT });
    await checkerDisposal.assertCompleteReviewDisabled();

    const statusBeforeA = await checkerDisposal.readShowDetailsAssetStatus(assetA);
    const statusBeforeB = await checkerDisposal.readShowDetailsAssetStatus(assetB);

    // Approve asset A only — one asset (B) is still undecided, so Complete must stay disabled.
    await checkerDisposal.selectAssetForReview(assetA);
    await checkerDisposal.assertApproveSelectedEnabled();
    await checkerDisposal.approveSelectedAssets();

    expect(
      (await checkerDisposal.readReviewCounts()).pending,
      'One asset (B) is still undecided after approving only A'
    ).toBe(1);
    await checkerDisposal.assertCompleteReviewDisabled();
    expect(
      await checkerDisposal.readShowDetailsAssetStatus(assetA),
      'Approving asset A should change its status from the pre-decision value'
    ).not.toBe(statusBeforeA);

    // Reject asset B — every asset now has a decision, so Complete must become enabled.
    await checkerDisposal.selectAssetForReview(assetB);
    await checkerDisposal.assertRejectSelectedEnabled();
    await checkerDisposal.rejectSelectedAssets();

    expect(
      (await checkerDisposal.readReviewCounts()).pending,
      'Every asset has a decision now (A approved, B rejected)'
    ).toBe(0);
    await checkerDisposal.assertCompleteReviewEnabled();
    expect(
      await checkerDisposal.readShowDetailsAssetStatus(assetB),
      'Rejecting asset B should change its status from the pre-decision value'
    ).not.toBe(statusBeforeB);
    expect(
      await checkerDisposal.readShowDetailsAssetStatus(assetB),
      'Asset A (approved) and asset B (rejected) should end up with different statuses'
    ).not.toBe(await checkerDisposal.readShowDetailsAssetStatus(assetA));

    await checkerDisposal.completeContainerReview();
    await checkerDisposal.closeShowDetails();

    await checkerDisposal.openFromHeader();
    const statusAfterComplete = await checkerDisposal.readContainerStatus(trackingNumber);
    expect(
      statusAfterComplete,
      'Completing the mixed-decision review should move the container out of Checker Review'
    ).not.toBe('Checker Review');
    await allure.attachment('status-after-complete', statusAfterComplete, 'text/plain');
  });

  test('DIS-REG-002 | Finance Checker sees only the Admin-approved asset as actionable; the Admin-rejected asset stays read-only', async ({
    authenticatedPortal,
    roleApplier,
    browser,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    await allure.feature('IScore Asset Management');
    await allure.story('Disposal Finance Checker Visibility');
    await allure.severity('critical');

    const shell = new PortalShellPage(authenticatedPortal);
    await shell.assertDashboardVisible();
    const disposalPage = new DisposalPage(authenticatedPortal, testInfo);
    await disposalPage.openFromHeader();

    // ─── Maker: create a 2-asset disposal container ───────────────────────
    await disposalPage.openAddDisposalDialog();
    const [assetA, assetB] = await disposalPage.selectEligibleDialogAssets(ASSET_COUNT, []);
    await disposalPage.selectDisposalMethod(DISPOSAL_METHOD);
    await disposalPage.enterDisposalReason(DISPOSAL_REASON);
    await disposalPage.uploadDisposalAttachment(ATTACHMENT_FIXTURE_PATH);
    await disposalPage.saveNewDisposalContainer();

    const trackingNumber = await disposalPage.findLatestTrackingNumber();
    await disposalPage.assertContainerVisible(trackingNumber);
    await disposalPage.submitContainerForApproval(trackingNumber);

    // ─── Admin Checker: approve A, reject B, complete ──────────────────────
    await roleApplier.ensureRoleApplied('CHECKER');
    checkerContext = await browser.newContext();
    const checkerPage = await checkerContext.newPage();
    const checkerLoginPage = new LoginPage(checkerPage);
    await checkerLoginPage.goto();
    await checkerLoginPage.loginWithConfiguredUser();
    await checkerLoginPage.assertLoginRouteLeft();

    const checkerDisposal = new DisposalPage(checkerPage, testInfo);
    await checkerDisposal.openFromHeader();
    await checkerDisposal.openShowDetails(trackingNumber);
    await checkerDisposal.selectAssetForReview(assetA);
    await checkerDisposal.approveSelectedAssets();
    await checkerDisposal.selectAssetForReview(assetB);
    await checkerDisposal.rejectSelectedAssets();
    await checkerDisposal.completeContainerReview();
    await checkerDisposal.closeShowDetails();

    // ─── Finance Checker: probe for portal access, skip gracefully if blocked ──
    await roleApplier.ensureRoleApplied('FINANCE_CHECKER', { force: true });
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
        '"Your Role Not Accessible This Portal". Finance Checker visibility coverage is blocked until this ' +
        'environment/entitlement gap is resolved.'
    );

    await financeLoginPage.assertLoginRouteLeft();
    const financeDisposal = new DisposalPage(financePage, testInfo);
    await financeDisposal.openFromHeader();
    await financeDisposal.openShowDetails(trackingNumber);

    expect(
      await financeDisposal.isAssetSelectableForReview(assetA),
      'The Admin-approved asset should be actionable for Finance Checker'
    ).toBe(true);
    expect(
      await financeDisposal.isAssetSelectableForReview(assetB),
      'The Admin-rejected asset should be read-only for Finance Checker, not actionable again'
    ).toBe(false);

    expect(
      (await financeDisposal.readReviewCounts()).pending,
      'Only the Admin-approved asset should count as pending Finance review'
    ).toBe(1);

    await financeDisposal.assertCompleteReviewDisabled();
    await financeDisposal.selectAssetForReview(assetA);
    await financeDisposal.approveSelectedAssets();
    await financeDisposal.assertCompleteReviewEnabled();
    await financeDisposal.completeContainerReview();
    await financeDisposal.closeShowDetails();
  });
});
