/**
 * Discover step 2 (OTP input) and step 3 (password reset) of the Forgot Password flow.
 */
import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

const BASE_URL    = process.env.PORTAL_BASE_URL ?? '';
const LOGIN_PATH  = process.env.PORTAL_LOGIN_PATH ?? '';
const FP_USERNAME = process.env.FORGOT_PASSWORD_USERNAME ?? '';
const FP_NATIONAL_ID = process.env.FORGOT_PASSWORD_NATIONAL_ID ?? '';
const OUT_DIR = path.resolve('reports/system-walkthrough/forgot-password');

fs.mkdirSync(OUT_DIR, { recursive: true });

const snap = async (page, name, desc) => {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[SNAP] ${desc} → ${file}`);
};

const dumpAll = async (page, label) => {
  const url = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText.trim().slice(0, 3000));
  const els = await page.evaluate(() =>
    [...document.querySelectorAll('input,button,[role="button"],[role="checkbox"]')]
      .map(el => ({
        tag: el.tagName, type: el.type ?? '',
        text: (el.innerText ?? '').trim().slice(0, 80),
        placeholder: el.getAttribute('placeholder') ?? '',
        fcn: el.getAttribute('formcontrolname') ?? '',
        id: el.id ?? '',
        disabled: el.disabled ?? false,
        cls: (el.className ?? '').slice(0, 100),
      }))
  );
  console.log(`\n===== ${label} =====`);
  console.log('[URL]:', url);
  console.log('[TEXT]:', bodyText);
  console.log('[ELEMENTS]:', JSON.stringify(els, null, 2));

  const formHtml = await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')].map(f => f.outerHTML.slice(0, 8000));
    return forms.length ? forms : [document.querySelector('app-root')?.outerHTML?.slice(0, 10000) ?? ''];
  });
  console.log('[FORM HTML]:', JSON.stringify(formHtml, null, 2));
};

const browser = await chromium.launch({ headless: false, slowMo: 200 });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// Capture all console messages from the page
page.on('console', msg => console.log(`[PAGE ${msg.type().toUpperCase()}]`, msg.text()));
page.on('response', resp => {
  if (!resp.url().includes('node_modules') && !resp.url().includes('.css') && !resp.url().includes('.js'))
    console.log(`[NETWORK] ${resp.status()} ${resp.url().slice(0, 120)}`);
});

try {
  await page.goto(`${BASE_URL}${LOGIN_PATH}`, { waitUntil: 'networkidle' });
  console.log('[STEP 1] Login page loaded');

  // Click Forgot Password
  const fpBtn = page.getByRole('button', { name: /forgot\s*password/i });
  await expect(fpBtn).toBeVisible();
  await fpBtn.click();
  await page.waitForURL(/forget-password/, { timeout: 10000 });
  console.log('[STEP 2] Forgot Password page loaded');

  // Fill form
  const usernameInput = page.getByPlaceholder(/enter your username/i);
  await expect(usernameInput).toBeVisible();
  await usernameInput.fill(FP_USERNAME);

  const nationalIdInput = page.getByPlaceholder(/enter your national id/i);
  await expect(nationalIdInput).toBeVisible();
  await nationalIdInput.fill(FP_NATIONAL_ID);

  // Wait for button to be enabled
  const sendOtpBtn = page.getByRole('button', { name: /send\s*otp/i });
  await expect(sendOtpBtn).toBeEnabled({ timeout: 10000 });

  console.log('[STEP 3] Clicking Send OTP');
  await sendOtpBtn.click();

  // Wait for DOM to change - watch for something new to appear
  // Option 1: new input appears (OTP field)
  // Option 2: a notification/toast appears
  // Option 3: success message appears

  console.log('[STEP 3b] Waiting for page transition after Send OTP...');

  // Wait up to 15 seconds monitoring for DOM changes
  let previousBodyText = await page.evaluate(() => document.body.innerText);
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const currentBodyText = await page.evaluate(() => document.body.innerText);
    if (currentBodyText !== previousBodyText) {
      console.log(`[STEP 3c] DOM changed after ${i+1} seconds`);
      previousBodyText = currentBodyText;
    }
    const url = page.url();
    console.log(`[STEP 3c] t+${i+1}s url=${url} bodySnippet="${currentBodyText.slice(0, 200).replace(/\n/g,' ')}"`);

    // Check if OTP input field appeared
    const hasOtpInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const text = document.body.innerText;
      return {
        inputCount: inputs.length,
        hasOtpWord: text.includes('OTP') || text.includes('One Time') || text.includes('verification code'),
        hasNewForm: document.querySelectorAll('form').length > 0,
        formInputPlaceholders: [...inputs].map(i => i.getAttribute('placeholder')),
        url: window.location.href,
      };
    });
    console.log('[STEP 3c] state:', JSON.stringify(hasOtpInput));

    // Stop when we see a meaningful change
    if (hasOtpInput.inputCount !== 2 || hasOtpInput.url !== page.url()) {
      break;
    }
  }

  await snap(page, '05-after-send-otp', 'State after Send OTP (15s)');
  await dumpAll(page, 'AFTER SEND OTP');

} catch (err) {
  console.error('[DISCOVER ERROR]:', err.message);
  await snap(page, '99-error', 'Error state');
} finally {
  await browser.close();
  console.log('[DISCOVER DONE] Screenshots:', OUT_DIR);
}
