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
 *    committed defaults for the currently active project (IScore Asset
 *    Management, DEMO environment).
 *  - Locators are NOT defined here — they live in
 *    `docs/analysis/locator-repository.json`, resolved via `utils/locatorRepository.ts`.
 */
import 'dotenv/config';

// ─── Env access helpers ──────────────────────────────────────────────────────

/**
 * Read an optional variable, falling back to the committed default.
 * Accepts a single name or a list of accepted names (aliases) — the first
 * set variable wins, so both `ASSET_PORTAL_*` and plain `PORTAL_*` env files work.
 */
function env(names: string | string[], fallback: string): string {
  for (const name of Array.isArray(names) ? names : [names]) {
    const value = process.env[name];
    if (value !== undefined && value !== '') {
      return value;
    }
  }
  return fallback;
}

/** Read an optional boolean-like variable ("true"/"false", any casing). */
function envBool(name: string, fallback: 'true' | 'false'): boolean {
  return env(name, fallback).toLowerCase() === 'true';
}

/**
 * Read a mandatory variable (credentials are never committed — skill 19).
 * Reading is lazy so `tsc`/reporting tooling can load this module without a `.env`.
 * Accepts aliases like env(); the STOP message names the primary variable.
 */
function requireEnv(names: string | string[]): string {
  const nameList = Array.isArray(names) ? names : [names];
  for (const name of nameList) {
    const value = process.env[name];
    if (value !== undefined && value !== '') {
      return value;
    }
  }
  throw new Error(`🚫 AUTH BLOCKED — Missing environment variable: ${nameList[0]} (see .env.example)`);
}

// ─── Project context (skill 22 guard rules) ──────────────────────────────────

export const PROJECT = {
  /** Client project key. */
  name: env('PROJECT_NAME', 'ISCORE-ASSETS'),
  /** Business domain this project automates. */
  domain: env('PROJECT_DOMAIN', 'Fixed Asset Management'),
  /** DEMO | SIT | UAT | DEV — never PROD. */
  targetEnv: env('TARGET_ENV', 'DEMO'),
  /** When true, agents must not attempt network installs or external fetches. */
  airGapped: envBool('AIR_GAPPED', 'false'),
} as const;

if (PROJECT.targetEnv.toUpperCase() === 'PROD') {
  throw new Error('🚫 BLOCKED — TARGET_ENV=PROD. Automation must never run against production (skill 22).');
}

// ─── Committed defaults for the active project (override via .env) ───────────
// Each value accepts the ASSET_-prefixed name (primary) and the plain name as
// an alias, so both existing .env layouts resolve to the same configuration.

const PORTAL_BASE_URL = env(
  ['ASSET_PORTAL_BASE_URL', 'PORTAL_BASE_URL'],
  'https://demo03.cubicsystems.com:8443/IScore-Assets/IScore-FixedAsset-Portal/'
);
const PORTAL_LOGIN_PATH = env(['ASSET_PORTAL_LOGIN_PATH', 'PORTAL_LOGIN_PATH'], '#/login');

const CRM_BASE_URL = env(['ASSET_CRM_BASE_URL', 'CRM_BASE_URL'], 'https://crm.cubicsystems.com');
const CRM_ORG_PATH = env(['ASSET_CRM_ORG_PATH', 'CRM_ORG_PATH'], '/ISCORE');
const CRM_APP_ID = env(['ASSET_CRM_APP_ID', 'CRM_APP_ID'], 'a33fc2ad-6922-4822-92c5-4ec79ed129b0');
/** D365 entity holding the Maker/Checker/Finance Checker role field. */
const CRM_USER_ENTITY = env(['ASSET_CRM_USER_ENTITY', 'CRM_USER_ENTITY'], 'cis_users');
/** The specific cis_users record whose role field this suite drives. */
const CRM_AUTOMATION_USER_RECORD_ID = env(
  ['ASSET_CRM_USER_RECORD_ID', 'CRM_AUTOMATION_USER_RECORD_ID'],
  'fd45443c-c79b-f111-a74f-000c290f08a3'
);

// ─── ENV: runtime environment values ─────────────────────────────────────────

export const ENV = {
  portal: {
    baseUrl: PORTAL_BASE_URL,
    loginPath: PORTAL_LOGIN_PATH,
    /** Full login URL; ASSET_PORTAL_LOGIN_URL/PORTAL_LOGIN_URL wins when set, else base + path. */
    loginUrl: env(['ASSET_PORTAL_LOGIN_URL', 'PORTAL_LOGIN_URL'], `${PORTAL_BASE_URL}${PORTAL_LOGIN_PATH}`),
    get username(): string {
      return requireEnv(['ASSET_PORTAL_USERNAME', 'PORTAL_USERNAME']);
    },
    get password(): string {
      return requireEnv(['ASSET_PORTAL_PASSWORD', 'PORTAL_PASSWORD']);
    },
  },
  crm: {
    baseUrl: CRM_BASE_URL,
    /** Origin for context-level httpCredentials (NTLM — skill 19). */
    origin: new URL(CRM_BASE_URL).origin,
    /** Route-interception glob for the httpntlm fallback helper. */
    routePattern: `${new URL(CRM_BASE_URL).origin}/**`,
    get username(): string {
      return requireEnv(['ASSET_CRM_USERNAME', 'CRM_USERNAME']);
    },
    get password(): string {
      return requireEnv(['ASSET_CRM_PASSWORD', 'CRM_PASSWORD']);
    },
  },
} as const;

// ─── ROUTES: every navigable URL used by specs and page objects ──────────────

/** Build a D365 entity-record URL (a single opened record, not a list). */
export function crmRecordUrl(options: { orgPath: string; entityName: string; id: string; appId?: string }): string {
  const params = new URLSearchParams({
    appid: options.appId ?? CRM_APP_ID,
    pagetype: 'entityrecord',
    etn: options.entityName,
    id: options.id,
  });

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
    /** Hash route for the Tagging module; compose with portalHashRoute() to navigate directly. */
    tagging: '#/tagging',
  },
  crm: {
    /** cis_users record whose role field drives Maker/Checker/Finance Checker portal access. */
    userRecord: crmRecordUrl({
      orgPath: CRM_ORG_PATH,
      entityName: CRM_USER_ENTITY,
      id: CRM_AUTOMATION_USER_RECORD_ID,
    }),
  },
} as const;

// ─── ROLES: role model (skill 19 / 20) ────────────────────────────────────────

/**
 * All three roles authenticate with the same portal credentials
 * (ENV.portal.username/password). The active role is a field on the CRM
 * cis_users record, not a portal-side setting — see RoleSwitchOrchestrator.
 */
export const ROLES = {
  MAKER: {
    crmFieldValue: env('ROLE_LABEL_MAKER', 'Maker'),
    storageStatePath: '.auth/maker-state.json',
  },
  CHECKER: {
    crmFieldValue: env('ROLE_LABEL_CHECKER', 'Checker'),
    storageStatePath: '.auth/checker-state.json',
  },
  FINANCE_CHECKER: {
    crmFieldValue: env('ROLE_LABEL_FINANCE_CHECKER', 'Finance Checker'),
    storageStatePath: '.auth/finance-checker-state.json',
  },
} as const;

export type PortalRole = keyof typeof ROLES;

// ─── TEST_DATA: shared, non-secret test data constants ───────────────────────

export const TEST_DATA = {
  tagging: {
    /** How many eligible grid rows the multi-select regression cases check. */
    multiSelectCount: Number(env('TAGGING_MULTI_SELECT_COUNT', '2')),
    /** Advanced filter field label exercised by the filter regression cases. */
    filterFieldLabel: env('TAGGING_FILTER_FIELD_LABEL', 'Asset Category'),
    /** A value expected to narrow (not empty) the grid; blank = derive from a live row. */
    filterMatchValue: env('TAGGING_FILTER_MATCH_VALUE', ''),
    /** A value guaranteed not to match any row, to exercise the empty-state case. */
    filterNoMatchValue: env('TAGGING_FILTER_NO_MATCH_VALUE', 'Unmatched-Filter-Value-QA'),
    /**
     * Preferred Fixed Asset Numbers for the Maker→Checker tracking-container smoke
     * test (TC-TAG-ASSET-040). Selected via the Add Tracking dialog's Fixed Asset
     * Number search when eligible; the test falls back to the next selectable grid
     * asset and reports the substitution when a preferred asset is unavailable or
     * already linked to another container.
     */
    preferredTrackingAssetNumbers: env('TAGGING_PREFERRED_ASSET_NUMBERS', 'COMP-000001,BUIL-000007')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    /** Attachment fixture uploaded when creating a tracking container (skill 24 — no hardcoded local paths). */
    attachmentFixturePath: env('TAGGING_ATTACHMENT_FIXTURE_PATH', 'test-data/attachments/asset-tagging-sample.png'),
  },
} as const;

// ─── Reporting identity (skill 25 — Cubic HTML Execution Report) ─────────────

export const REPORTING = {
  companyName: env('REPORT_COMPANY_NAME', 'Cubic'),
  outputDir: env('REPORT_OUTPUT_DIR', 'reports/cubic-report'),
} as const;
