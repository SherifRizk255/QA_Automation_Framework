import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

export abstract class BaseComponent {
  protected constructor(
    protected readonly page: Page,
    protected readonly root: Locator
  ) {}

  async assertVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }
}
