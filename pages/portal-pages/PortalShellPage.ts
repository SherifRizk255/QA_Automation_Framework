import type { Page } from '@playwright/test';
import { BasePortalPage } from './BasePortalPage';

/**
 * Generic authenticated portal shell, used when no specific feature page is
 * needed yet — e.g. reading back the active role right after a role switch,
 * before navigating to a feature module.
 */
export class PortalShellPage extends BasePortalPage {
  constructor(page: Page) {
    super(page);
  }
}
