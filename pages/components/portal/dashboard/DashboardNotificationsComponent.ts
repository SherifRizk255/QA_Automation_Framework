import {
  expect,
  type Locator,
} from '@playwright/test';
import { LocatorRepository } from '../../../../utils/locatorRepository.js';
import { normalizeText } from '../../../../utils/portal/dashboard/dashboardDisplayFormatter.js';

export class DashboardNotificationsComponent {
  constructor(private readonly repository: LocatorRepository) {}

  private get trigger(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.NOTIFICATIONS.BUTTON'
    );
  }

  private get panel(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.NOTIFICATIONS.PANEL'
    );
  }

  private get emptyState(): Locator {
    return this.repository.locator(
      'PORTAL.DASHBOARD.NOTIFICATIONS.EMPTY_STATE',
      { scope: this.panel }
    );
  }

  async openPanel(): Promise<void> {
    await expect(this.trigger).toHaveCount(1);
    await expect(this.trigger).toBeVisible();
    await expect(this.trigger).toBeEnabled();
    await this.trigger.click();
    await expect(this.panel).toHaveCount(1);
    await expect(this.panel).toBeVisible();
  }

  async getEmptyStateText(): Promise<string> {
    await expect(this.panel).toBeVisible();
    await expect(this.emptyState).toHaveCount(1);
    await expect(this.emptyState).toBeVisible();
    return normalizeText(await this.emptyState.innerText());
  }
}
