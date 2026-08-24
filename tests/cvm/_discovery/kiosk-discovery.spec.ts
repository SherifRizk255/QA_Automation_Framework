import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { CVM } from '../../../config/resources';
import { buildCustomerJourneys } from '../../../data/cvm/distribution';
import { KioskJourneyPage } from '../../../pages/cvm/kiosk/KioskJourneyPage';
import { KioskLoginPage } from '../../../pages/cvm/kiosk/KioskLoginPage';

/**
 * THROWAWAY discovery script (skill 02 — System Walkthrough).
 * Logs into the live Kiosk Portal with .env credentials and creates the number
 * of unserved tickets configured by CVM_CUSTOMER_COUNT (8 when blank).
 * Set CVM_KIOSK_CAPTURE_EVIDENCE=true only when per-screen discovery evidence
 * is needed; normal ticket-generation runs skip that expensive I/O.
 *
 * This script intentionally never opens the Agent Portal, so issued tickets
 * remain queued and unserved for later agent-side testing.
 */

const EVIDENCE_DIR = path.resolve('reports', 'system-walkthrough', 'cvm', 'kiosk');
const CAPTURE_DISCOVERY_EVIDENCE = process.env.CVM_KIOSK_CAPTURE_EVIDENCE?.trim().toLowerCase() === 'true';

if (CAPTURE_DISCOVERY_EVIDENCE) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

// Keep the run watchable without delaying every Playwright action.
test.use({
  headless: false,
  viewport: null,
  launchOptions: { args: ['--start-maximized'] },
});

async function capture(page: Page, name: string) {
  if (!CAPTURE_DISCOVERY_EVIDENCE) return;

  await page.locator('body').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, `${name}.png`), fullPage: true });

  const inventory = await page.evaluate(() => {
    const txt = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const buttons = Array.from(document.querySelectorAll('button'))
      .map((b) => ({ text: txt(b), aria: b.getAttribute('aria-label'), disabled: (b as HTMLButtonElement).disabled }))
      .filter((b) => b.text || b.aria);
    const inputs = Array.from(document.querySelectorAll('input,textarea')).map((i) => ({
      type: i.getAttribute('type'),
      placeholder: i.getAttribute('placeholder'),
      aria: i.getAttribute('aria-label'),
      name: i.getAttribute('name'),
      id: i.id,
    }));
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,label,.p-card-title')).map(txt).filter(Boolean);
    return {
      url: location.href,
      title: document.title,
      appTag: document.querySelector('app-root > *')?.tagName?.toLowerCase() ?? null,
      headings: [...new Set(headings)],
      buttons,
      inputs,
      bodyText: (document.body.innerText || '').replace(/\n{2,}/g, '\n').trim().slice(0, 4000),
    };
  });

  fs.writeFileSync(path.join(EVIDENCE_DIR, `${name}.json`), JSON.stringify(inventory, null, 2));
  console.log(`\n===== [${name}] ${inventory.url} =====`);
  console.log('appTag:', inventory.appTag, '| title:', inventory.title);
  console.log('headings:', JSON.stringify(inventory.headings));
  console.log('buttons:', JSON.stringify(inventory.buttons));
  console.log('inputs:', JSON.stringify(inventory.inputs));
  console.log('--- bodyText ---\n' + inventory.bodyText);
}

test('kiosk discovery — create configured tickets without agent servicing', async ({ page }, testInfo) => {
  const journeys = buildCustomerJourneys(CVM.customerCount);
  const kioskLogin = new KioskLoginPage(page);
  const kioskJourney = new KioskJourneyPage(page);
  const issuedTickets: Array<{
    customerIndex: number;
    mobileNumber: string;
    mainService: string;
    subService: string;
    ticketNumber: string;
    issuedAt?: string;
  }> = [];

  test.setTimeout(120_000 + journeys.length * 90_000);

  await kioskLogin.goto();
  await capture(page, '00-login');
  await kioskLogin.login(CVM.desk.username, CVM.desk.password);
  await capture(page, '01-language');

  for (const journey of journeys) {
    const evidencePrefix = `customer-${String(journey.customerIndex).padStart(2, '0')}`;

    await kioskJourney.startCustomerJourney();
    await capture(page, `${evidencePrefix}-02-mobile-number`);

    await kioskJourney.enterMobileNumber(journey.mobileNumber);
    await capture(page, `${evidencePrefix}-03-service`);

    await kioskJourney.selectMainService(journey.mainService);
    await capture(page, `${evidencePrefix}-04-subservice`);

    await kioskJourney.selectSubServices([journey.subService]);
    await capture(page, `${evidencePrefix}-05-ticket-format`);

    await kioskJourney.choosePrintedTicket();
    await capture(page, `${evidencePrefix}-06-summary`);

    const ticket = await kioskJourney.generateTicket();
    expect(ticket.number, `customer #${journey.customerIndex} should receive a ${journey.ticketPrefix}- ticket`).toMatch(
      new RegExp(`^${journey.ticketPrefix}-\\d+$`),
    );
    await capture(page, `${evidencePrefix}-07-ticket-issued`);

    issuedTickets.push({
      customerIndex: journey.customerIndex,
      mobileNumber: journey.mobileNumber,
      mainService: journey.mainService,
      subService: journey.subService,
      ticketNumber: ticket.number,
      issuedAt: ticket.issuedAt,
    });
    testInfo.annotations.push({
      type: 'kiosk-ticket-created',
      description: `#${journey.customerIndex} ${journey.mainService} -> ${journey.subService} = ${ticket.number} (left unserved)`,
    });
    console.log(
      `Created unserved ticket ${ticket.number} for customer #${journey.customerIndex}: ${journey.mainService} -> ${journey.subService}`,
    );

    await kioskJourney.returnToMainMenu();
  }

  expect(new Set(issuedTickets.map((ticket) => ticket.ticketNumber)).size, 'every customer received a unique ticket').toBe(
    journeys.length,
  );
  await testInfo.attach('kiosk-issued-tickets', {
    body: Buffer.from(JSON.stringify(issuedTickets, null, 2)),
    contentType: 'application/json',
  });
});
