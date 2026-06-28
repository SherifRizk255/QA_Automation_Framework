import 'dotenv/config';
import { type Page } from '@playwright/test';
import { createRequire } from 'node:module';

// httpntlm is a CommonJS package with no TypeScript types.
// createRequire makes require() available inside this ESM module.
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const httpntlm = require('httpntlm');

const [domain, username] = (process.env.CRM_USERNAME ?? '').split('\\');

const NTLM_CREDS = {
  username,
  password: process.env.CRM_PASSWORD ?? '',
  domain,
  workstation: '',
  rejectUnauthorized: false, // internal CA cert not in Node.js trust store
};

function ntlmRequest(
  method: string,
  url: string,
  headers: Record<string, string>
): Promise<{ statusCode: number; headers: Record<string, string | string[]>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const fn = (httpntlm[method.toLowerCase()] as ((...args: unknown[]) => void) | undefined) ?? httpntlm.get;
    fn({ ...NTLM_CREDS, url, headers }, (err: Error | null, res: { statusCode: number; headers: Record<string, string | string[]>; body: Buffer }) => {
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
 * Intercepts all requests to crm.cubicsystems.com and fulfills them
 * via NTLM using credentials from the .env file.
 */
export async function setupNtlmAuth(page: Page): Promise<void> {
  await page.route('https://crm.cubicsystems.com/**', async (route, request) => {
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
