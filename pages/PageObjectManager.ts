import type { Page } from '@playwright/test';
import { LoginPage } from './portal/LoginPage';
import { DashboardPage } from './portal/DashboardPage';
import { TransferBetweenOwnAccountsPage } from './portal/TransferBetweenOwnAccountsPage';
import { LocalTransferToSaibAccountPage } from './portal/LocalTransferToSaibAccountPage';
import { TransferRepositoryPage } from './portal/TransferRepositoryPage';
import { AccountsSummaryPage } from './portal/accounts/AccountsSummaryPage';
import { AccountStatementsPage } from './portal/accounts/AccountStatementsPage';
import { AccountDetailsPage } from './portal/accounts/AccountDetailsPage';
import { TransactionHistoryPage } from './portal/accounts/TransactionHistoryPage';
import { SmsLogsPage } from './crm/SmsLogsPage';
import { ServiceRequestsPage } from './crm/ServiceRequestsPage';
import { BetweenMyAccountsTransferLogPage } from './crm/BetweenMyAccountsTransferLogPage';

/**
 * One controlled access point to every page object for a given Page (GUIDELINES §8).
 * Page objects are created lazily on first access and cached, so a spec only pays
 * for the pages it actually uses. Contains no test scenarios, environment logic,
 * test data, hooks, or assertions.
 *
 * Specs receive an instance via the `pom` fixture. A second browser context
 * (e.g. the CRM tab in cross-system tests, skill 20) gets its own manager:
 * `new PageObjectManager(crmTab)`.
 */
export class PageObjectManager {
  private readonly cache = new Map<string, unknown>();

  constructor(readonly page: Page) {}

  private resolve<T>(key: string, create: () => T): T {
    if (!this.cache.has(key)) this.cache.set(key, create());
    return this.cache.get(key) as T;
  }

  // ─── Portal ──────────────────────────────────────────────
  get loginPage(): LoginPage {
    return this.resolve('loginPage', () => new LoginPage(this.page));
  }

  get dashboardPage(): DashboardPage {
    return this.resolve('dashboardPage', () => new DashboardPage(this.page));
  }

  get transferBetweenOwnAccountsPage(): TransferBetweenOwnAccountsPage {
    return this.resolve('transferBetweenOwnAccountsPage', () => new TransferBetweenOwnAccountsPage(this.page));
  }

  get localTransferToSaibAccountPage(): LocalTransferToSaibAccountPage {
    return this.resolve('localTransferToSaibAccountPage', () => new LocalTransferToSaibAccountPage(this.page));
  }

  get transferRepositoryPage(): TransferRepositoryPage {
    return this.resolve('transferRepositoryPage', () => new TransferRepositoryPage(this.page));
  }

  get accountsSummaryPage(): AccountsSummaryPage {
    return this.resolve('accountsSummaryPage', () => new AccountsSummaryPage(this.page));
  }

  get accountStatementsPage(): AccountStatementsPage {
    return this.resolve('accountStatementsPage', () => new AccountStatementsPage(this.page));
  }

  get accountDetailsPage(): AccountDetailsPage {
    return this.resolve('accountDetailsPage', () => new AccountDetailsPage(this.page));
  }

  get transactionHistoryPage(): TransactionHistoryPage {
    return this.resolve('transactionHistoryPage', () => new TransactionHistoryPage(this.page));
  }

  // ─── CRM (Dynamics 365 — auth rules in skill 26) ─────────
  get smsLogsPage(): SmsLogsPage {
    return this.resolve('smsLogsPage', () => new SmsLogsPage(this.page));
  }

  get serviceRequestsPage(): ServiceRequestsPage {
    return this.resolve('serviceRequestsPage', () => new ServiceRequestsPage(this.page));
  }

  get betweenMyAccountsTransferLogPage(): BetweenMyAccountsTransferLogPage {
    return this.resolve('betweenMyAccountsTransferLogPage', () => new BetweenMyAccountsTransferLogPage(this.page));
  }
}
