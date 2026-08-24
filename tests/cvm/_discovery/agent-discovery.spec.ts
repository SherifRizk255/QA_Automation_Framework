import { test, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * THROWAWAY discovery (skill 02) — Agent Portal serving flow.
 * Creates one Operations ticket via the Kiosk (Teller3), then logs into the
 * Agent Portal as CS2 (Operations agent) and captures the full serving flow,
 * including PrimeNG confirm/dialogs. Two contexts = isolated sessions.
 */

const DIR = path.resolve('reports', 'system-walkthrough', 'cvm', 'agent');
fs.mkdirSync(DIR, { recursive: true });

const KIOSK_URL = process.env.CVM_KIOSK_URL!;
const KIOSK_USER = process.env.CVM_KIOSK_USERNAME!;
const KIOSK_PASS = process.env.CVM_KIOSK_PASSWORD!;
const AGENT_URL = process.env.CVM_AGENT_URL!;
const AGENT_USER = process.env.CVM_AGENT_OPS_USERNAME!; // CS2
const AGENT_PASS = process.env.CVM_AGENT_PASSWORD!;

test.use({ headless: false, viewport: null, launchOptions: { slowMo: 500, args: ['--start-maximized'] } });

async function capture(page: Page, name: string) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true }).catch(() => {});
  const inv = await page.evaluate(() => {
    const t = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const visible = (el: Element) => (el as HTMLElement).offsetParent !== null || (el as HTMLElement).getClientRects().length > 0;
    return {
      url: location.href,
      headings: [...new Set(Array.from(document.querySelectorAll('h1,h2,h3,h4,.p-card-title')).map(t).filter(Boolean))],
      buttons: Array.from(document.querySelectorAll('button')).map((b) => ({ text: t(b), aria: b.getAttribute('aria-label'), disabled: (b as HTMLButtonElement).disabled })).filter((b) => b.text || b.aria),
      dialogs: Array.from(document.querySelectorAll('.p-dialog, .p-confirmdialog .p-confirm-dialog, .p-confirm-dialog')).filter(visible).map((d) => ({
        text: t(d).slice(0, 400),
        buttons: Array.from(d.querySelectorAll('button')).map((b) => ({ text: t(b), cls: b.className })),
        options: Array.from(d.querySelectorAll('[role=option], .p-multiselect-item, li')).map(t).filter(Boolean).slice(0, 30),
      })),
      bodyText: (document.body.innerText || '').replace(/\n{2,}/g, '\n').trim().slice(0, 2500),
    };
  });
  fs.writeFileSync(path.join(DIR, `${name}.json`), JSON.stringify(inv, null, 2));
  console.log(`\n===== [${name}] ${inv.url} =====`);
  console.log('headings:', JSON.stringify(inv.headings));
  console.log('buttons:', JSON.stringify(inv.buttons));
  if (inv.dialogs.length) console.log('DIALOGS:', JSON.stringify(inv.dialogs, null, 1));
}

async function acceptConfirm(page: Page, tag: string) {
  const accept = page.locator('.p-confirm-dialog-accept');
  if (await accept.count()) {
    const txt = (await page.locator('.p-confirmdialog, .p-confirm-dialog').first().innerText().catch(() => '')).replace(/\s+/g, ' ');
    console.log(`>>> confirm[${tag}] ACCEPT — "${txt.slice(0, 160)}"`);
    await accept.first().click();
    await page.waitForTimeout(800);
  } else {
    console.log(`>>> confirm[${tag}] none`);
  }
}

async function createOperationsTicket(ctx: BrowserContext): Promise<string> {
  const page = await ctx.newPage();
  await page.goto(KIOSK_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('form input').nth(0).fill(KIOSK_USER);
  await page.locator('input[type="password"]').fill(KIOSK_PASS);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('button', { name: /english/i }).click();
  const mobile = '010' + Math.floor(10_000_000 + Math.random() * 89_999_999).toString();
  for (const d of mobile) await page.getByRole('button', { name: d, exact: true }).first().click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Operations', exact: true }).click();
  await page.getByRole('heading', { name: 'Select your sub-services' }).waitFor({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Transfers', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Printed ticket', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.getByText(/Your Number/i).waitFor({ timeout: 20_000 });
  const ticket = ((await page.locator('body').innerText()).match(/\b([A-Z]-\d+)\b/) || [])[1] ?? '(none)';
  console.log(`\n>>> KIOSK created Operations ticket: ${ticket}`);
  return ticket;
}

test('agent discovery — serve one Operations ticket end to end', async ({ browser }) => {
  test.setTimeout(200_000);

  // Agent-only: serve a ticket already queued from earlier runs (avoid kiosk desk login throttle).
  const ticket = '(existing queued O- ticket)';

  const agentCtx = await browser.newContext({ viewport: null });
  const agent = await agentCtx.newPage();
  await agent.goto(AGENT_URL, { waitUntil: 'domcontentloaded' });
  await agent.locator('form input').nth(0).fill(AGENT_USER);
  await agent.locator('input[type="password"]').fill(AGENT_PASS);
  await agent.getByRole('button', { name: /sign in|login/i }).click();
  await agent.getByRole('button', { name: 'Confirm', exact: true }).click(); // desk-assignment confirm
  await capture(agent, 'agent-02-home');

  // If no current customer, call Next; otherwise finish the one already current.
  if (await agent.getByText(/No tickets to serve/i).count()) {
    await agent.getByRole('button', { name: 'Next', exact: true }).click();
    await acceptConfirm(agent, 'call-next');
    await capture(agent, 'agent-03-serving');
  }

  // Ticket Served → "Done/Routing" dialog → Done card.
  await agent.getByRole('button', { name: 'Ticket Served', exact: true }).click();
  await agent.locator('.p-dialog').getByText('Done', { exact: true }).click();

  // "summary of services" dialog: pick a done sub-service, then Confirm.
  const summary = agent.locator('.p-dialog').filter({ hasText: /summary of services/i });
  await summary.locator('.p-multiselect').click();
  await capture(agent, 'agent-07-subservice-panel');
  await agent.locator('.p-multiselect-panel .p-multiselect-item, .p-multiselect-items li').first().click();
  await agent.keyboard.press('Escape');
  await capture(agent, 'agent-08-subservice-picked');
  await summary.getByRole('button', { name: 'Confirm', exact: true }).click();
  await capture(agent, 'agent-09-after-confirm');
  await acceptConfirm(agent, 'final');
  await capture(agent, 'agent-10-idle');

  console.log(`\n>>> full serve flow captured (queue ref ${ticket})`);
});
