import { expect, type Locator, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LocatorRepository } from '../../../../utils/locatorRepository';

/**
 * IScore Asset Portal header navigation — parameterized module link resolution
 * so every module (Tagging, and any added later) reuses the same locator entry.
 */
export class PortalHeaderComponent {
  constructor(
    private readonly page: Page,
    private readonly repository: LocatorRepository
  ) {}

  // ─── Actions ─────────────────────────────────────────────

  async openModule(moduleLabel: string): Promise<void> {
    await allure.step(`Open "${moduleLabel}" from the portal header`, async () => {
      await this.moduleLink(moduleLabel).click();
    });
  }

  // ─── Assertions ──────────────────────────────────────────

  async assertModuleAvailable(moduleLabel: string): Promise<void> {
    await allure.step(`Assert "${moduleLabel}" is available in the portal header`, async () => {
      await expect(this.moduleLink(moduleLabel)).toBeVisible();
    });
  }

  // ─── Getters (values) ────────────────────────────────────

  async readActiveModuleLabel(): Promise<string> {
    return allure.step('Read the active module label from the header', async () => {
      const label = this.repository.locator('PORTAL.HEADER.ACTIVE_MODULE_LABEL');
      await expect(label).toBeVisible();
      return (await label.textContent())?.trim() ?? '';
    });
  }

  // ─── Helpers (private) ──────────────────────────────────

  private moduleLink(moduleLabel: string): Locator {
    return this.repository.locator('PORTAL.HEADER.MODULE_LINK', {
      parameters: { moduleName: moduleLabel },
    });
  }
}
