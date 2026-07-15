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
    accounts: '#/accounts',
    transferHub: '#/transfers/transfer-money',
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
} as const;

// ─── TEST_DATA: shared, non-secret test data constants ───────────────────────

export const TEST_DATA = {
  /** Non-posting-safe amount approved for Between My Accounts transfer runs. */
  transferAmount: env('TEST_TRANSFER_AMOUNT', '77'),
  /** Internet Banking user expected on the CRM transfer-log record. */
  portalIbUsername: env('PORTAL_IB_USERNAME', 'OSerry'),
} as const;

// ─── Reporting identity (skill 25 — Cubic HTML Execution Report) ─────────────

export const REPORTING = {
  companyName: env('REPORT_COMPANY_NAME', 'Cubic'),
  outputDir: env('REPORT_OUTPUT_DIR', 'reports/cubic-report'),
} as const;
