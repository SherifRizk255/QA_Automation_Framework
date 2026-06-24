/**
 * Forgot Password Discovery Script
 * Purpose: Inspect the portal forgot password flow and capture screenshots.
 * This script is non-destructive — it does NOT submit any real form data.
 * Run: node scripts/discover-forgot-password.mjs
 */
import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

const BASE_URL = process.env.PORTAL_BASE_URL ?? '';
const LOGIN_PATH = process.env.PORTAL_LOGIN_PATH ?? '';
const OUT_DIR = path.resolve('reports/system-walkthrough/forgot-password');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const snap = async (page, name, description) => {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[SNAP] ${description} → ${file}`);
  return file;
};

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

try {
  // ── Step 1: Open login page ──────────────────────────────────────────────
  const loginUrl = `${BASE_URL}${LOGIN_PATH}`;
  console.log(`[DISCOVER] Navigating to: ${loginUrl}`);
  await page.goto(loginUrl, { waitUntil: 'networkidle' });
  await snap(page, '01-login-page', 'Login page');

  // Print all visible text to understand the page structure
  const loginPageText = await page.evaluate(() => document.body.innerText.trim().substring(0, 2000));
  console.log('[LOGIN PAGE TEXT]:', loginPageText);

  // Print all links and buttons
  const loginPageElements = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('a, button, input, [role="button"], [role="link"]').forEach(el => {
      items.push({
        tag: el.tagName,
        type: el.getAttribute('type') ?? '',
        text: el.innerText?.trim().substring(0, 80) ?? '',
        placeholder: el.getAttribute('placeholder') ?? '',
        href: el.getAttribute('href') ?? '',
        ariaLabel: el.getAttribute('aria-label') ?? '',
        id: el.id ?? '',
        name: el.getAttribute('name') ?? '',
        className: el.className?.substring(0, 60) ?? '',
      });
    });
    return items;
  });
  console.log('[LOGIN PAGE ELEMENTS]:', JSON.stringify(loginPageElements, null, 2));

  // ── Step 2: Find and click Forgot Password ────────────────────────────────
  const forgotSelectors = [
    page.getByRole('link', { name: /forgot.*password|forgot password/i }),
    page.getByRole('button', { name: /forgot.*password|forgot password/i }),
    page.getByText(/forgot.*password/i).first(),
    page.locator('a[href*="forgot"]').first(),
    page.locator('[class*="forgot"]').first(),
  ];

  let forgotClicked = false;
  for (const sel of forgotSelectors) {
    const visible = await sel.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      console.log('[DISCOVER] Found Forgot Password link/button — clicking.');
      await sel.click();
      forgotClicked = true;
      break;
    }
  }

  if (!forgotClicked) {
    console.warn('[DISCOVER] Could not find Forgot Password link. Capturing current state.');
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  await snap(page, '02-forgot-password-screen', 'Forgot Password screen (or state after click)');

  // Print current URL
  console.log('[URL AFTER FP CLICK]:', page.url());

  // Print all form elements
  const fpElements = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('input, button, a, label, select, textarea, [role="button"]').forEach(el => {
      items.push({
        tag: el.tagName,
        type: el.getAttribute('type') ?? '',
        text: el.innerText?.trim().substring(0, 80) ?? '',
        placeholder: el.getAttribute('placeholder') ?? '',
        ariaLabel: el.getAttribute('aria-label') ?? '',
        id: el.id ?? '',
        name: el.getAttribute('name') ?? '',
        forAttr: el.getAttribute('for') ?? '',
        className: el.className?.substring(0, 80) ?? '',
        value: el.tagName === 'INPUT' ? '***masked***' : '',
      });
    });
    return items;
  });
  console.log('[FP SCREEN ELEMENTS]:', JSON.stringify(fpElements, null, 2));

  // Print full HTML snippet of forms
  const formHtml = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const result = [];
    forms.forEach(f => result.push(f.outerHTML.substring(0, 3000)));
    if (!result.length) {
      // Try main content area
      const main = document.querySelector('main, [role="main"], .content, .container, app-root');
      if (main) result.push(main.outerHTML.substring(0, 5000));
    }
    return result;
  });
  console.log('[FORM HTML]:', JSON.stringify(formHtml, null, 2));

} catch (err) {
  console.error('[DISCOVER ERROR]:', err.message);
  await snap(page, '99-error-state', 'Error state');
} finally {
  await browser.close();
  console.log('[DISCOVER] Done. Screenshots in:', OUT_DIR);
}
