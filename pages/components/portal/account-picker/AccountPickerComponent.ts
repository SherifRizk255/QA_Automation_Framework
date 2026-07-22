import {expect,type Locator,type Page} from '@playwright/test';
import { BaseComponent } from '../../core/BaseComponent';
import { PortalLoadingComponent } from '../loading/PortalLoadingComponent';
import { AccountRowComponent } from './AccountRowComponent';

export class AccountPickerComponent extends BaseComponent {
  
  // ───── Component Configuration ─────

  constructor(
    page: Page, 
    trigger: Locator,
    private readonly rows: Locator,
    private readonly loadingState: PortalLoadingComponent,
    private readonly pickerName: string
  ) 
  {
    super(page, trigger);
  }

  // ───── Picker Actions ─────

  async open(): Promise<void> {
    await this.loadingState.waitForCompletion();
    await this.root.click();
    await expect(this.rows.first()).toBeVisible({timeout: 15_000,});
  }

  // ───── Row Access ─────

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  row(index: number): AccountRowComponent {
    return new AccountRowComponent(
      this.page,
      this.rows.nth(index)
    );
  }

  async getAllTexts(): Promise<string[]> {
    const rowTexts = await this.rows.allInnerTexts();

    return rowTexts
      .map((rowText) => rowText.trim())
      .filter((rowText) => rowText !== '');
  }

  // ───── Picker Validation ─────

  async assertHasRows(): Promise<void> {
    const rowCount = await this.getRowCount();
    expect(rowCount, `${this.pickerName} picker should contain at least one account row.`).toBeGreaterThan(0);
  }
}
