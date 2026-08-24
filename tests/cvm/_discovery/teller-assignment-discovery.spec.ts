import { test, type Page } from '@playwright/test';

// THROWAWAY — discover the Teller agent's branch/desk assignment flow.
const AGENT_URL = process.env.CVM_AGENT_URL!;
const USER = process.env.CVM_AGENT_TELLER_USERNAME!; // Teller1
const PASS = process.env.CVM_AGENT_PASSWORD!;

test.use({ headless: false, viewport: null, launchOptions: { slowMo: 500, args: ['--start-maximized'] } });

async function dump(page: Page, name: string) {
  await page.waitForTimeout(1000);
  const inv = await page.evaluate(() => {
    const t = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const vis = (el: Element) => (el as HTMLElement).offsetParent !== null;
    return {
      dropdowns: Array.from(document.querySelectorAll('p-dropdown, .p-dropdown')).map((d) => t(d)),
      panelItems: Array.from(document.querySelectorAll('.p-dropdown-panel .p-dropdown-item, .p-dropdown-items li')).filter(vis).map(t),
      buttons: Array.from(document.querySelectorAll('button')).map(t).filter(Boolean),
      body: (document.body.innerText || '').replace(/\n{2,}/g, '\n').trim().slice(0, 700),
    };
  });
  console.log(`\n===== [${name}] =====\n${JSON.stringify(inv, null, 1)}`);
}

test('teller assignment discovery', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: null });
  const p = await ctx.newPage();
  await p.goto(AGENT_URL, { waitUntil: 'domcontentloaded' });
  await p.locator('form input').first().fill(USER);
  await p.locator('input[type="password"]').fill(PASS);
  await p.getByRole('button', { name: /login|sign in/i }).click();
  await dump(p, 'assign-00-after-login');

  const dropdowns = p.locator('p-dropdown');
  const count = await dropdowns.count();
  console.log(`>>> dropdown count = ${count}`);

  // Open the first dropdown (Select Branch) and see options.
  await dropdowns.first().click();
  await dump(p, 'assign-01-branch-options');
  await p.locator('.p-dropdown-panel .p-dropdown-item').first().click();
  await dump(p, 'assign-02-after-branch');

  // If a second dropdown (desk) appeared, choose it too.
  if ((await dropdowns.count()) > 1) {
    await dropdowns.nth(1).click();
    await dump(p, 'assign-03-desk-options');
    await p.locator('.p-dropdown-panel .p-dropdown-item').first().click();
    await dump(p, 'assign-04-after-desk');
  }
});
