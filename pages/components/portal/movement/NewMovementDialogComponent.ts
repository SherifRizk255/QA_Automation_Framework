import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';
import { AddTrackingDialogComponent } from '../tagging/AddTrackingDialogComponent';

export type MovementType = 'Selected Assets Movement' | 'Full Movement';

/**
 * New Movement creation dialog (and the Add Assets dialog opened from a
 * Created-container's Actions menu — same `.tracking-dialog` markup).
 *
 * Verified live 2026-08-27: the asset-picker half (8 filter fields, Search /
 * Clear, paginated grid, row checkboxes, Save / Cancel footer, attachment
 * `input[type=file]`) is byte-identical to Tagging's Add Tracking dialog, so
 * that half is delegated wholesale to `AddTrackingDialogComponent` rather than
 * re-implemented. Only the Movement-specific controls are defined here:
 *
 * - Movement Type toggle (required; default "Selected Assets Movement")
 * - Target Location dropdown + mandatory Location Memo, OR a Target Responsible
 *   (business rule from the inline hint: EITHER a target location with a memo
 *   OR a target responsible person)
 * - required Reason textarea
 *
 * Business rule — the location cascade (Current Location -> Business Unit ->
 * Department) is data-dependent and identical to Tagging's; use
 * `findLocationEnablingBusinessUnit()` / `findBusinessUnitEnablingDepartment()`.
 */
export class NewMovementDialogComponent {
  /** The shared asset-picker half of the dialog. */
  readonly picker: AddTrackingDialogComponent;

  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {
    this.picker = new AddTrackingDialogComponent(page, repository);
  }

  // ─── Actions — Movement-specific ─────────────────────────

  async selectMovementType(type: MovementType): Promise<void> {
    await allure.step(`Select Movement Type "${type}"`, async () => {
      await this.movementTypeOption(type).click();
      await expect(this.activeMovementTypeOption()).toHaveText(new RegExp(type));
    });
  }

  /**
   * Selects an asset-picker dropdown filter using the class-scoped
   * `.p-dropdown-item` option list filtered by EXACT text — never the page-wide
   * text locator the shared picker component uses. Verified live: filter values
   * such as a Current Location name also appear as asset-grid cell text behind
   * the open panel, so a bare global text match can click the grid cell instead
   * of the option, silently leaving the filter unapplied (TC-MOV-009 failed
   * exactly this way). Same gotcha DisposalPage.selectDisposalMethod documents.
   */
  async selectPickerDropdownFilter(fieldLabel: string, optionLabel: string): Promise<void> {
    await allure.step(`Select picker filter "${fieldLabel}" = "${optionLabel}"`, async () => {
      await this.pickerFilterCombobox(fieldLabel).click();
      await this.dropdownOptionByExactText(optionLabel).click();
    });
  }

  async selectTargetLocation(optionLabel: string): Promise<void> {
    await allure.step(`Select Target Location "${optionLabel}"`, async () => {
      await this.targetLocationDropdown().click();
      await this.dropdownOptionByExactText(optionLabel).click();
    });
  }

  async readTargetLocationOptions(): Promise<string[]> {
    return allure.step('Read the available Target Location options from the live dropdown', async () => {
      await this.targetLocationDropdown().click();
      const options = this.repository.locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION');
      const labels = (await options.allInnerTexts()).map((text) => text.trim()).filter(Boolean);
      await this.targetLocationDropdown().click();
      return labels;
    });
  }

  async enterLocationMemo(memo: string): Promise<void> {
    await allure.step(`Enter Location Memo "${memo}"`, async () => {
      await this.locationMemoInput().fill(memo);
    });
  }

  async selectTargetResponsible(optionLabel: string): Promise<void> {
    await allure.step(`Select Target Responsible "${optionLabel}"`, async () => {
      await this.targetResponsibleDropdown().click();
      await this.dropdownOptionByExactText(optionLabel).click();
    });
  }

  async enterReason(reason: string): Promise<void> {
    await allure.step(`Enter movement Reason "${reason}"`, async () => {
      await this.reasonTextarea().fill(reason);
    });
  }

  async save(): Promise<void> {
    await this.picker.save();
  }

  /**
   * Clicks Save WITHOUT waiting for the dialog to close — for the negative
   * validation cases, where the whole point is that the save is rejected and
   * the dialog stays open. Returns false when Save is disabled (the app can
   * gate an invalid form either way, and both outcomes prove the same rule).
   */
  async attemptSave(): Promise<boolean> {
    return allure.step('Attempt to save the movement request (expecting rejection)', async () => {
      if (!(await this.saveButton().isEnabled())) {
        return false;
      }
      await this.saveButton().click();
      return true;
    });
  }

  async isSaveEnabled(): Promise<boolean> {
    return this.saveButton().isEnabled();
  }

  async isOpen(): Promise<boolean> {
    return this.root().isVisible().catch(() => false);
  }

  async cancel(): Promise<void> {
    await this.picker.cancel();
    await expect(this.root()).toBeHidden();
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertOpen(expectedTitle = 'New Movement'): Promise<void> {
    await allure.step(`Assert the "${expectedTitle}" dialog is open`, async () => {
      await expect(this.root()).toBeVisible({ timeout: 20_000 });
      await expect(this.title()).toHaveText(expectedTitle);
      await expect(this.root().locator('table tbody tr').first()).toBeVisible({ timeout: 20_000 });
    });
  }

  async assertClosed(): Promise<void> {
    await expect(this.root()).toBeHidden();
  }

  async assertSaveDisabled(): Promise<void> {
    await this.picker.assertSaveDisabled();
  }

  async assertSaveEnabled(): Promise<void> {
    await this.picker.assertSaveEnabled();
  }

  // ─── Getters ─────────────────────────────────────────────

  async readReason(): Promise<string> {
    return this.reasonTextarea().inputValue();
  }

  async readLocationMemo(): Promise<string> {
    return this.locationMemoInput().inputValue();
  }

  // ─── Helpers (private) ──────────────────────────────────

  private root(): Locator {
    return this.repository.locator('TAGGING.DIALOG.ROOT');
  }

  private title(): Locator {
    return this.repository.locator('TAGGING.DIALOG.TITLE', { scope: this.root() });
  }

  private movementTypeOption(type: MovementType): Locator {
    return this.repository.locator('MOVEMENT.DIALOG.MOVEMENT_TYPE_OPTION', {
      scope: this.root(),
      parameters: { optionLabel: type },
    });
  }

  private activeMovementTypeOption(): Locator {
    return this.repository.locator('MOVEMENT.DIALOG.MOVEMENT_TYPE_ACTIVE', { scope: this.root() });
  }

  private targetLocationDropdown(): Locator {
    return this.repository.locator('MOVEMENT.DIALOG.TARGET_LOCATION_DROPDOWN', { scope: this.root() });
  }

  private targetResponsibleDropdown(): Locator {
    return this.repository.locator('MOVEMENT.DIALOG.TARGET_RESPONSIBLE_DROPDOWN', { scope: this.root() });
  }

  private locationMemoInput(): Locator {
    return this.repository.locator('MOVEMENT.DIALOG.LOCATION_MEMO_INPUT', { scope: this.root() });
  }

  private reasonTextarea(): Locator {
    return this.repository.locator('MOVEMENT.DIALOG.REASON_TEXTAREA', { scope: this.root() });
  }

  private saveButton(): Locator {
    return this.repository.locator('TAGGING.DIALOG.SAVE_BUTTON', { scope: this.root() });
  }

  private pickerFilterCombobox(fieldLabel: string): Locator {
    return this.repository.locator('TAGGING.DIALOG.PICKER_FILTER_COMBOBOX', {
      scope: this.root(),
      parameters: { fieldLabel },
    });
  }

  /**
   * Class-scoped `.p-dropdown-item` filtered by exact text — NOT the page-wide
   * text locator, which can collide with an asset-grid cell showing the same
   * word behind the open panel (same gotcha DisposalPage.selectDisposalMethod
   * documents).
   */
  private dropdownOptionByExactText(optionLabel: string): Locator {
    const escaped = optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.repository
      .locator('TAGGING.DIALOG.DROPDOWN_ANY_OPTION')
      .filter({ hasText: new RegExp(`^${escaped}$`) })
      .first();
  }
}
