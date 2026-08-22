/**
 * Central resource file — SINGLE SOURCE OF TRUTH for every URL, route,
 * environment value, and shared test-data constant used by the framework.
 *
 * Governance: docs/ai-workflow/24-centralized-resource-standard.md
 *
 * Rules enforced by this module:
 *  - Spec files and page objects NEVER contain a literal URL, host, org path,
 *    app id, or view id. They import ENV / ROUTES / TEST_DATA from here.
 *  - Every value can be overridden per project/environment through `.env`
 *    (skill 22 — Multi-Project Configuration). The literals below are the
 *    committed defaults for the currently active project (SAIB UAT).
 *  - Locators are NOT defined here — they live in
 *    `docs/analysis/locator-repository.json`, resolved via `utils/locatorRepository.ts`.
 */
import 'dotenv/config';

// ─── Env access helpers ──────────────────────────────────────────────────────

/** Read an optional variable, falling back to the committed default. */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  if (value !== undefined && value !== '') {
  return value;
} else {
  return fallback;
}
}

/** Read an optional boolean-like variable ("true"/"false", any casing). */
function envBool(name: string, fallback: 'true' | 'false'): boolean {
  return env(name, fallback).toLowerCase() === 'true';
}

/**
 * Read a mandatory variable (credentials are never committed — skill 19).
 * Reading is lazy so `tsc`/reporting tooling can load this module without a `.env`.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`🚫 AUTH BLOCKED — Missing environment variable: ${name} (see .env.example)`);
  }
  return value;
}

// ─── Project context (skill 22 guard rules) ──────────────────────────────────

export const PROJECT = {
  /** Client project key, e.g. SAIB | ABK | HDB. */
  name: env('PROJECT_NAME', 'SAIB'),
  /** SIT | UAT | DEV — never PROD. */
  targetEnv: env('TARGET_ENV', 'UAT'),
  /** When true, agents must not attempt network installs or external fetches. */
  airGapped: env('AIR_GAPPED', 'false').toLowerCase() === 'true',
} as const;

if (PROJECT.targetEnv.toUpperCase() === 'PROD') {
  throw new Error('🚫 BLOCKED — TARGET_ENV=PROD. Automation must never run against production (skill 22).');
}

// ─── Committed defaults for the active project (override via .env) ───────────

const PORTAL_BASE_URL = env('PORTAL_BASE_URL', '');
const PORTAL_LOGIN_PATH = env('PORTAL_LOGIN_PATH', '');

const CRM_BASE_URL = env('CRM_BASE_URL', 'https://crm.cubicsystems.com');
/** D365 organization paths — UAT org hosts SMS Logs / Service Requests; main org hosts transfer logs. */
const CRM_ORG_PATH_UAT = env('CRM_ORG_PATH_UAT', '/SaibUAT');
const CRM_ORG_PATH_MAIN = env('CRM_ORG_PATH_MAIN', '/Saib');
/** Model-driven app id (same app is deployed to both orgs for this tenant). */
const CRM_APP_ID = env('CRM_APP_ID', 'c6546de1-f7f5-f011-a74c-000c290f08a3');
/** Saved-view ids per entity list. */
const CRM_VIEW_ID_SMS_LOGS = env('CRM_VIEW_ID_SMS_LOGS', '4111affe-b728-482e-b44f-540508c30c3b');
const CRM_VIEW_ID_BMA_TRANSFER_LOG = env('CRM_VIEW_ID_BMA_TRANSFER_LOG', 'bae3b8ea-4de3-4510-bfcb-687442f58866');
const CRM_VIEW_ID_LOCALTRANSFER_LOG = env('CRM_VIEW_ID_LOCALTRANSFER_LOG', '9434451f-4390-462f-95c6-6a01e66721d9');
const CRM_VIEW_ID_PAY_MY_CARD_LOG = env('CRM_VIEW_ID_PAY_MY_CARD_LOG', '6a3e26c6-ee02-4966-8e03-a4f35baa20d5');

// IScore Asset Management project (docs/projects/iscore-asset-management) — skill 22.
// Committed defaults left blank for the portal (client-identifying host); CRM routing
// values below are non-secret tenant routing ids, same category as the SAIB ones above.
const ASSET_PORTAL_BASE_URL = env('ASSET_PORTAL_BASE_URL', '');
const ASSET_PORTAL_LOGIN_PATH = env('ASSET_PORTAL_LOGIN_PATH', '');

const ASSET_CRM_BASE_URL = env('ASSET_CRM_BASE_URL', 'https://crm.cubicsystems.com');
const ASSET_CRM_APP_ID = env('ASSET_CRM_APP_ID', 'a33fc2ad-6922-4822-92c5-4ec79ed129b0');
const ASSET_CRM_ORG_PATH = env('ASSET_CRM_ORG_PATH', '/ISCORE');
/** cis_users record whose role field drives Maker/Checker/Finance Checker portal access. */
const ASSET_CRM_USER_RECORD_ID = env('ASSET_CRM_USER_RECORD_ID', 'fd45443c-c79b-f111-a74f-000c290f08a3');


// ─── ENV: runtime environment values ─────────────────────────────────────────

export const ENV = {
  portal: {
    baseUrl: PORTAL_BASE_URL,
    loginPath: PORTAL_LOGIN_PATH,
    /** Full login URL; PORTAL_LOGIN_URL wins when set, else base + path. */
    loginUrl: env('PORTAL_LOGIN_URL', `${PORTAL_BASE_URL}${PORTAL_LOGIN_PATH}`),
    get username(): string {
      return requireEnv('PORTAL_USERNAME');
    },
    get password(): string {
      return requireEnv('PORTAL_PASSWORD');
    },
  },
  crm: {
    baseUrl: CRM_BASE_URL,
    /** Origin for context-level httpCredentials (NTLM — skill 19). */
    origin: new URL(CRM_BASE_URL).origin,
    /** Route-interception glob for the httpntlm fallback helper. */
    routePattern: `${new URL(CRM_BASE_URL).origin}/**`,
    get username(): string {
      return requireEnv('CRM_USERNAME');
    },
    get password(): string {
      return requireEnv('CRM_PASSWORD');
    },
  },
  assetPortal: {
    baseUrl: ASSET_PORTAL_BASE_URL,
    loginPath: ASSET_PORTAL_LOGIN_PATH,
    /** Full login URL; ASSET_PORTAL_LOGIN_URL wins when set, else base + path. */
    loginUrl: env('ASSET_PORTAL_LOGIN_URL', `${ASSET_PORTAL_BASE_URL}${ASSET_PORTAL_LOGIN_PATH}`),
    get username(): string {
      return requireEnv('ASSET_PORTAL_USERNAME');
    },
    get password(): string {
      return requireEnv('ASSET_PORTAL_PASSWORD');
    },
  },
  assetCrm: {
    baseUrl: ASSET_CRM_BASE_URL,
    /** Origin for context-level httpCredentials (NTLM — skill 19). */
    origin: new URL(ASSET_CRM_BASE_URL).origin,
    routePattern: `${new URL(ASSET_CRM_BASE_URL).origin}/**`,
    get username(): string {
      return requireEnv('ASSET_CRM_USERNAME');
    },
    get password(): string {
      return requireEnv('ASSET_CRM_PASSWORD');
    },
  },
} as const;

// ─── ROUTES: every navigable URL used by specs and page objects ──────────────

/** Build a D365 entity-list URL. viewId is optional — D365 falls back to the default view. */
export function crmEntityListUrl(options: {
  orgPath: string;
  entityName: string;
  viewId?: string;
  appId?: string;
}): string {
  const params = new URLSearchParams({
    appid: options.appId ?? CRM_APP_ID,
    pagetype: 'entitylist',
    etn: options.entityName,
    viewType: '1039',
  });

  if (options.viewId) {
    params.set('viewid', options.viewId);
  }

  return `${CRM_BASE_URL}${options.orgPath}/main.aspx?${params.toString()}`;
}

/** Build a D365 entity-record URL (a single opened record, not a list). */
export function crmRecordUrl(options: {
  orgPath: string;
  entityName: string;
  id: string;
  appId?: string;
}): string {
  const params = new URLSearchParams({
    appid: options.appId ?? ASSET_CRM_APP_ID,
    pagetype: 'entityrecord',
    etn: options.entityName,
    id: options.id,
  });

  return `${ASSET_CRM_BASE_URL}${options.orgPath}/main.aspx?${params.toString()}`;
}

/**
 * Build a portal SPA hash route (portal is a hash-routed Angular app).
 * `fromUrl` defaults to the configured login URL; pass `page.url()` as a
 * fallback base when the login URL is not configured.
 */
export function portalHashRoute(hashRoute: string, fromUrl: string = ENV.portal.loginUrl): string {
  const hashIndex = fromUrl.indexOf('#');
  const baseUrl = hashIndex === -1 ? fromUrl : fromUrl.substring(0, hashIndex);

  return baseUrl + hashRoute;
}

export const ROUTES = {
  portal: {
    login: ENV.portal.loginUrl,
    dashboard: '#/dashboard',
    accounts: '#/accounts',
    transfers: '#/transfers',
    transferHub: '#/transfers/transfer-money',
    betweenMyAccounts: '#/transfers/transfer-money/between-my-accounts',
    cards: '#/cards',
    loans: '#/loans',
    investments: '#/deposits',
    more: '#/more',
    profile: '#/profile',
  },
  portalApi: {
    customerProfile: '/api/v1/auth/user/profile',
    customerProducts: '/api/v1/customer/products',
    customerCards: '/api/v1/customer/cards',
    exchangeRates: '/api/v1/masterdata/exchange-rates',
    accountDetails: '/api/v1/customer/accounts/details',
    accountStatement: '/api/v1/customer/accounts/statement',
  },
  crm: {
    smsLogs: crmEntityListUrl({
      orgPath: CRM_ORG_PATH_MAIN,
      entityName: 'cis_smslog',
      viewId: CRM_VIEW_ID_SMS_LOGS,
    }),
    serviceRequests: crmEntityListUrl({
      orgPath: CRM_ORG_PATH_MAIN,
      entityName: 'cis_servicerequest',
    }),
    betweenMyAccountsTransferLog: crmEntityListUrl({
      orgPath: CRM_ORG_PATH_MAIN,
      entityName: 'cis_betweenmyaccountstransferlog',
      viewId: CRM_VIEW_ID_BMA_TRANSFER_LOG,
    }),
    localTransferLog: crmEntityListUrl({
      orgPath: CRM_ORG_PATH_MAIN,
      entityName: 'cis_localtransferlog',
      viewId: CRM_VIEW_ID_LOCALTRANSFER_LOG,
    }),
    payMyCardLog: crmEntityListUrl({
      orgPath: CRM_ORG_PATH_MAIN,
      entityName: 'cis_paymycreditcardtransferlog',
      viewId: CRM_VIEW_ID_PAY_MY_CARD_LOG,
    }),
  },
  assetPortal: {
    login: ENV.assetPortal.loginUrl,
    /** Hash route for the Tagging module; compose with portalHashRoute() to navigate directly. */
    tagging: '#/tagging',
  },
  assetCrm: {
    /** cis_users record whose role field drives Maker/Checker/Finance Checker portal access. */
    userRecord: crmRecordUrl({
      orgPath: ASSET_CRM_ORG_PATH,
      entityName: 'cis_users',
      id: ASSET_CRM_USER_RECORD_ID,
    }),
  },
} as const;

// ─── ROLES: IScore Asset Management role model (skill 19 / 20) ───────────────

/**
 * All three roles authenticate with the same portal credentials
 * (ENV.assetPortal.username/password). The active role is a field on the CRM
 * cis_users record, not a portal-side setting — see RoleSwitchOrchestrator.
 */
export const ROLES = {
  MAKER: {
    crmFieldValue: env('ASSET_ROLE_LABEL_MAKER', 'Maker'),
    storageStatePath: '.auth/asset-maker-state.json',
  },
  CHECKER: {
    crmFieldValue: env('ASSET_ROLE_LABEL_CHECKER', 'Checker'),
    storageStatePath: '.auth/asset-checker-state.json',
  },
  FINANCE_CHECKER: {
    crmFieldValue: env('ASSET_ROLE_LABEL_FINANCE_CHECKER', 'Finance Checker'),
    storageStatePath: '.auth/asset-finance-checker-state.json',
  },
} as const;

export type AssetPortalRole = keyof typeof ROLES;

// ─── TEST_DATA: shared, non-secret test data constants ───────────────────────

export const TEST_DATA = {
  /** Non-posting-safe amount approved for Between My Accounts transfer runs. */
  transferAmount: env('TEST_TRANSFER_AMOUNT', '77'),
  /** Internet Banking user expected on the CRM transfer-log record. */
  portalIbUsername: env('PORTAL_IB_USERNAME', 'OSerry'),
  assetTagging: {
    /** How many eligible grid rows the multi-select regression cases check. */
    multiSelectCount: Number(env('ASSET_TAGGING_MULTI_SELECT_COUNT', '2')),
    /** Advanced filter field label exercised by the filter regression cases. */
    filterFieldLabel: env('ASSET_TAGGING_FILTER_FIELD_LABEL', 'Asset Category'),
    /** A value expected to narrow (not empty) the grid; blank = derive from a live row. */
    filterMatchValue: env('ASSET_TAGGING_FILTER_MATCH_VALUE', ''),
    /** A value guaranteed not to match any row, to exercise the empty-state case. */
    filterNoMatchValue: env('ASSET_TAGGING_FILTER_NO_MATCH_VALUE', 'Unmatched-Filter-Value-QA'),
  },
} as const;

// ─── Reporting identity (skill 25 — Cubic HTML Execution Report) ─────────────

export const REPORTING = {
  companyName: env('REPORT_COMPANY_NAME', 'Cubic'),
  outputDir: env('REPORT_OUTPUT_DIR', 'reports/cubic-report'),
} as const;
