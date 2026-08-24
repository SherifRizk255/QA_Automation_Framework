import { test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// THROWAWAY — capture the agent "Customers In Queue" view to build the arrival check.
const DIR = path.resolve('reports', 'system-walkthrough', 'cvm', 'agent');
fs.mkdirSync(DIR, { recursive: true });
const AGENT_URL = process.env.CVM_AGENT_URL!;
const AGENT_USER = process.env.CVM_AGENT_OPS_USERNAME!; // CS2
const AGENT_PASS = process.env.CVM_AGENT_PASSWORD!;

test.use({ headless: false, viewport: null, launchOptions: { slowMo: 400, args: ['--start-maximized'] } });

async function dump(page: Page, name: string) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true }).catch(() => {});
  const inv = await page.evaluate(() => {
    const t = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const vis = (el: Element) => (el as HTMLElement).offsetParent !== null;
    return {
      buttons: Array.from(document.querySelectorAll('button')).map((b) => t(b)).filter(Boolean),
      dialogs: Array.from(document.querySelectorAll('.p-dialog, .p-sidebar, .p-overlaypanel')).filter(vis).map((d) => t(d).slice(0, 800)),
      body: (document.body.innerText || '').replace(/\n{2,}/g, '\n').trim().slice(0, 3000),
    };
  });
  console.log(`\n===== [${name}] =====\n${JSON.stringify(inv, null, 1)}`);
}

test('queue discovery — Customers In Queue view', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: null });
  const p = await ctx.newPage();
  await p.goto(AGENT_URL, { waitUntil: 'domcontentloaded' });
  await p.locator('form input').first().fill(AGENT_USER);
  await p.locator('input[type="password"]').fill(AGENT_PASS);
  await p.getByRole('button', { name: /login|sign in/i }).click();
  await p.getByRole('button', { name: 'Confirm', exact: true }).click();
  await p.getByRole('heading', { name: /^Hello/i }).waitFor({ timeout: 30_000 });
  await dump(p, 'queue-00-home');
  await p.getByRole('button', { name: /customers in queue/i }).click();
  await dump(p, 'queue-01-list');
});
