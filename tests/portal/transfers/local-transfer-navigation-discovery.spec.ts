import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from '../../../pages/portal/LoginPage.js';
import { DashboardPage } from '../../../pages/portal/DashboardPage.js';

const evidenceDir = path.resolve('reports', 'system-walkthrough', 'transfers-local-transfer');

async function captureStep(page, name) {
  fs.mkdirSync(evidenceDir, { recursive: true });

  const screenshotPath = path.join(evidenceDir, `${name}.png`);
  const domPath = path.join(evidenceDir, `${name}.json`);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const evidence = await page.locator('body').evaluate((body) =>
    Array.from(body.querySelectorAll('a,button,input,textarea,select,[role],label,div,span'))
      .map((element) => {
        const htmlElement = element as HTMLElement;
        const text = (htmlElement.innerText || element.textContent || element.getAttribute('placeholder') || '')
          .replace(/\s+/g, ' ')
          .trim();

        return {
          tag: element.tagName.toLowerCase(),
          id: element.getAttribute('id'),
          name: element.getAttribute('name'),
          formControlName: element.getAttribute('formcontrolname'),
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          href: element.getAttribute('href'),
          type: element.getAttribute('type'),
          placeholder: element.getAttribute('placeholder'),
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          text,
          className: element.getAttribute('class'),
        };
      })
      .filter((entry) => entry.text || entry.href || entry.ariaLabel || entry.placeholder || entry.formControlName || entry.name || entry.id)
      .filter((entry) => /transfer|local|saib|beneficiary|account|amount|reason|schedule|currency|from|to|add new/i.test(
        `${entry.text} ${entry.href ?? ''} ${entry.ariaLabel ?? ''} ${entry.placeholder ?? ''} ${entry.formControlName ?? ''} ${entry.name ?? ''} ${entry.id ?? ''} ${entry.className ?? ''}`
      ))
      .slice(0, 250)
  );

  fs.writeFileSync(domPath, JSON.stringify({ url: page.url(), evidence }, null, 2));
  console.log(`DISCOVERY_STEP ${name} ${page.url()}`);
  console.log(JSON.stringify(evidence.slice(0, 80), null, 2));
}

async function clickIfVisible(page, locator, label) {
  const count = await locator.count().catch(() => 0);

  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    const visible = await candidate.isVisible().catch(() => false);

    if (visible) {
      console.log(`DISCOVERY_CLICK ${label} candidate=${index}`);
      await candidate.click();
      return true;
    }
  }

  console.log(`DISCOVERY_MISSING ${label}`);
  return false;
}

async function waitForTransferDetailOrStableSelector(page) {
  await Promise.race([
    page.waitForURL(/local-transfers\/.+|another-saib|saib-account/i, { timeout: 15000 }).catch(() => undefined),
    page
      .getByText(/from account|source account|beneficiary|transfer amount|reason for transfer|add new/i)
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => undefined),
  ]);

  await page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
}

test('system walkthrough - Transfers to Local Transfers to Another SAIB Account', async ({ page }, testInfo) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, testInfo);
  await dashboardPage.expectLoaded(testInfo);

  await captureStep(page, '01-dashboard-after-login');

  await clickIfVisible(
    page,
    page
      .getByRole('button', { name: /^transfers$/i })
      .or(page.getByRole('link', { name: /transfers/i }))
      .or(page.locator('.p-panelmenu-header-link[href="#/transfers"]')),
    'Transfers'
  );
  await captureStep(page, '02-after-transfers-click');

  await page
    .getByRole('button', { name: /local transfers/i })
    .or(page.locator('.transfer-card').filter({ hasText: /local transfers/i }))
    .first()
    .waitFor({ state: 'visible', timeout: 30000 });

  await clickIfVisible(
    page,
    page
      .getByRole('button', { name: /local transfers/i })
      .or(page.getByRole('link', { name: /local transfers/i }))
      .or(page.getByText(/local transfers/i)),
    'Local Transfers'
  );
  await captureStep(page, '03-after-local-transfers-click');

  await clickIfVisible(
    page,
    page
      .getByRole('button', { name: /to another saib account/i })
      .or(page.getByRole('link', { name: /to another saib account/i }))
      .or(page.getByText(/to another saib account/i)),
    'To Another SAIB Account'
  );
  await waitForTransferDetailOrStableSelector(page);
  await captureStep(page, '04-after-to-another-saib-account-click');

  await clickIfVisible(page, page.locator('.account-selector').filter({ hasText: /select source account/i }), 'From Account selector');
  await captureStep(page, '05-from-account-selector-opened');
  await page.keyboard.press('Escape').catch(() => {});

  await clickIfVisible(page, page.locator('.add-new-link').or(page.getByText(/^add new$/i)), 'Add New beneficiary');
  await captureStep(page, '06-add-new-beneficiary-opened');
  await page.keyboard.press('Escape').catch(() => {});

  await clickIfVisible(page, page.getByRole('combobox', { name: /select a reason/i }), 'Reason of Transfer');
  await captureStep(page, '07-reason-selector-opened');
  await page.keyboard.press('Escape').catch(() => {});

  await clickIfVisible(page, page.getByRole('button', { name: /^schedule$/i }), 'Schedule transfer');
  await captureStep(page, '08-schedule-transfer-selected');

  await clickIfVisible(page, page.getByRole('button', { name: /^recurring$/i }), 'Recurring transfer');
  await captureStep(page, '09-recurring-transfer-selected');
});
