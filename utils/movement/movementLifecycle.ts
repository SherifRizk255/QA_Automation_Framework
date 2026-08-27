import type { Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import path from 'node:path';
import { TEST_DATA } from '../../config/resources';
import { AssetProfilePage } from '../../pages/portal-pages/asset-profile/AssetProfilePage';
import { LoginPage } from '../../pages/portal-pages/LoginPage';
import { MovementPage } from '../../pages/portal-pages/movement/MovementPage';
import type { RoleApplier } from '../roles/RoleApplier';

/**
 * Reusable Movement lifecycle actions shared by the TC-MOV-* regression suite
 * (`docs/test-design/test-lifecycle.md` §3 of the Movement automation notes).
 *
 * Every action is idempotent by construction: assets are discovered live and
 * memo/reason values are generated fresh per run, because Movement mutates the
 * very asset state (Current Location, Responsible) the assertions read. A fixed
 * seed asset would be in a different state on run 2 than run 1 and would make
 * "target location differs from current" silently pass or fail for the wrong
 * reason — see the automation notes §3.4.
 */

export const ATTACHMENT_FIXTURE_PATH = path.resolve(process.cwd(), TEST_DATA.movement.attachmentFixturePath);

/** Fresh, collision-proof text for a run — never a fixed literal. */
export function generateRunValue(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export type CreatedMovement = {
  containerId: string;
  assetNumbers: string[];
  targetLocation: string;
  locationMemo: string;
  reason: string;
};

/**
 * Maker TC_SETUP: open Movement, open New Movement, create a container with
 * `assetCount` dynamically discovered eligible assets, and capture the runtime
 * AMC- id every downstream Checker / Asset Profile step keys off.
 */
export async function createMovementContainerAsMaker(
  movementPage: MovementPage,
  assetCount = TEST_DATA.movement.multiAssetCount
): Promise<CreatedMovement> {
  const locationMemo = generateRunValue('QA memo');
  const reason = generateRunValue('QA reason');

  // Captured BEFORE the dialog opens: the open dialog covers the container list,
  // so the new AMC- id can only be identified by diffing against this snapshot.
  const previousContainerIds = await movementPage.readAllContainerIds();

  await movementPage.openNewMovementDialog();
  const created = await movementPage.createSelectedAssetsMovement({
    assetCount,
    locationMemo,
    reason,
    attachmentPath: ATTACHMENT_FIXTURE_PATH,
    previousContainerIds,
  });

  return { ...created, locationMemo, reason };
}

/**
 * Maker TC_SETUP for Checker-dependent cases: create then submit, leaving the
 * container in "Pending Checker Approval". Verifying the status before
 * submitting keeps a retry from double-submitting (lifecycle Rule: state
 * transitions are not retryable).
 */
export async function createAndSubmitMovementContainerAsMaker(
  movementPage: MovementPage,
  assetCount = TEST_DATA.movement.multiAssetCount
): Promise<CreatedMovement> {
  const created = await createMovementContainerAsMaker(movementPage, assetCount);

  if ((await movementPage.readContainerStatus(created.containerId)) === 'Created') {
    await movementPage.submitContainer(created.containerId);
  }
  await movementPage.assertContainerStatus(created.containerId, 'Pending Checker Approval');

  return created;
}

/**
 * TC_TEARDOWN: delete a Maker-created container while it is still in Created
 * status. Submitted/Completed containers are audit records with no delete
 * action (verified live) — those are intentionally left in place, which is safe
 * because every run discovers fresh assets and captures fresh ids.
 */
export async function cleanUpMovementContainer(
  page: Page,
  containerId: string | undefined,
  testInfo?: TestInfo
): Promise<void> {
  if (!containerId) {
    return;
  }
  await new MovementPage(page, testInfo).deleteContainerIfCreated(containerId);
}

export type CheckerSession = {
  context: BrowserContext;
  page: Page;
  movementPage: MovementPage;
  assetProfilePage: AssetProfilePage;
};

/**
 * Switches the shared demo account to CHECKER on CRM and opens a FRESH portal
 * context already logged in as that role, on the Movement module.
 *
 * Uses the same proven role-switch flow Tagging and Disposal use (apply role ->
 * new context -> form login) rather than `RoleSwitchOrchestrator.signInAs()`:
 * that orchestrator asserts the active role by reading
 * `PORTAL.SHELL.ACTIVE_ROLE_LABEL`, which is still an UNVERIFIED, LOW-confidence
 * repository entry this portal build never renders, so every call fails before
 * reaching the module. Skill 19's absolute rule still holds — no two roles ever
 * share a portal context, and the fresh context IS the session clear.
 *
 * The caller owns the returned context and must close it in teardown.
 */
export async function openMovementAsChecker(
  browser: Browser,
  roleApplier: RoleApplier,
  testInfo?: TestInfo
): Promise<CheckerSession> {
  return allure.step('Switch the demo account to Checker and open a fresh portal session', async () => {
    await roleApplier.ensureRoleApplied('CHECKER');

    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithConfiguredUser();
    await loginPage.assertLoginRouteLeft();

    const movementPage = new MovementPage(page, testInfo);
    await movementPage.openFromHeader();

    return { context, page, movementPage, assetProfilePage: new AssetProfilePage(page, testInfo) };
  });
}

/** Attaches the runtime ids to the Allure report so a failure is traceable to real data. */
export async function attachMovementContext(name: string, value: unknown): Promise<void> {
  await allure.attachment(name, JSON.stringify(value, null, 2), 'application/json');
}
