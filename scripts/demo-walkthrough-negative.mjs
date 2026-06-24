/**
 * Stage 2 — System Walkthrough: Forgot Password Negative Scenarios
 * Navigates to the Forgot Password screen, inspects locators, and captures screenshots.
 * Run: node scripts/demo-walkthrough-negative.mjs
 */

import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const BASE_URL  = process.env.PORTAL_BASE_URL  ?? '';
const LOGIN_PATH = process.env.PORTAL_LOGIN_PATH ?? '';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'reports', 'system-walkthrough', 'forgot-password-negative');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page    = await context.newPage();

async function shot(name) {
  const p = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  [screenshot] ${name}.png`);
  return p;
}

console.log('\n=== Stage 2: Forgot Password Negative Walkthrough ===\n');

// 1. Login page
console.log('[1] Loading login page...');
await page.goto(`${BASE_URL}${LOGIN_PATH}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await shot('01-login-page');

// Handle active session dialog if present
const dialog = page.getByRole('alertdialog').filter({ hasText: /active session/i }).last();
const dialogVisible = await dialog.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
if (dialogVisible) {
  console.log('[1a] Active session dialog visible — dismissing...');
  await shot('01b-active-session-dialog');
  const proceedBtn = dialog.getByRole('button', { name: /proceed|ok|yes|continue/i });
  await proceedBtn.click();
  await page.waitForTimeout(1000);
  await shot('01c-after-dismiss-active-session');
}

// 2. Click Forgot Password
console.log('[2] Clicking Forgot Password...');
const fpBtn = page.getByRole('button', { name: /forgot.*password/i });
await fpBtn.waitFor({ state: 'visible', timeout: 15000 });
await shot('02-login-page-with-fp-button');
await fpBtn.click();
await page.waitForURL(/forget-password/, { timeout: 15000 });

// 3. Forgot Password form — initial state (both fields empty)
console.log('[3] Forgot Password form loaded...');
await page.waitForTimeout(1000);
await shot('03-fp-form-empty');

const url = page.url();
console.log(`  URL: ${url}`);

// 4. Inspect locators
const username = page.getByPlaceholder(/enter your username/i);
const nationalId = page.getByPlaceholder(/enter your national id/i);
const sendOtpBtn = page.getByRole('button', { name: /send\s*otp/i });
const backLink   = page.getByRole('link', { name: /back/i }).first();

console.log(`  Username visible:   ${await username.isVisible()}`);
console.log(`  NationalID visible: ${await nationalId.isVisible()}`);
console.log(`  SendOTP visible:    ${await sendOtpBtn.isVisible()}`);
console.log(`  SendOTP enabled:    ${await sendOtpBtn.isEnabled()}`);
console.log(`  Back link visible:  ${await backLink.isVisible()}`);

// 5. NEG state: fill username only → button still disabled?
console.log('[5] Filling username only...');
await username.fill('TestUser');
await page.waitForTimeout(500);
await shot('05-username-only-filled');
console.log(`  SendOTP enabled after username only: ${await sendOtpBtn.isEnabled()}`);

// 6. NEG state: fill both fields → button becomes enabled
console.log('[6] Filling National ID (invalid format)...');
await nationalId.fill('00000000000000');
await page.waitForTimeout(500);
await shot('06-both-fields-filled-invalid');
console.log(`  SendOTP enabled after both filled: ${await sendOtpBtn.isEnabled()}`);

// 7. Click Send OTP with invalid creds → observe error
console.log('[7] Clicking Send OTP with invalid credentials...');
if (await sendOtpBtn.isEnabled()) {
  await sendOtpBtn.click();
  await page.waitForTimeout(3000);
  await shot('07-invalid-creds-error');
  const toast = page.locator('.p-toast-message-error, .p-toast .p-toast-message').first();
  const toastVisible = await toast.isVisible().catch(() => false);
  console.log(`  Toast/error visible: ${toastVisible}`);
}

// 8. Verify URL unchanged
console.log('[8] Checking URL after error...');
console.log(`  URL after error: ${page.url()}`);
await shot('08-url-after-error');

// 9. Verify no password reset form visible
console.log('[9] Checking password reset form visibility...');
const resetPwdInput = page.locator('input[type="password"]').first();
const resetPwdVisible = await resetPwdInput.isVisible().catch(() => false);
console.log(`  Password reset input visible: ${resetPwdVisible}`);
await shot('09-no-password-reset-form');

// 10. Clear fields, re-fill valid username only → button disabled
console.log('[10] Clear and re-test empty username scenario...');
await username.fill('');
await nationalId.fill('');
await page.waitForTimeout(500);
await shot('10-both-fields-cleared');
console.log(`  SendOTP enabled (both empty): ${await sendOtpBtn.isEnabled()}`);

await nationalId.fill('12345678901234');
await page.waitForTimeout(300);
console.log(`  SendOTP enabled (NID only): ${await sendOtpBtn.isEnabled()}`);
await shot('10b-nid-only-filled');

console.log('\n=== Walkthrough Complete ===');
console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

await browser.close();
