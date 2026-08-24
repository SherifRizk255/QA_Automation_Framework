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
    usedBy: [],
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
  PORTAL_HEADER: {
    name: 'PortalHeaderComponent',
    path: 'pages/components/portal/navigation/PortalHeaderComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'TaggingPage',
    ],
    responsibilities: [
      'Owns parameterized header module-link resolution (Tagging, and any module added later).',
      'Opens a named module from the header and asserts its availability.',
      'Reads the currently active module label for navigation assertions.',
    ],
  },
  TAGGING_ASSET_SELECTION_GRID: {
    name: 'AssetSelectionGridComponent',
    path: 'pages/components/portal/tagging/AssetSelectionGridComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'TaggingPage',
    ],
    responsibilities: [
      'Owns the Tagging asset grid: data-row filtering (excludes the header row semantically via ROW_CELL, not positional nth()).',
      'Exposes single/multiple/select-all checkbox selection and typed row-count/identifier reads.',
      'Exposes an optional find*() reader for the first ineligible (non-selectable) row.',
      'Asserts empty-state visibility and exact row counts without interpreting business rules.',
    ],
  },
  TAGGING_ADVANCED_FILTER: {
    name: 'AdvancedFilterComponent',
    path: 'pages/components/portal/tagging/AdvancedFilterComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'TaggingPage',
    ],
    responsibilities: [
      'Owns the advanced filter panel: expand, set a parameterized field, apply, and reset.',
      'Reads back active filter chip labels and a given field\'s current value.',
    ],
  },
  TAGGING_CONTAINER_LIST_FILTER: {
    name: 'ContainerListFilterComponent',
    path: 'pages/components/portal/tagging/ContainerListFilterComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'TaggingPage',
    ],
    responsibilities: [
      'Owns the container-list Advanced Filters panel (.adv-filters): Search text, Status multiselect, Date From / Date To calendars, and the Search / Clear actions.',
      'Reads the Status options from the live dropdown so specs never hardcode a status list.',
      'Asserts every filter control is back to its default state after Clear (controls, not just the grid).',
      'Distinct from AdvancedFilterComponent, which drives the asset-picker filter form inside the Add Tracking dialog — different DOM, different fields.',
    ],
  },
  TAGGING_ADD_TRACKING_DIALOG: {
    name: 'AddTrackingDialogComponent',
    path: 'pages/components/portal/tagging/AddTrackingDialogComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'TaggingPage',
    ],
    responsibilities: [
      'Owns the Add Tracking creation dialog: open-for-creation and closed-state assertions.',
      'Supports cancel and Escape dismissal, and reads the dialog title / editable-field presence.',
      'Reused for the Add Assets dialog (proven equivalent DOM: same filter form + grid + Save/Cancel footer, verified live) — owns the Fixed Asset Number search/clear, selectable-row checking, selected-asset counter, attachment upload (Add Tracking only), and Save.',
      'Owns all 8 picker filters: free-text (Fixed Asset Number, Reference Number, Asset Responsible Name) and dropdown (Asset Category, Asset Sub Category, Current Location, Business Unit, Department), plus Search and per-field enablement reads.',
      'Encodes the location cascade: Business Unit is gated on Current Location, and Department on Business Unit — both disabled on a fresh dialog by design.',
    ],
  },
  TAGGING_CONTAINER_DETAILS: {
    name: 'TrackingContainerDetailsComponent',
    path: 'pages/components/portal/tagging/TrackingContainerDetailsComponent.ts',
    scope: 'Portal',
    status: 'active',
    owner: 'QA Automation',
    usedBy: [
      'TaggingPage',
    ],
    responsibilities: [
      'Owns the Show Details dialog: the "Show Assets (N)" tab, its asset rows (Fixed Asset Number reads), and the close (X) control.',
    ],
  },
} satisfies Record<string, ComponentCatalogEntry>;
