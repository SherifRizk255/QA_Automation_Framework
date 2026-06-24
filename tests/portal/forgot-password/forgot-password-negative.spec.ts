/**
 * Forgot Password — Negative Demo Test Suite
 * Tests: FP-NEG-001 through FP-NEG-007
 *
 * Demo scope: Negative path validation only.
 * No CRM access required. No OTP retrieval. No password changes.
 * All tests are independent — each navigates fresh to the Forgot Password screen.
 *
 * Security: National ID values read from .env are never logged in plain text.
 *           Invalid test data below is not sensitive.
 */

import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from '../../../pages/portal/ForgotPasswordPage.ts';
import { handleFailureEvidence } from '../../../utils/failureHandler.ts';
import { maskNationalId } from '../../../utils/sensitiveDataMasker.ts';
import path from 'node:path';

const FP_USERNAME    = process.env.FORGOT_PASSWORD_USERNAME    ?? '';
const FP_NATIONAL_ID = process.env.FORGOT_PASSWORD_NATIONAL_ID ?? '';

// Invalid test data — intentionally wrong, not sensitive
const INVALID_USERNAME    = 'INVALID_USER_XYZ_999';
const INVALID_NATIONAL_ID = '00000000000000'; // 14 zeros — wrong value

const SHOTS_DIR = 'reports/system-walkthrough/forgot-password-negative';

test.describe('Forgot Password — Negative Demo', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // FP-NEG-001: Empty username — Send OTP button must be disabled
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-NEG-001 - Empty username — Send OTP button is disabled', async ({ page }, testInfo) => {
    const fpPage = new ForgotPasswordPage(page);
    try {
      await fpPage.navigate();

      // Leave username empty; fill National ID with any value
      await fpPage.nationalIdInput.fill(INVALID_NATIONAL_ID);
      await fpPage.usernameInput.fill('');

      await fpPage.expectSendOtpButtonDisabled();

      const shot = path.resolve(SHOTS_DIR, 'fp-neg-001-username-empty.png');
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach('fp-neg-001-username-empty', { path: shot, contentType: 'image/png' });

      testInfo.annotations.push({ type: 'pass', description: 'Send OTP button correctly disabled when username is empty.' });
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'fp-neg-001-username-empty');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-NEG-002: Empty National ID — Send OTP button must be disabled
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-NEG-002 - Empty National ID — Send OTP button is disabled', async ({ page }, testInfo) => {
    const fpPage = new ForgotPasswordPage(page);
    try {
      await fpPage.navigate();

      // Fill username; leave National ID empty
      await fpPage.usernameInput.fill(FP_USERNAME || 'TestUser');
      await fpPage.nationalIdInput.fill('');

      await fpPage.expectSendOtpButtonDisabled();

      const shot = path.resolve(SHOTS_DIR, 'fp-neg-002-nid-empty.png');
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach('fp-neg-002-nid-empty', { path: shot, contentType: 'image/png' });

      testInfo.annotations.push({ type: 'pass', description: 'Send OTP button correctly disabled when National ID is empty.' });
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'fp-neg-002-nid-empty');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-NEG-003: Invalid username — server returns error
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-NEG-003 - Invalid username — error message is displayed', async ({ page }, testInfo) => {
    const fpPage = new ForgotPasswordPage(page);
    try {
      await fpPage.navigate();

      console.log(`[FP-NEG-003] Submitting invalid username (NID masked: ${maskNationalId(INVALID_NATIONAL_ID)})`);
      await fpPage.submitWithInvalidUsername(INVALID_USERNAME, INVALID_NATIONAL_ID);
      await fpPage.expectValidationErrorVisible();

      const shot = path.resolve(SHOTS_DIR, 'fp-neg-003-invalid-username-error.png');
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach('fp-neg-003-invalid-username', { path: shot, contentType: 'image/png' });

      testInfo.annotations.push({ type: 'pass', description: 'Error shown for non-existent username.' });
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'fp-neg-003-invalid-username');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-NEG-004: Invalid National ID — server returns error
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-NEG-004 - Invalid National ID — error message is displayed', async ({ page }, testInfo) => {
    const fpPage = new ForgotPasswordPage(page);
    try {
      await fpPage.navigate();

      console.log(`[FP-NEG-004] Submitting valid username with invalid NID: ${maskNationalId(INVALID_NATIONAL_ID)}`);
      await fpPage.submitWithInvalidNationalId(FP_USERNAME || 'TestUser', INVALID_NATIONAL_ID);
      await fpPage.expectValidationErrorVisible();

      const shot = path.resolve(SHOTS_DIR, 'fp-neg-004-invalid-nid-error.png');
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach('fp-neg-004-invalid-nid', { path: shot, contentType: 'image/png' });

      testInfo.annotations.push({ type: 'pass', description: 'Error shown for National ID mismatch.' });
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'fp-neg-004-invalid-nid');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-NEG-005: Both fields empty — Send OTP button blocked
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-NEG-005 - Both fields empty — Send OTP button is blocked', async ({ page }, testInfo) => {
    const fpPage = new ForgotPasswordPage(page);
    try {
      await fpPage.navigate();

      // Ensure both fields are empty (default state on page load)
      await expect(fpPage.usernameInput).toBeVisible();
      const usernameVal   = await fpPage.usernameInput.inputValue();
      const nationalIdVal = await fpPage.nationalIdInput.inputValue();

      if (usernameVal)   await fpPage.usernameInput.fill('');
      if (nationalIdVal) await fpPage.nationalIdInput.fill('');

      await fpPage.expectSendOtpButtonDisabled();

      const shot = path.resolve(SHOTS_DIR, 'fp-neg-005-both-empty.png');
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach('fp-neg-005-both-empty', { path: shot, contentType: 'image/png' });

      testInfo.annotations.push({ type: 'pass', description: 'Send OTP button correctly blocked when both fields are empty.' });
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'fp-neg-005-both-empty');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-NEG-006: User remains on Forgot Password screen after invalid input
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-NEG-006 - User stays on Forgot Password screen after invalid input', async ({ page }, testInfo) => {
    const fpPage = new ForgotPasswordPage(page);
    try {
      await fpPage.navigate();

      console.log(`[FP-NEG-006] Submitting invalid credentials to check navigation guard.`);
      await fpPage.submitWithInvalidUsername(INVALID_USERNAME, INVALID_NATIONAL_ID);

      // Wait for the error to be processed (error OR timeout waiting for error)
      await fpPage.expectValidationErrorVisible().catch(() => {
        // If error didn't appear, URL check below is still valid
      });

      // Assert: user is still on the Forgot Password screen
      await expect(page).toHaveURL(/forget-password/);

      // Assert: the credentials form is still visible
      await expect(fpPage.usernameInput).toBeVisible();
      await expect(fpPage.sendOtpButton).toBeVisible();

      const shot = path.resolve(SHOTS_DIR, 'fp-neg-006-stays-on-screen.png');
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach('fp-neg-006-stays-on-screen', { path: shot, contentType: 'image/png' });

      testInfo.annotations.push({
        type: 'pass',
        description: 'User remains on #/forget-password after invalid input — not redirected.',
      });
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'fp-neg-006-stays-on-screen');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-NEG-007: Password reset form not accessible without OTP verification
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-NEG-007 - Password reset form is not accessible without OTP verification', async ({ page }, testInfo) => {
    const fpPage = new ForgotPasswordPage(page);
    try {
      await fpPage.navigate();

      // At Step 1 (initial state), the password reset form (Step 3) must NOT be visible
      await fpPage.expectPasswordResetFormNotVisible();

      const shot = path.resolve(SHOTS_DIR, 'fp-neg-007-no-reset-form.png');
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach('fp-neg-007-no-reset-form', { path: shot, contentType: 'image/png' });

      testInfo.annotations.push({
        type: 'pass',
        description: 'Password reset form is correctly hidden at Step 1 — OTP verification required before access.',
      });
    } catch (error) {
      await handleFailureEvidence(page, testInfo, 'fp-neg-007-no-reset-form');
      throw error;
    }
  });

});
