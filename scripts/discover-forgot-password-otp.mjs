/**
 * Forgot Password OTP Screen Discovery Script
 * Navigates via login page → Forgot Password → fills form → captures OTP screen.
 * Does NOT complete the password reset.
 */
import { chromium } from 'playwright';
import { expect as playwrightExpect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

const BASE_URL    = process.env.PORTAL_BASE_URL    ?? '';
const LOGIN_PATH  = process.env.PORTAL_LOGIN_PATH  ?? '';
const FP_USERNAME = process.env.FORGOT_PASSWORD_USERNAME ?? '';
const FP_NATIONAL_ID = process.env.FORGOT_PASSWORD_NATIONAL_ID ?? '';
const OUT_DIR = path.resolve('reports/system-walkthrough/forgot-password');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const snap = async (page, name, desc) => {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[SNAP] ${desc} → ${file}`);
};

const dumpElements = async (page, label) => {
  const els = await page.evaluate(() =>
    [...document.querySelectorAll('input,button,a,label,[role="button"],[role="checkbox"],p-checkbox')]
      .map(el => ({
        tag: el.tagName, type: el.type ?? '',
        text: (el.innerText ?? '').trim().slice(0, 100),
        placeholder: el.getAttribute('placeholder') ?? '',
        fcn: el.getAttribute('formcontrolname') ?? '',
        ariaLabel: el.getAttribute('aria-label') ?? '',
        id: el.id ?? '',
        cls: (el.className ?? '').slice(0, 80),
        disabled: el.disabled ?? false,
      }))
  );
  console.log(`\n[${label}]:`, JSON.stringify(els, null, 2));
};

const dumpFormHTML = async (page, label) => {
  const html = await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')].map(f => f.outerHTML.slice(0, 6000));
    return forms.length ? forms : [document.querySelector('main,app-root,[class*="container"]')?.outerHTML?.slice(0, 8000) ?? ''];
  });
  console.log(`\n[${label} HTML]:`, JSON.stringify(html, null, 2));
};

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

try {
  // 1. Login page
  await page.goto(`${BASE_URL}${LOGIN_PATH}`, { waitUntil: 'networkidle' });
  await snap(page, '01-login-page', 'Login page');

  // 2. Click Forgot Password button
  const fpBtn = page.getByRole('button', { name: /forgot\s*password/i });
  await playwrightExpect(fpBtn).toBeVisible();
  await fpBtn.click();
  await page.waitForURL(/forget-password/, { timeout: 15000 });
  await snap(page, '02-forgot-password-form', 'Forgot Password form');

  // 3. Fill username
  const usernameInput = page.getByPlaceholder(/enter your username/i);
  await playwrightExpect(usernameInput).toBeVisible();
  await usernameInput.fill(FP_USERNAME);

  // 4. Fill national ID
  const nationalIdInput = page.getByPlaceholder(/enter your national id/i);
  await playwrightExpect(nationalIdInput).toBeVisible();
  await nationalIdInput.fill(FP_NATIONAL_ID);

  // 5. Wait for the Send OTP button to become enabled (Angular reactive form validation)
  const sendOtpBtn = page.getByRole('button', { name: /send\s*otp/i });
  await playwrightExpect(sendOtpBtn).toBeEnabled({ timeout: 10000 });
  await snap(page, '03-fp-form-filled', 'FP form filled — Send OTP enabled');
  console.log('[DISCOVER] Clicking Send OTP...');
  await sendOtpBtn.click();

  // 6. Wait for OTP screen to appear
  await page.waitForLoadState('networkidle').catch(() => {});

  // Poll for OTP-related content or URL change
  await page.waitForFunction(
    () => window.location.href.includes('otp') ||
          window.location.href.includes('verify') ||
          document.body.innerText.includes('OTP') ||
          document.body.innerText.includes('One Time'),
    { timeout: 20000 }
  ).catch(() => console.log('[DISCOVER] OTP screen signal timeout — capturing anyway.'));

  await snap(page, '04-otp-screen', 'OTP entry screen');
  console.log('[URL AFTER SEND OTP]:', page.url());

  const otpText = await page.evaluate(() => document.body.innerText.trim().slice(0, 3000));
  console.log('[OTP SCREEN TEXT]:', otpText);
  await dumpElements(page, 'OTP SCREEN');
  await dumpFormHTML(page, 'OTP SCREEN');

} catch (err) {
  console.error('[DISCOVER ERROR]:', err.message);
  await snap(page, '99-error', 'Error state');
} finally {
  await browser.close();
  console.log('[DISCOVER DONE] Screenshots:', OUT_DIR);
}
