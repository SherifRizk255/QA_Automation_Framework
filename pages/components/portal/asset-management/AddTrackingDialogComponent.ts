import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

export class AddTrackingDialogComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  // ─── Actions ─────────────────────────────────────────────

  async cancel(): Promise<void> {
    await allure.step('Cancel the Add Tracking dialog', async () => {
      await this.cancelButton().click();
    });
  }

  async dismissWithEscape(): Promise<void> {
    await allure.step('Dismiss the Add Tracking dialog with Escape', async () => {
      await this.page.keyboard.press('Escape');
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertOpenForCreation(): Promise<void> {
    await allure.step('Assert the Add Tracking dialog is open for creation', async () => {
      await expect(this.root()).toBeVisible();
      await expect(this.title()).toBeVisible();
      const fieldCount = await this.editableFields().count();
      expect(fieldCount).toBeGreaterThan(0);
    });
  }

  async assertClosed(): Promise<void> {
    await allure.step('Assert the Add Tracking dialog is closed', async () => {
      await expect(this.root()).toBeHidden();
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  async readTitle(): Promise<string> {
    return (await this.title().textContent())?.trim() ?? '';
  }

  async hasEditableFields(): Promise<boolean> {
    const fieldCount = await this.editableFields().count();
    return fieldCount > 0;
  }

  // ─── Helpers (private) ──────────────────────────────────

  private root(): Locator {
    return this.repository.locator('ASSET.TAGGING.DIALOG.ROOT');
  }

  private title(): Locator {
    return this.repository.locator('ASSET.TAGGING.DIALOG.TITLE', { scope: this.root() });
  }

  private editableFields(): Locator {
    return this.repository.locator('ASSET.TAGGING.DIALOG.FIELD_CONTAINER', { scope: this.root() });
  }

  private cancelButton(): Locator {
    return this.repository.locator('ASSET.TAGGING.DIALOG.CANCEL_BUTTON', { scope: this.root() });
  }
}
