import { expect, type Page } from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { BaseComponent } from '../../core/BaseComponent.js';

export class PortalLoadingComponent extends BaseComponent {
  // ───── Component Configuration ─────

  constructor(page: Page) {
    super(
      page,
      new LocatorRepository(page).resolve('PORTAL.COMMON.LOADING.PROGRESSBAR')
    );
  }

  // ───── Loading State ─────

  async waitForCompletion(): Promise<void> {
    await expect(this.root).not.toHaveClass(/is-visible/, { timeout: 30_000 });
    await expect(this.root).toHaveAttribute('aria-valuenow', '0');
  }
}
