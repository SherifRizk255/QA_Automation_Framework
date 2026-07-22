import {expect,type Page} from '@playwright/test';
import { BaseComponent } from '../../core/BaseComponent';

export class PortalLoadingComponent extends BaseComponent {
  // ───── Component Configuration ─────

  constructor(page: Page) {
    super(page,
      page
        .locator('app-top-loading-bar')
        .getByRole('progressbar', {
          includeHidden: true,
        })
    );
  }

  // ───── Loading State ─────

  async waitForCompletion(): Promise<void> {
    await expect(this.root).toBeHidden({timeout: 20_000,});
  }
}
