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
    ],
    responsibilities: [
      'Locates the shared portal loading indicator.',
      'Waits for portal loading completion.',
    ],
  },
} satisfies Record<string, ComponentCatalogEntry>;
