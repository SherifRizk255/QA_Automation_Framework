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
 *    (skill 22 — Multi-Project Configuration).
 *  - Locators are NOT defined here — they live in
 *    `docs/analysis/locator-repository.json`, resolved via `utils/locatorRepository.ts`.
 *
 * This is a CLEAN PROJECT TEMPLATE. Fill the committed defaults / `.env` values
 * for the active project, then register real ROUTES and TEST_DATA below.
 */
import 'dotenv/config';

// ─── Env access helpers ──────────────────────────────────────────────────────

/** Read an optional variable, falling back to the committed default. */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value !== '' ? value : fallback;
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

/** Safely derive an origin from a possibly-empty/invalid URL (skeleton-safe). */
function originOf(url: string): string {
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}

// ─── Project context (skill 22 guard rules) ──────────────────────────────────

export const PROJECT = {
  /** Client project key, e.g. ABK | SAIB | HDB. */
  name: env('PROJECT_NAME', 'ABK'),
  /** SIT | UAT | DEV — never PROD. */
  targetEnv: env('TARGET_ENV', 'UAT'),
  /** When true, agents must not attempt network installs or external fetches. */
  airGapped: env('AIR_GAPPED', 'false').toLowerCase() === 'true',
} as const;

if (PROJECT.targetEnv.toUpperCase() === 'PROD') {
  throw new Error('🚫 BLOCKED — TARGET_ENV=PROD. Automation must never run against production (skill 22).');
}

// ─── Committed defaults for the active project (override via .env) ───────────
// Fill these in per project. Leave blank to require the value from `.env`.

const PORTAL_BASE_URL = env('PORTAL_BASE_URL', '');
const PORTAL_LOGIN_PATH = env('PORTAL_LOGIN_PATH', '');

const CRM_BASE_URL = env('CRM_BASE_URL', '');
/** D365 organization path(s) for this tenant, e.g. '/OrgName'. */
const CRM_ORG_PATH = env('CRM_ORG_PATH', '');
/** Model-driven app id for this tenant. */
const CRM_APP_ID = env('CRM_APP_ID', '');

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
    origin: originOf(CRM_BASE_URL),
    /** Route-interception glob for the httpntlm fallback helper. */
    routePattern: originOf(CRM_BASE_URL) ? `${originOf(CRM_BASE_URL)}/**` : '',
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
    ...(options.viewId ? { viewid: options.viewId } : {}),
    viewType: '1039',
  });
  return `${CRM_BASE_URL}${options.orgPath}/main.aspx?${params.toString()}`;
}

/**
 * Build a portal SPA hash route (for hash-routed Angular-style apps).
 * `fromUrl` defaults to the configured login URL; pass `page.url()` as a
 * fallback base when the login URL is not configured.
 */
export function portalHashRoute(hashRoute: string, fromUrl: string = ENV.portal.loginUrl): string {
  return fromUrl.includes('#') ? fromUrl.replace(/#.*$/, hashRoute) : `${fromUrl}${hashRoute}`;
}

export const ROUTES = {
  portal: {
    login: ENV.portal.loginUrl,
    // Register portal routes here, e.g.:
    //   accounts: '#/accounts',
  },
  crm: {
    // Register CRM entity-list routes here via crmEntityListUrl(), e.g.:
    //   serviceRequests: crmEntityListUrl({ orgPath: CRM_ORG_PATH, entityName: 'cis_servicerequest' }),
  },
} as const;

// ─── TEST_DATA: shared, non-secret test data constants ───────────────────────
// Register shared, non-secret test-data constants here (each env-overridable),
// e.g.:  transferAmount: env('TEST_TRANSFER_AMOUNT', '1'),

export const TEST_DATA = {} as const;

// ─── Reporting identity (skill 25 — Cubic HTML Execution Report) ─────────────

export const REPORTING = {
  companyName: env('REPORT_COMPANY_NAME', 'Cubic'),
  outputDir: env('REPORT_OUTPUT_DIR', 'reports/cubic-report'),
} as const;
