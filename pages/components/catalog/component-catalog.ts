export type ComponentStatus =
  | 'experimental'
  | 'active'
  | 'deprecated'
  | 'retired';

export interface ComponentCatalogEntry {
  name: string;
  path: string;
  scope: 'Portal' | 'CRM' | 'Shared';
  status: ComponentStatus;
  owner: string;
  usedBy: readonly string[];
  responsibilities: readonly string[];
}

export const COMPONENT_CATALOG = {
  BaseComponent: {
    name: 'BaseComponent',
    path: 'pages/components/core/BaseComponent.ts',
    scope: 'Shared',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'AccountPickerComponent',
      'AccountRowComponent',
      'PortalLoadingComponent',
      'PortalSwiperCarouselComponent',
    ],
    responsibilities: [
      'Provides the minimal shared root and visibility contract for reusable UI components.',
    ],
  },

  ComponentCatalog: {
    name: 'ComponentCatalog',
    path: 'pages/components/catalog/component-catalog.ts',
    scope: 'Shared',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [],
    responsibilities: [
      'Defines type-safe metadata for reusable UI components and their lifecycle.',
    ],
  },
  ACCOUNT_ROW: {
    name: 'AccountRowComponent',
    path: 'pages/components/portal/account-picker/AccountRowComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'AccountPickerComponent',
      'TransferBetweenOwnAccountsPage',
    ],
    responsibilities: [
      'Reads and interacts with a scoped account-picker row.',
      'Discovers account-number, account-type, and supported-currency fields.',
      'Validates required account-row fields while supporting optional field discovery.',
    ],
  },
  ACCOUNT_PICKER: {
    name: 'AccountPickerComponent',
    path: 'pages/components/portal/account-picker/AccountPickerComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'TransferBetweenOwnAccountsPage',
    ],
    responsibilities: [
      'Opens a scoped account picker.',
      'Waits for account rows to become visible.',
      'Exposes scoped account-row components.',
      'Returns normalized account-row text.',
      'Asserts that an account picker contains rows.',
    ],
  },
  PORTAL_LOADING: {
    name: 'PortalLoadingComponent',
    path: 'pages/components/portal/loading/PortalLoadingComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'AccountPickerComponent',
      'TransferBetweenOwnAccountsPage',
      'DashboardPage',
    ],
    responsibilities: [
      'Locates the shared portal loading indicator.',
      'Waits for portal loading completion.',
    ],
  },
  PORTAL_SWIPER_CAROUSEL: {
    name: 'PortalSwiperCarouselComponent',
    path: 'pages/components/portal/carousel/PortalSwiperCarouselComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'DashboardAccountsWidgetComponent',
      'DashboardDepositsWidgetComponent',
      'DashboardLoansWidgetComponent',
    ],
    responsibilities: [
      'Owns the shared Swiper collection, active-item, and scoped Next-control mechanics.',
      'Validates that one bounded active item is visible before feature-specific field reading.',
      'Proves that carousel navigation changes the active item without interpreting business fields.',
    ],
  },
  DASHBOARD_WELCOME: {
    name: 'DashboardWelcomeComponent',
    path: 'pages/components/portal/dashboard/DashboardWelcomeComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'DashboardPage',
    ],
    responsibilities: [
      'Feature-scoped owner of PORTAL.DASHBOARD.WELCOME.* locator keys.',
      'Exposes assertReady(), getCustomerName(), and getSummaryValues() as typed UI-only operations.',
      'Reads the Welcome heading and three summary values without API comparison or reporting.',
      'Is not classified as a globally reusable component.',
    ],
  },
  DASHBOARD_ACCOUNTS_WIDGET: {
    name: 'DashboardAccountsWidgetComponent',
    path: 'pages/components/portal/dashboard/DashboardAccountsWidgetComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'DashboardPage',
    ],
    responsibilities: [
      'Feature-scoped owner of PORTAL.DASHBOARD.WIDGETS.ACCOUNTS.* locator keys.',
      'Exposes assertReady(), required and optional active-account readers, getItemCount(), moveNext(), and openManage() as typed UI-only operations.',
      'Lets DashboardPage skip the bounded Open new account action slide without treating it as an API account.',
      'Delegates active-slide and Next mechanics to PortalSwiperCarouselComponent.',
      'Excludes API matching, financial comparison, navigation assertions, and reporting.',
    ],
  },
  DASHBOARD_CARDS_WIDGET: {
    name: 'DashboardCardsWidgetComponent',
    path: 'pages/components/portal/dashboard/DashboardCardsWidgetComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'DashboardPage',
    ],
    responsibilities: [
      'Feature-scoped owner of PORTAL.DASHBOARD.WIDGETS.CARDS.* locator keys.',
      'Exposes typed active-card values, including the actual displayed statistic currencies, and Next behavior.',
      'Selects the visible front card through bounded opacity and z-index inspection of the Cards deck.',
      'Remains separate from PortalSwiperCarouselComponent because Cards uses a stacked deck rather than Swiper active-slide mechanics.',
      'Keeps missing post-navigation card statistics visible as the known SAIB-N-0181 application defect.',
      'Excludes API matching, financial comparison, masking, Allure reporting, and navigation.',
    ],
  },
  DASHBOARD_DEPOSITS_WIDGET: {
    name: 'DashboardDepositsWidgetComponent',
    path: 'pages/components/portal/dashboard/DashboardDepositsWidgetComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'DashboardPage',
    ],
    responsibilities: [
      'Feature-scoped owner of PORTAL.DASHBOARD.WIDGETS.DEPOSITS.* locator keys.',
      'Exposes assertReady() and getActiveDeposit() as typed UI-only operations.',
      'Delegates active-slide mechanics to PortalSwiperCarouselComponent.',
      'Excludes API product mapping, financial comparison, and reporting.',
    ],
  },
  DASHBOARD_LOANS_WIDGET: {
    name: 'DashboardLoansWidgetComponent',
    path: 'pages/components/portal/dashboard/DashboardLoansWidgetComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'DashboardPage',
    ],
    responsibilities: [
      'Feature-scoped owner of PORTAL.DASHBOARD.WIDGETS.LOANS.* locator keys.',
      'Exposes typed active-loan values, bounded ordered amounts, Next behavior, currency occurrence reading, and semantic/style-derived progress data.',
      'Prefers aria-valuenow and otherwise returns the measured fill-to-track width ratio without performing the business comparison.',
      'Delegates active-slide and Next mechanics to PortalSwiperCarouselComponent.',
      'Excludes API matching, financial comparison, and reporting.',
    ],
  },
  DASHBOARD_PORTFOLIO_WIDGET: {
    name: 'DashboardPortfolioWidgetComponent',
    path: 'pages/components/portal/dashboard/DashboardPortfolioWidgetComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'DashboardPage',
    ],
    responsibilities: [
      'Feature-scoped owner of PORTAL.DASHBOARD.WIDGETS.PORTFOLIO.ROOT and PORTAL.DASHBOARD.PORTFOLIO.* locator keys.',
      'Exposes Portfolio readiness, active-mode reading, liability selection, typed UI-state reading, and chart screenshot capture.',
      'Returns displayed totals, ordered legend labels and percentage text, and normalized panel text without API or financial interpretation.',
      'Captures chart evidence bytes without naming attachments or performing reporting.',
      'Excludes Portfolio calculations, API models, API/UI validation, percentage tolerance, Allure reporting, and business assertions.',
      'Is not classified as a globally reusable component.',
    ],
  },
} satisfies Record<string, ComponentCatalogEntry>;
