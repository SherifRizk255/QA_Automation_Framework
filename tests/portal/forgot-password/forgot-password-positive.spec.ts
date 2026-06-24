/**
 * Forgot Password — Positive Test Suite
 * Tests: FP-001 through FP-006
 * Runs as a serial suite because the flow is stateful (single OTP session).
 *
 * Prerequisites:
 *   FORGOT_PASSWORD_USERNAME   — valid username
 *   FORGOT_PASSWORD_NATIONAL_ID — valid national ID
 *   FORGOT_PASSWORD_NEW_PASSWORD — new password to set
 *   CRM_SMS_LOG_URL             — CRM OTP view URL
 *   CRM_USERNAME / CRM_PASSWORD — CRM credentials (required for FP-003+)
 *
 * Security: OTP, National ID, and passwords are never printed in plain text.
 */

import { test, expect, type Browser, type Page } from '@playwright/test';
import { ForgotPasswordPage } from '../../../pages/portal/ForgotPasswordPage.ts';
import { LoginPage } from '../../../pages/portal/LoginPage.ts';
import { CrmSmsLogPage } from '../../../pages/crm/CrmSmsLogPage.ts';
import { handleFailureEvidence } from '../../../utils/failureHandler.ts';
import { maskOtp, maskPassword } from '../../../utils/sensitiveDataMasker.ts';
import path from 'node:path';

const FP_USERNAME   = process.env.FORGOT_PASSWORD_USERNAME   ?? '';
const FP_NATIONAL_ID = process.env.FORGOT_PASSWORD_NATIONAL_ID ?? '';
const FP_NEW_PASSWORD = process.env.FORGOT_PASSWORD_NEW_PASSWORD ?? '';

function assertEnvVar(name: string, value: string): void {
  if (!value) throw new Error(`Environment variable ${name} is not set in .env`);
}

test.describe.serial('Internet Banking - Forgot Password Positive Flow', () => {
  let sharedPage: Page;
  let extractedOtp = '';

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    sharedPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-001: Validate user can open Forgot Password screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-001 - Validate user can open Forgot Password screen', async ({}, testInfo) => {
    const fpPage = new ForgotPasswordPage(sharedPage);

    try {
      await fpPage.navigate();
      await fpPage.expectForgotPasswordPageLoaded();

      const shotPath = path.resolve('reports/system-walkthrough/forgot-password', 'fp-001-page-loaded.png');
      await sharedPage.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('fp-001-forgot-password-page', {
        path: shotPath,
        contentType: 'image/png',
      });
    } catch (error) {
      await handleFailureEvidence(sharedPage, testInfo, 'FP-001-forgot-password-page');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-002: Validate user can send OTP using valid username and National ID
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-002 - Validate user can send OTP with valid credentials', async ({}, testInfo) => {
    assertEnvVar('FORGOT_PASSWORD_USERNAME', FP_USERNAME);
    assertEnvVar('FORGOT_PASSWORD_NATIONAL_ID', FP_NATIONAL_ID);

    const fpPage = new ForgotPasswordPage(sharedPage);

    try {
      // Page is already on #/forget-password from FP-001
      await fpPage.expectForgotPasswordPageLoaded();

      await fpPage.fillCredentials(FP_USERNAME, FP_NATIONAL_ID);
      await fpPage.clickSendOtp();

      // Detect and document OTP cooldown if it occurs
      const cooldownActive = await fpPage.handleOtpCooldownIfVisible(testInfo);
      if (cooldownActive) {
        testInfo.annotations.push({
          type: 'blocker',
          description:
            'OTP cooldown is active (2-minute window). ' +
            'This is an application business rule. Re-run after cooldown expires.',
        });
        test.skip();
        return;
      }

      // Wait for OTP entry step to appear (step 2 appears in-place)
      await fpPage.waitForOtpStep(testInfo);

      testInfo.annotations.push({
        type: 'info',
        description: 'OTP sent successfully via SMS. Proceeding to CRM retrieval.',
      });
    } catch (error) {
      await handleFailureEvidence(sharedPage, testInfo, 'FP-002-send-otp');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-003: Validate user can retrieve OTP from CRM SMS Log
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-003 - Validate user can retrieve OTP from CRM SMS Log', async ({ browser }, testInfo) => {
    CrmSmsLogPage.assertCredentialsConfigured();

    // CRM uses Windows/NTLM auth — must supply credentials at context creation
    const crmContext = await browser.newContext({
      ignoreHTTPSErrors: true,
      httpCredentials: {
        username: process.env.CRM_USERNAME ?? '',
        password: process.env.CRM_PASSWORD ?? '',
      },
    });
    const crmPage = await crmContext.newPage();
    const crmSmsLog = new CrmSmsLogPage(crmPage);

    try {
      await crmSmsLog.navigate(testInfo);
      await crmSmsLog.openLatestSmsLog(testInfo);
      extractedOtp = await crmSmsLog.extractOtp(testInfo);

      expect(extractedOtp).toBeTruthy();
      expect(extractedOtp).toMatch(/^\d+$/);

      testInfo.annotations.push({
        type: 'info',
        description: `OTP retrieved from CRM SMS Log: ${maskOtp(extractedOtp)}`,
      });
    } catch (error) {
      await handleFailureEvidence(crmPage, testInfo, 'FP-003-crm-otp-retrieval');
      throw error;
    } finally {
      await crmContext.close();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-004: Validate user can verify OTP successfully
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-004 - Validate user can verify OTP successfully', async ({}, testInfo) => {
    if (!extractedOtp) {
      testInfo.annotations.push({
        type: 'blocker',
        description: 'OTP was not extracted in FP-003. Cannot proceed with OTP verification.',
      });
      test.skip();
      return;
    }

    const fpPage = new ForgotPasswordPage(sharedPage);

    try {
      // OTP entry step should still be visible (continued from FP-002)
      await fpPage.waitForOtpStep(testInfo);
      await fpPage.fillOtp(extractedOtp, testInfo);
      await fpPage.clickVerify();

      // After verification, password reset form should appear
      await fpPage.waitForPasswordResetStep(testInfo);

      testInfo.annotations.push({
        type: 'info',
        description: `OTP verified successfully: ${maskOtp(extractedOtp)}`,
      });
    } catch (error) {
      await handleFailureEvidence(sharedPage, testInfo, 'FP-004-otp-verification');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-005: Validate user can reset password successfully
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-005 - Validate user can reset password with valid inputs', async ({}, testInfo) => {
    assertEnvVar('FORGOT_PASSWORD_NEW_PASSWORD', FP_NEW_PASSWORD);

    const fpPage = new ForgotPasswordPage(sharedPage);

    try {
      // Password reset form should be visible (continued from FP-004)
      await fpPage.waitForPasswordResetStep(testInfo);
      await fpPage.fillNewPassword(FP_NEW_PASSWORD, FP_NEW_PASSWORD);
      await fpPage.checkTermsAndConditions();
      await fpPage.clickResetPassword();
      await fpPage.expectPasswordResetSuccess(testInfo);

      testInfo.annotations.push({
        type: 'info',
        description: `Password reset successful. New password: ${maskPassword(FP_NEW_PASSWORD)}`,
      });
    } catch (error) {
      await handleFailureEvidence(sharedPage, testInfo, 'FP-005-password-reset');
      throw error;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FP-006: Validate user can login with the newly reset password
  // ─────────────────────────────────────────────────────────────────────────
  test('FP-006 - Validate user can login with newly reset password', async ({}, testInfo) => {
    assertEnvVar('FORGOT_PASSWORD_USERNAME', FP_USERNAME);
    assertEnvVar('FORGOT_PASSWORD_NEW_PASSWORD', FP_NEW_PASSWORD);

    const fpPage = new ForgotPasswordPage(sharedPage);
    const loginPage = new LoginPage(sharedPage);

    try {
      // Navigate back to logon from success screen
      await fpPage.clickBackToLogon();
      await expect(sharedPage).toHaveURL(/login/);

      // Login with the newly reset password
      const sessionBlocked = await loginPage.login(FP_USERNAME, FP_NEW_PASSWORD, testInfo);
      console.log(`[FP-006] Active session blocker appeared: ${sessionBlocked}`);

      // Assert login success — URL should no longer be on login page
      await expect(sharedPage).not.toHaveURL(/\/login(?:$|[/?#])/i, { timeout: 30000 });
      await expect(sharedPage.locator('body')).toBeVisible();

      const shotPath = path.resolve('reports/system-walkthrough/forgot-password', 'fp-006-dashboard.png');
      await sharedPage.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('fp-006-dashboard-after-reset', {
        path: shotPath,
        contentType: 'image/png',
      });

      testInfo.annotations.push({
        type: 'info',
        description: 'Login with newly reset password succeeded.',
      });
    } catch (error) {
      await handleFailureEvidence(sharedPage, testInfo, 'FP-006-login-after-reset');
      throw error;
    }
  });
});
