import 'dotenv/config';
import { type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { ENV } from '../../config/resources';

// httpntlm is a CommonJS package with no TypeScript types.
// createRequire makes require() available inside this ESM module.
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const httpntlm = require('httpntlm');

// Credentials are read lazily via ENV (skill 24) so importing this helper
// never fails for portal-only runs; a missing variable surfaces as
// 🚫 AUTH BLOCKED at the first CRM request instead.
function getNtlmCreds() {
  const [domain, username] = ENV.crm.username.split('\\');
  return {
    username,
    password: ENV.crm.password,
    domain,
    workstation: '',
    rejectUnauthorized: false, // internal CA cert not in Node.js trust store
    timeout: 20_000,           // socket inactivity limit per NTLM round-trip;
                               // prevents open socket handles from keeping the
                               // Node.js process alive after a test ends
  };
}

function ntlmRequest(
  method: string,
  url: string,
  headers: Record<string, string>
): Promise<{ statusCode: number; headers: Record<string, string | string[]>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const fn = (httpntlm[method.toLowerCase()] as ((...args: unknown[]) => void) | undefined) ?? httpntlm.get;
    fn({ ...getNtlmCreds(), url, headers }, (err: Error | null, res: { statusCode: number; headers: Record<string, string | string[]>; body: Buffer }) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

function flattenHeaders(raw: Record<string, string | string[]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.toLowerCase() === 'transfer-encoding') continue;
    out[k] = Array.isArray(v) ? v.join(', ') : String(v);
  }
  return out;
}

/**
 * Call this in every CRM test before page.goto().
 * Intercepts all requests to the CRM origin (config/resources.ts) and
 * fulfills them via NTLM using credentials from the .env file.
 */
export async function setupNtlmAuth(page: Page): Promise<void> {
  await page.route(ENV.crm.routePattern, async (route, request) => {
    try {
      const res = await ntlmRequest(request.method(), request.url(), request.headers());
      await route.fulfill({
        status: res.statusCode,
        headers: flattenHeaders(res.headers),
        body: res.body,
      });
    } catch (err) {
      console.error('[NTLM] failed:', request.url(), err);
      await route.abort();
    }
  });
}
