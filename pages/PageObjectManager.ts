import type { Page } from '@playwright/test';

/**
 * One controlled access point to every page object for a given Page (GUIDELINES §8).
 * Page objects are created lazily on first access and cached, so a spec only pays
 * for the pages it actually uses. Contains no test scenarios, environment logic,
 * test data, hooks, or assertions.
 *
 * Specs receive an instance via the `pom` fixture. A second browser context
 * (e.g. the CRM tab in cross-system tests, skill 20) gets its own manager:
 * `new PageObjectManager(crmTab)`.
 *
 * ── How to wire a new page object (GUIDELINES §8) ────────────────────────────
 *   1. Create the class in `pages/`, extending the correct base
 *      (CRM pages extend `pages/crm/BaseCrmPage`).
 *   2. Add a lazy getter here, following the `resolve(...)` pattern below:
 *
 *        import { AccountsSummaryPage } from './portal/accounts/AccountsSummaryPage';
 *
 *        get accountsSummaryPage(): AccountsSummaryPage {
 *          return this.resolve('accountsSummaryPage', () => new AccountsSummaryPage(this.page));
 *        }
 *
 *   3. Access it in specs through the `pom` fixture (`pom.accountsSummaryPage`).
 */
export class PageObjectManager {
  private readonly cache = new Map<string, unknown>();

  constructor(readonly page: Page) {}

  private resolve<T>(key: string, create: () => T): T {
    if (!this.cache.has(key)) this.cache.set(key, create());
    return this.cache.get(key) as T;
  }

  // ─── Portal ──────────────────────────────────────────────
  // Add portal page-object getters here.

  // ─── CRM (Dynamics 365 — auth rules in skill 26) ─────────
  // Add CRM page-object getters here (each page extends BaseCrmPage).
}
