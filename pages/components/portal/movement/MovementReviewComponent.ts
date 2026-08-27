import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

export type ReviewCounts = { selected: number; pending: number };

/**
 * Checker "Review & Approve" dialog for a movement container (opened from the
 * Pending-container Actions menu).
 *
 * Verified live 2026-08-27 (AMC-00001014): identical `.review-bar` markup to
 * Tagging/Disposal's Show Details review controls — a `.review-hint` reporting
 * "N selected · M pending", bulk "Approve Selected" / "Reject Selected" /
 * "Complete" buttons (all disabled until valid; Complete gated on 0 pending),
 * and a per-asset Status column that reads "Initiated by Maker" ->
 * "Checker Approved" / "Checker Rejected".
 *
 * Gotchas confirmed live:
 * - Every Approve/Reject/Complete opens the shared `.p-confirm-dialog`
 *   ("Confirmation", Accept/Reject) — the action only applies once Accept is
 *   clicked.
 * - Approve and Complete each flash a `p-blockui` overlay while the async
 *   round-trip runs — wait it out before reading state.
 * - The dialog can close itself after Approve; callers re-open via the Actions
 *   menu rather than assuming it stays open (see `isOpen()`).
 */
export class MovementReviewComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  // ─── State ───────────────────────────────────────────────

  async isOpen(): Promise<boolean> {
    return this.root().isVisible().catch(() => false);
  }

  async assertOpen(): Promise<void> {
    await allure.step('Assert the Review & Approve dialog is open', async () => {
      await expect(this.root()).toBeVisible({ timeout: 20_000 });
      await expect(this.root().locator('tbody tr').first()).toBeVisible({ timeout: 15_000 });
    });
  }

  async readReviewCounts(): Promise<ReviewCounts> {
    const text = (await this.reviewHint().innerText()).replace(/\s+/g, ' ').trim();
    const selected = Number(text.match(/(\d+)\s*selected/i)?.[1] ?? '0');
    const pending = Number(text.match(/(\d+)\s*pending/i)?.[1] ?? '0');
    return { selected, pending };
  }

  async readAssetStatus(fixedAssetNumber: string): Promise<string> {
    return (await this.assetRow(fixedAssetNumber).locator('td').last().innerText()).trim();
  }

  async readFixedAssetNumbers(): Promise<string[]> {
    const rows = this.root().locator('tbody tr');
    const count = await rows.count();
    const out: string[] = [];
    for (let i = 0; i < count; i += 1) {
      out.push((await rows.nth(i).locator('td').nth(1).innerText()).trim());
    }
    return out.filter(Boolean);
  }

  async isAssetSelectableForReview(fixedAssetNumber: string): Promise<boolean> {
    const box = this.assetRow(fixedAssetNumber).locator('td .p-checkbox-box').first();
    return (await box.getAttribute('class'))?.includes('p-disabled') ? false : true;
  }

  // ─── Selection ───────────────────────────────────────────

  async selectAllAssets(): Promise<void> {
    await allure.step('Tick every asset via the review header checkbox', async () => {
      await this.selectAllCheckbox().click();
    });
  }

  async selectAsset(fixedAssetNumber: string): Promise<void> {
    await allure.step(`Tick asset "${fixedAssetNumber}" for review`, async () => {
      await this.assetRow(fixedAssetNumber).locator('td .p-checkbox-box').first().click();
    });
  }

  async deselectAsset(fixedAssetNumber: string): Promise<void> {
    await this.selectAsset(fixedAssetNumber);
  }

  // ─── Decisions ───────────────────────────────────────────

  async approveSelected(): Promise<void> {
    await allure.step('Approve the ticked assets', async () => {
      await this.approveSelectedButton().click();
      await this.acceptConfirmation();
      await this.waitForAsyncOverlay();
    });
  }

  /**
   * Reject discovered live to use the shared `.p-confirm-dialog` ("Reject the
   * selected assets?"). If a build instead shows the Tagging-style "Reject
   * Selected" notes dialog, fall back to filling + saving it.
   */
  async rejectSelected(reason = 'Rejected via automation'): Promise<void> {
    await allure.step('Reject the ticked assets', async () => {
      await this.rejectSelectedButton().click();

      const confirm = this.confirmDialog();
      const notesTextarea = this.repository.locator('TAGGING.DETAILS.REJECT_NOTES_DIALOG.NOTES_TEXTAREA');

      await expect(confirm.or(notesTextarea).first()).toBeVisible({ timeout: 10_000 });

      if ((await notesTextarea.count()) > 0 && (await notesTextarea.first().isVisible())) {
        await notesTextarea.first().fill(reason);
        await this.repository.locator('TAGGING.DETAILS.REJECT_NOTES_DIALOG.SAVE_BUTTON').click();
      } else {
        await this.confirmAcceptButton().click();
      }
      await this.waitForConfirmationGone();
      await this.waitForAsyncOverlay();
    });
  }

  async complete(): Promise<void> {
    await allure.step('Complete the container review', async () => {
      await this.completeButton().click();
      await this.acceptConfirmation();
      await this.waitForAsyncOverlay();
    });
  }

  async close(): Promise<void> {
    if (await this.isOpen()) {
      await this.closeButton().click();
      await expect(this.root()).toBeHidden({ timeout: 15_000 });
    }
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertApproveSelectedDisabled(): Promise<void> {
    await expect(this.approveSelectedButton()).toBeDisabled();
  }

  async assertApproveSelectedEnabled(): Promise<void> {
    await expect(this.approveSelectedButton()).toBeEnabled();
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

  // ─── Helpers (private) ──────────────────────────────────

  private async acceptConfirmation(): Promise<void> {
    await expect(this.confirmAcceptButton()).toBeVisible({ timeout: 10_000 });
    await this.confirmAcceptButton().click();
    await this.waitForConfirmationGone();
  }

  private async waitForConfirmationGone(): Promise<void> {
    await expect(this.confirmDialog()).not.toBeAttached({ timeout: 20_000 });
  }

  /**
   * Approve/Complete flash a document-level p-blockui overlay while the async
   * round-trip runs; wait for it to clear (Complete can stay up a long time on
   * this environment, hence the generous budget).
   */
  private async waitForAsyncOverlay(): Promise<void> {
    const overlay = this.repository.locator('TAGGING.DETAILS.COMPLETE_BLOCKUI_OVERLAY');
    await expect(overlay).toBeHidden({ timeout: 90_000 });
  }

  private root(): Locator {
    return this.repository.locator('MOVEMENT.REVIEW_DIALOG.ROOT');
  }

  private reviewHint(): Locator {
    return this.repository.locator('MOVEMENT.REVIEW_DIALOG.REVIEW_HINT', { scope: this.root() });
  }

  private assetRow(fixedAssetNumber: string): Locator {
    return this.root().locator('tbody tr').filter({ hasText: fixedAssetNumber });
  }

  private selectAllCheckbox(): Locator {
    return this.repository.locator('MOVEMENT.REVIEW_DIALOG.SELECT_ALL_CHECKBOX', { scope: this.root() });
  }

  private approveSelectedButton(): Locator {
    return this.repository.locator('MOVEMENT.REVIEW_DIALOG.APPROVE_SELECTED_BUTTON', { scope: this.root() });
  }

  private rejectSelectedButton(): Locator {
    return this.repository.locator('MOVEMENT.REVIEW_DIALOG.REJECT_SELECTED_BUTTON', { scope: this.root() });
  }

  private completeButton(): Locator {
    return this.repository.locator('MOVEMENT.REVIEW_DIALOG.COMPLETE_BUTTON', { scope: this.root() });
  }

  private closeButton(): Locator {
    return this.repository.locator('TAGGING.DETAILS.CLOSE_BUTTON', { scope: this.root() });
  }

  private confirmDialog(): Locator {
    return this.repository.locator('MOVEMENT.CONFIRM_DIALOG.ROOT');
  }

  private confirmAcceptButton(): Locator {
    return this.repository.locator('MOVEMENT.CONFIRM_DIALOG.ACCEPT_BUTTON');
  }
}
