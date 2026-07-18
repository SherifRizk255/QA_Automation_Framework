import { chromium, type Locator, type Page } from '@playwright/test';
import { ENV } from '../../../config/resources.ts';
import { DashboardPage } from '../../../pages/portal-pages/DashboardPage.ts';
import { LoginPage } from '../../../pages/portal-pages/LoginPage.ts';
import fs from 'node:fs';
import path from 'node:path';

const evidenceDir = path.resolve(
  'reports',
  'system-walkthrough',
  'transfers-local-transfer'
);

async function captureStep(page: Page, name: string): Promise<void> {
  fs.mkdirSync(evidenceDir, { recursive: true });

  const screenshotPath = path.join(evidenceDir, `${name}.png`);
  const domPath = path.join(evidenceDir, `${name}.json`);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const evidence = await page.locator('body').evaluate((body: HTMLElement) =>
    Array.from(
      body.querySelectorAll(
        'a,button,input,textarea,select,[role],label,div,span'
      )
    )
      .map((element) => {
        const htmlElement = element as HTMLElement;
        const text = (
          htmlElement.innerText ||
          element.textContent ||
          element.getAttribute('placeholder') ||
          ''
        )
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
          disabled:
            element.hasAttribute('disabled') ||
            element.getAttribute('aria-disabled') === 'true',
          text,
          className: element.getAttribute('class'),
        };
      })
      .filter(
        (entry) =>
          entry.text ||
          entry.href ||
          entry.ariaLabel ||
          entry.placeholder ||
          entry.formControlName ||
          entry.name ||
          entry.id
      )
      .filter((entry) =>
        /transfer|local|saib|beneficiary|account|amount|reason|schedule|currency|from|to|add new/i.test(
          `${entry.text} ${entry.href ?? ''} ${entry.ariaLabel ?? ''} ${entry.placeholder ?? ''} ${entry.formControlName ?? ''} ${entry.name ?? ''} ${entry.id ?? ''} ${entry.className ?? ''}`
        )
      )
      .slice(0, 250)
  );

  fs.writeFileSync(
    domPath,
    JSON.stringify({ url: page.url(), evidence }, null, 2)
  );
  console.log(`DISCOVERY_STEP ${name} ${page.url()}`);
  console.log(JSON.stringify(evidence.slice(0, 80), null, 2));
}

async function clickIfVisible(
  locator: Locator,
  label: string
): Promise<boolean> {
  const count = await locator.count();

  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);

    if (await candidate.isVisible()) {
      console.log(`DISCOVERY_CLICK ${label} candidate=${index}`);
      await candidate.click();
      return true;
    }
  }

  console.log(`DISCOVERY_MISSING ${label}`);
  return false;
}

async function waitForTransferDetailOrStableSelector(
  page: Page
): Promise<void> {
  await page.waitForFunction(
    () =>
      /local-transfers\/.+|another-saib|saib-account/i.test(
        window.location.href
      ) ||
      /from account|source account|beneficiary|transfer amount|reason for transfer|add new/i.test(
        document.body.innerText
      ),
    undefined,
    { timeout: 15_000 }
  );

  await page.locator('body').waitFor({ state: 'visible', timeout: 15_000 });
}

async function runLocalTransferNavigationDiscovery(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login(ENV.portal.username, ENV.portal.password);
  await dashboardPage.expectLoaded();

  await captureStep(page, '01-dashboard-after-login');

  await clickIfVisible(
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
    .waitFor({ state: 'visible', timeout: 30_000 });

  await clickIfVisible(
    page
      .getByRole('button', { name: /local transfers/i })
      .or(page.getByRole('link', { name: /local transfers/i }))
      .or(page.getByText(/local transfers/i)),
    'Local Transfers'
  );
  await captureStep(page, '03-after-local-transfers-click');

  await clickIfVisible(
    page
      .getByRole('button', { name: /to another saib account/i })
      .or(page.getByRole('link', { name: /to another saib account/i }))
      .or(page.getByText(/to another saib account/i)),
    'To Another SAIB Account'
  );
  await waitForTransferDetailOrStableSelector(page);
  await captureStep(page, '04-after-to-another-saib-account-click');

  await clickIfVisible(
    page
      .locator('.account-selector')
      .filter({ hasText: /select source account/i }),
    'From Account selector'
  );
  await captureStep(page, '05-from-account-selector-opened');
  await page.keyboard.press('Escape');

  await clickIfVisible(
    page.locator('.add-new-link').or(page.getByText(/^add new$/i)),
    'Add New beneficiary'
  );
  await captureStep(page, '06-add-new-beneficiary-opened');
  await page.keyboard.press('Escape');

  await clickIfVisible(
    page.getByRole('combobox', { name: /select a reason/i }),
    'Reason of Transfer'
  );
  await captureStep(page, '07-reason-selector-opened');
  await page.keyboard.press('Escape');

  await clickIfVisible(
    page.getByRole('button', { name: /^schedule$/i }),
    'Schedule transfer'
  );
  await captureStep(page, '08-schedule-transfer-selected');

  await clickIfVisible(
    page.getByRole('button', { name: /^recurring$/i }),
    'Recurring transfer'
  );
  await captureStep(page, '09-recurring-transfer-selected');
}

async function main(): Promise<void> {
  const browser = await chromium.launch({
    headless: false,
    timeout: 30_000,
    args: ['--start-maximized'],
    slowMo: 1_000,
  });

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: null,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    await runLocalTransferNavigationDiscovery(page);
  } finally {
    await browser.close();
  }
}

await main();
