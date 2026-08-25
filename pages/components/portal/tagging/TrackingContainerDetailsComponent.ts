import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

/**
 * Show Details dialog for a tracking container: the "Show Assets (N)" tab
 * (open by default), its asset rows, and the close (X) control.
 *
 * Checker review controls (new release, verified live 2026-08-24): each
 * asset row has its own checkbox; ticking one or more enables the bulk
 * "Approve Selected" / "Reject Selected" actions, and "Complete" (also
 * bulk-gated) finalizes the container once every asset has a decision. The
 * `.review-hint` text reports live "N selected · M pending" counts — read it
 * rather than assuming a fixed asset count.
 */
export class TrackingContainerDetailsComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {
    void this.page;
  }

  // ─── Actions ─────────────────────────────────────────────

  async close(): Promise<void> {
    await allure.step('Close the Show Details dialog', async () => {
      await this.closeButton().click();
      await expect(this.root()).toBeHidden();
    });
  }

  async selectAsset(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Tick asset "${fixedAssetNumber}" for Checker review`, async () => {
      await this.rowCheckbox(this.assetRowByFixedAssetNumber(fixedAssetNumber)).click();
    });
  }

  async deselectAsset(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Untick asset "${fixedAssetNumber}" for Checker review`, async () => {
      await this.rowCheckbox(this.assetRowByFixedAssetNumber(fixedAssetNumber)).click();
    });
  }

  async selectAllAssets(): Promise<void> {
    await allure.step('Tick every asset via the header checkbox', async () => {
      await this.selectAllCheckbox().click();
    });
  }

  /**
   * Approve Selected / Reject Selected / Complete all open a second modal
   * titled "Confirmation" ("Approve/Reject the selected assets?" with
   * Reject/Accept buttons) — the action only applies once that modal's
   * Accept is clicked. Verified live: without accepting it, the review hint
   * ("N selected · M pending") never changes, even after a long wait
   * (TC-TAG-ASSET-040 first failed exactly this way). After accepting, wait
   * for the hint/status to actually change before returning, since that
   * update is itself an async round-trip.
   */
  async approveSelected(): Promise<void> {
    await allure.step('Approve the ticked assets', async () => {
      const before = await this.readReviewHint();
      await this.approveSelectedButton().click();
      await this.acceptReviewConfirmation();
      await expect(this.reviewHint()).not.toHaveText(before, { timeout: 20_000 });
    });
  }

  /**
   * Reject opens a DIFFERENT modal than Approve/Complete (verified live
   * 2026-08-25 on Disposal): a "Reject Selected" dialog with a required
   * Notes textarea and a Save button — not the generic "Confirmation"/Accept
   * dialog `acceptReviewConfirmation()` handles. `reason` defaults to a
   * generic automation note since the field is mandatory.
   */
  async rejectSelected(reason = 'Rejected via automation'): Promise<void> {
    await allure.step('Reject the ticked assets', async () => {
      const before = await this.readReviewHint();
      await this.rejectSelectedButton().click();
      await expect(this.rejectNotesTextarea()).toBeVisible({ timeout: 10_000 });
      await this.rejectNotesTextarea().fill(reason);
      await this.rejectNotesSaveButton().click();
      await expect(this.rejectNotesDialogRoot()).not.toBeAttached({ timeout: 20_000 });
      await expect(this.reviewHint()).not.toHaveText(before, { timeout: 20_000 });
    });
  }

  /**
   * Clicks Complete, accepts its confirmation modal, then waits out the
   * blocking loader that follows (Complete triggers label printing; verified
   * live it can stay up well past 20s, longer on an environment with no
   * printer configured). The dialog's own Status tag does not reflect the
   * terminal status until the loader clears AND the page/dialog is
   * refreshed — callers that need the final status must reopen Show Details
   * (or reload) afterward rather than trust this dialog's tag in place.
   */
  async complete(): Promise<void> {
    await allure.step('Complete the container review', async () => {
      await this.completeButton().click();
      await this.acceptReviewConfirmation();
      // Two independent elements appear together (verified live) — a combined
      // comma-selector locator violates Playwright's strict mode on toBeHidden,
      // so each is awaited separately.
      await expect(this.completeBlockUiOverlay()).toBeHidden({ timeout: 90_000 });
      await expect(this.completeLoaderImage()).toBeHidden({ timeout: 90_000 });
    });
  }

  /**
   * Waits for the WHOLE confirmation dialog (not just its Accept button) to
   * fully detach after accepting. Verified live: performing a SECOND review
   * action (e.g. Reject right after Approve) in the same Show Details session
   * reproducibly fails to find the second confirmation dialog's Accept button
   * — waiting on just the button's own `toBeHidden`/`not.toBeAttached` was not
   * enough to prevent it, so this now also waits for the dialog ROOT
   * (`TAGGING.DETAILS.REVIEW_CONFIRM_DIALOG.ROOT`, matched by its
   * "Confirmation" title text) to detach before returning — PrimeNG's
   * confirm-dialog service appears to need the previous instance's mask/
   * overlay fully torn down before it will render a new one. Tagging's own
   * tests never exercise two sequential actions in one session, so this
   * never surfaced there.
   */
  private async acceptReviewConfirmation(): Promise<void> {
    await allure.step('Accept the review action confirmation dialog', async () => {
      await expect(this.reviewConfirmAcceptButton()).toBeVisible({ timeout: 10_000 });
      await this.reviewConfirmAcceptButton().click();
      await expect(this.reviewConfirmDialogRoot()).not.toBeAttached({ timeout: 20_000 });
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertOpen(): Promise<void> {
    await allure.step('Assert the Show Details dialog is open', async () => {
      await expect(this.root()).toBeVisible();
    });
  }

  async assertAssetCount(expectedCount: number): Promise<void> {
    await allure.step(`Assert the Show Details asset count is ${expectedCount}`, async () => {
      await expect(this.tabLabel()).toHaveText(`Show Assets (${expectedCount})`);
      await expect(this.assetRows()).toHaveCount(expectedCount);
    });
  }

  async assertContainsFixedAssetNumber(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Assert Show Details lists Fixed Asset Number "${fixedAssetNumber}"`, async () => {
      await expect(this.assetRows().filter({ hasText: fixedAssetNumber })).toHaveCount(1);
    });
  }

  async assertApproveSelectedDisabled(): Promise<void> {
    await expect(this.approveSelectedButton()).toBeDisabled();
  }

  async assertApproveSelectedEnabled(): Promise<void> {
    await expect(this.approveSelectedButton()).toBeEnabled();
  }

  async assertRejectSelectedDisabled(): Promise<void> {
    await expect(this.rejectSelectedButton()).toBeDisabled();
  }

  async assertRejectSelectedEnabled(): Promise<void> {
    await expect(this.rejectSelectedButton()).toBeEnabled();
  }

  async assertCompleteDisabled(): Promise<void> {
    await expect(this.completeButton()).toBeDisabled();
  }

  async assertCompleteEnabled(): Promise<void> {
    await expect(this.completeButton()).toBeEnabled();
  }

  // ─── Getters (values) ────────────────────────────────────

  async readStatusTag(): Promise<string> {
    return (await this.statusTag().innerText()).trim();
  }

  async readFixedAssetNumbers(): Promise<string[]> {
    const rows = this.assetRows();
    const rowCount = await rows.count();
    const fixedAssetNumbers: string[] = [];

    for (let index = 0; index < rowCount; index += 1) {
      const value = await rows.nth(index).locator('td').first().innerText();
      fixedAssetNumbers.push(value.trim());
    }

    return fixedAssetNumbers;
  }

  /**
   * `statusCellElementId` defaults to Tagging's own status column
   * (`TAGGING.DETAILS.ASSET_STATUS_CELL`, `td:last-child`). Disposal's table
   * has one extra trailing "Reason" column after Status (verified live
   * 2026-08-25), so `td:last-child` reads Reason instead there — Disposal
   * callers must pass `DISPOSAL.DETAILS.ASSET_STATUS_CELL` explicitly.
   */
  async readAssetStatus(
    fixedAssetNumber: string,
    statusCellElementId = 'TAGGING.DETAILS.ASSET_STATUS_CELL'
  ): Promise<string> {
    const row = this.assetRowByFixedAssetNumber(fixedAssetNumber);
    return (await this.repository.locator(statusCellElementId, { scope: row }).innerText()).trim();
  }

  /** Reads the live "N selected · M pending" review hint text verbatim. */
  async readReviewHint(): Promise<string> {
    return (await this.reviewHint().innerText()).trim();
  }

  /**
   * False when the asset's row checkbox is disabled — used to prove an
   * already-decided asset (e.g. rejected by Admin Checker) is read-only to a
   * later review stage rather than actionable again.
   */
  async isAssetSelectableForReview(fixedAssetNumber: string): Promise<boolean> {
    const row = this.assetRowByFixedAssetNumber(fixedAssetNumber);
    const disabled = await this.rowCheckbox(row).getAttribute('data-p-disabled');
    return disabled !== 'true';
  }

  /** Parses the selected/pending counts out of the review hint (undefined fields when not present, e.g. no hint at all). */
  async readReviewCounts(): Promise<{ selected: number; pending: number }> {
    const text = await this.readReviewHint();
    const selectedMatch = text.match(/(\d+)\s*selected/i);
    const pendingMatch = text.match(/(\d+)\s*pending/i);
    return {
      selected: selectedMatch ? Number(selectedMatch[1]) : 0,
      pending: pendingMatch ? Number(pendingMatch[1]) : 0,
    };
  }

  // ─── Helpers (private) ──────────────────────────────────

  private root(): Locator {
    return this.repository.locator('TAGGING.DETAILS.ROOT');
  }

  private tabLabel(): Locator {
    return this.repository.locator('TAGGING.DETAILS.TAB_LABEL', { scope: this.root() });
  }

  private statusTag(): Locator {
    return this.repository.locator('TAGGING.DETAILS.STATUS_TAG', { scope: this.root() });
  }

  private assetRows(): Locator {
    return this.repository.locator('TAGGING.DETAILS.ASSET_ROW', { scope: this.root() });
  }

  private assetRowByFixedAssetNumber(fixedAssetNumber: string): Locator {
    return this.assetRows().filter({ hasText: fixedAssetNumber });
  }

  private rowCheckbox(row: Locator): Locator {
    return this.repository.locator('TAGGING.DETAILS.ASSET_ROW_CHECKBOX', { scope: row });
  }

  private selectAllCheckbox(): Locator {
    return this.repository.locator('TAGGING.DETAILS.SELECT_ALL_CHECKBOX', { scope: this.root() });
  }

  private reviewHint(): Locator {
    return this.repository.locator('TAGGING.DETAILS.REVIEW_HINT', { scope: this.root() });
  }

  private approveSelectedButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.APPROVE_SELECTED_BUTTON', { scope: this.root() });
  }

  private rejectSelectedButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.REJECT_SELECTED_BUTTON', { scope: this.root() });
  }

  /** Matched globally by role+text, not scoped to a dialog root — this modal is not exposed with role=dialog (verified live). */
  private reviewConfirmAcceptButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.REVIEW_CONFIRM_DIALOG.ACCEPT_BUTTON');
  }

  private reviewConfirmDialogRoot(): Locator {
    return this.repository.locator('TAGGING.DETAILS.REVIEW_CONFIRM_DIALOG.ROOT');
  }

  private rejectNotesDialogRoot(): Locator {
    return this.repository.locator('TAGGING.DETAILS.REJECT_NOTES_DIALOG.ROOT');
  }

  private rejectNotesTextarea(): Locator {
    return this.repository.locator('TAGGING.DETAILS.REJECT_NOTES_DIALOG.NOTES_TEXTAREA', {
      scope: this.rejectNotesDialogRoot(),
    });
  }

  private rejectNotesSaveButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.REJECT_NOTES_DIALOG.SAVE_BUTTON', {
      scope: this.rejectNotesDialogRoot(),
    });
  }

  private completeButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.COMPLETE_BUTTON', { scope: this.root() });
  }

  private completeBlockUiOverlay(): Locator {
    return this.repository.locator('TAGGING.DETAILS.COMPLETE_BLOCKUI_OVERLAY');
  }

  private completeLoaderImage(): Locator {
    return this.repository.locator('TAGGING.DETAILS.COMPLETE_LOADER_IMAGE');
  }

  private closeButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.CLOSE_BUTTON', { scope: this.root() });
  }
}
