import { type Page, type Locator, type TestInfo, expect } from '@playwright/test';
import path from 'node:path';
import { maskOtp } from '../../utils/sensitiveDataMasker.ts';

export class ForgotPasswordPage {
  readonly page: Page;

  // ── Step 1: Credentials form ─────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly nationalIdInput: Locator;
  readonly sendOtpButton: Locator;
  readonly backLink: Locator;

  // ── Step 2: OTP entry (appears in-place after successful Send OTP) ────────
  // PrimeNG p-inputotp renders individual single-character inputs
  readonly otpDigitInputs: Locator;
  // Fallback: single input field
  readonly otpSingleInput: Locator;
  readonly verifyButton: Locator;

  // ── Step 3: Password reset form ──────────────────────────────────────────
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly termsAndConditionsCheckbox: Locator;
  readonly resetPasswordButton: Locator;

  // ── Outcomes ──────────────────────────────────────────────────────────────
  readonly successMessage: Locator;
  readonly backToLogonButton: Locator;

  // ── Error indicators ──────────────────────────────────────────────────────
  readonly otpCooldownError: Locator;
  readonly toastError: Locator;
  readonly validationError: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1 — confirmed via live DOM inspection
    this.usernameInput = page.getByPlaceholder(/enter your username/i);
    this.nationalIdInput = page.getByPlaceholder(/enter your national id/i);
    this.sendOtpButton = page.getByRole('button', { name: /send\s*otp/i });
    this.backLink = page.getByRole('link', { name: /back/i }).first();

    // Step 2 — confirmed: single input with name="Otp", class="p-inputotp-input", maxlength="6"
    // PrimeNG InputOtp renders visually as 6 boxes but has one underlying input element
    this.otpDigitInputs = page.locator('input.p-inputotp-input, input[name="Otp"]');
    this.otpSingleInput = page
      .locator('input.p-inputotp-input, input[name="Otp"]')
      .or(page.getByPlaceholder(/enter.*otp|enter.*code|verification.*code/i));
    // "VERIFY ›" — accessible name is "Verify " (trailing space from icon)
    this.verifyButton = page.getByRole('button', { name: /verify/i });

    // Step 3 — medium confidence
    this.newPasswordInput = page
      .getByPlaceholder(/new.*password/i)
      .or(page.locator('input[type="password"]').first());
    this.confirmPasswordInput = page
      .getByPlaceholder(/confirm.*password|re.*enter.*password/i)
      .or(page.locator('input[type="password"]').nth(1));
    // PrimeNG checkbox: the visible click target is the <p-checkbox> wrapper
    this.termsAndConditionsCheckbox = page
      .locator('p-checkbox input[type="checkbox"]')
      .first()
      .or(page.getByRole('checkbox').first());
    this.resetPasswordButton = page.getByRole('button', { name: /reset.*password/i });

    // Outcomes
    this.successMessage = page.getByText(
      /password.*reset.*successful|successfully.*reset|reset.*successful/i
    );
    this.backToLogonButton = page
      .getByRole('button', { name: /back.*logon|back to logon/i })
      .or(page.getByRole('link', { name: /back.*logon/i }));

    // Errors
    this.otpCooldownError = page.getByText(
      /error occurred while sending the otp|please try again/i
    );
    this.toastError = page.locator(
      '.p-toast-message-error, .p-toast .p-toast-message[class*="error"]'
    );
    this.validationError = page.locator('.p-error, small.ng-star-inserted');
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigate(): Promise<void> {
    const baseUrl = process.env.PORTAL_BASE_URL ?? '';
    const loginPath = process.env.PORTAL_LOGIN_PATH ?? '';
    console.log('[ForgotPasswordPage] Navigating via login page → Forgot Password button.');
    await this.page.goto(`${baseUrl}${loginPath}`, { waitUntil: 'domcontentloaded' });

    // Dismiss active session dialog if the portal detects an existing session
    await this.dismissActiveSessionIfVisible();

    const fpBtn = this.page.getByRole('button', { name: /forgot.*password/i });
    await expect(fpBtn).toBeVisible({ timeout: 35000 });
    await fpBtn.click();
    await this.page.waitForURL(/forget-password/, { timeout: 15000 });
    console.log('[ForgotPasswordPage] Forgot Password page loaded.');
  }

  private async dismissActiveSessionIfVisible(): Promise<void> {
    const dialog = this.page
      .getByRole('alertdialog')
      .filter({ hasText: /active session/i })
      .last();
    const proceedBtn = dialog.getByRole('button', { name: /proceed|ok|yes|continue/i });
    const visible = await dialog
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (visible) {
      console.log('[ForgotPasswordPage] Active session dialog detected — dismissing.');
      await proceedBtn.click();
    }
  }

  // ── Step 1 assertions ─────────────────────────────────────────────────────

  async expectForgotPasswordPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/forget-password/);
    await expect(this.usernameInput).toBeVisible();
    await expect(this.nationalIdInput).toBeVisible();
    await expect(this.sendOtpButton).toBeVisible();
  }

  // ── Step 1 actions ────────────────────────────────────────────────────────

  async fillCredentials(username: string, nationalId: string): Promise<void> {
    console.log('[ForgotPasswordPage] Filling credentials (values masked).');
    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill(username);
    await expect(this.nationalIdInput).toBeVisible();
    await this.nationalIdInput.fill(nationalId);
  }

  async clickSendOtp(): Promise<void> {
    await expect(this.sendOtpButton).toBeEnabled({ timeout: 10000 });
    console.log('[ForgotPasswordPage] Clicking Send OTP.');
    await this.sendOtpButton.click();
  }

  /**
   * Detects the OTP cooldown toast error and documents it.
   * Returns true if cooldown error was detected.
   * Does NOT throw — caller decides how to handle.
   */
  async handleOtpCooldownIfVisible(testInfo: TestInfo | null = null): Promise<boolean> {
    const cooldownVisible = await this.otpCooldownError
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (cooldownVisible) {
      const shotPath = path.resolve('reports', 'fp-otp-cooldown-blocker.png');
      console.warn('[ForgotPasswordPage] OTP COOLDOWN ACTIVE — "An error occurred while sending the OTP."');
      await this.page.screenshot({ path: shotPath, fullPage: true });

      if (testInfo) {
        await testInfo.attach('otp-cooldown-blocker', { path: shotPath, contentType: 'image/png' });
        testInfo.annotations.push({
          type: 'blocker',
          description:
            'OTP cooldown active: cannot re-send OTP within 2 minutes. ' +
            'This is an application business rule, not an automation defect.',
        });
      }
    }
    return cooldownVisible;
  }

  // ── Step 2: OTP entry ──────────────────────────────────────────────────────

  /**
   * Waits for the OTP entry step to appear after Send OTP.
   * The page stays at the same URL — we wait for OTP input or Verify button to appear.
   */
  async waitForOtpStep(testInfo: TestInfo | null = null): Promise<void> {
    console.log('[ForgotPasswordPage] Waiting for OTP entry step to appear...');

    // Wait for the OTP input to appear (stays at same URL; Angular shows this in-place).
    // Use .first() to avoid strict-mode violation when both OTP input + Verify button are visible.
    await expect(this.otpDigitInputs.first()).toBeVisible({ timeout: 30000 });
    console.log('[ForgotPasswordPage] OTP entry step is visible.');

    if (testInfo) {
      const shotPath = path.resolve(
        'reports/system-walkthrough/forgot-password',
        'otp-entry-step.png'
      );
      await this.page.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('otp-entry-step', { path: shotPath, contentType: 'image/png' });
    }
  }

  async fillOtp(otp: string, testInfo: TestInfo | null = null): Promise<void> {
    console.log(`[ForgotPasswordPage] Filling OTP: ${maskOtp(otp)}`);
    // Confirmed: PrimeNG InputOtp renders as a single input (name="Otp", maxlength="6")
    const otpInput = this.otpDigitInputs.first();
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill(otp);

    if (testInfo) {
      const shotPath = path.resolve('reports', 'fp-otp-filled.png');
      await this.page.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('otp-filled', { path: shotPath, contentType: 'image/png' });
    }
  }

  async clickVerify(): Promise<void> {
    await expect(this.verifyButton).toBeEnabled({ timeout: 10000 });
    console.log('[ForgotPasswordPage] Clicking Verify.');
    await this.verifyButton.click();
  }

  // ── Step 3: Password reset form ───────────────────────────────────────────

  async waitForPasswordResetStep(testInfo: TestInfo | null = null): Promise<void> {
    console.log('[ForgotPasswordPage] Waiting for password reset form...');
    await expect(this.newPasswordInput).toBeVisible({ timeout: 30000 });
    console.log('[ForgotPasswordPage] Password reset form is visible.');

    if (testInfo) {
      const shotPath = path.resolve(
        'reports/system-walkthrough/forgot-password',
        'password-reset-step.png'
      );
      await this.page.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('password-reset-step', { path: shotPath, contentType: 'image/png' });
    }
  }

  async fillNewPassword(newPassword: string, confirmPassword: string): Promise<void> {
    console.log('[ForgotPasswordPage] Filling new password (values masked).');
    await expect(this.newPasswordInput).toBeVisible();
    await this.newPasswordInput.fill(newPassword);
    await expect(this.confirmPasswordInput).toBeVisible();
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  async checkTermsAndConditions(): Promise<void> {
    console.log('[ForgotPasswordPage] Checking Terms and Conditions.');
    await expect(this.termsAndConditionsCheckbox).toBeVisible({ timeout: 10000 });
    const isChecked = await this.termsAndConditionsCheckbox.isChecked();
    if (!isChecked) {
      // PrimeNG checkbox may have the real input hidden; click the wrapper instead
      const pCheckbox = this.page.locator('p-checkbox').first();
      const pVisible = await pCheckbox.isVisible().catch(() => false);
      if (pVisible) {
        await pCheckbox.click();
      } else {
        await this.termsAndConditionsCheckbox.check();
      }
    }
    await expect(this.termsAndConditionsCheckbox).toBeChecked();
  }

  async clickResetPassword(): Promise<void> {
    await expect(this.resetPasswordButton).toBeEnabled({ timeout: 10000 });
    console.log('[ForgotPasswordPage] Clicking Reset Password.');
    await this.resetPasswordButton.click();
  }

  // ── Step 4: Success ───────────────────────────────────────────────────────

  async expectPasswordResetSuccess(testInfo: TestInfo | null = null): Promise<void> {
    console.log('[ForgotPasswordPage] Waiting for password reset success message...');
    await expect(this.successMessage).toBeVisible({ timeout: 30000 });
    console.log('[ForgotPasswordPage] Password reset success confirmed.');

    if (testInfo) {
      const shotPath = path.resolve(
        'reports/system-walkthrough/forgot-password',
        'password-reset-success.png'
      );
      await this.page.screenshot({ path: shotPath, fullPage: true });
      await testInfo.attach('password-reset-success', { path: shotPath, contentType: 'image/png' });
    }
  }

  async clickBackToLogon(): Promise<void> {
    await expect(this.backToLogonButton).toBeVisible({ timeout: 15000 });
    console.log('[ForgotPasswordPage] Clicking Back To Logon.');
    await this.backToLogonButton.click();
    await this.page.waitForURL(/login/, { timeout: 15000 });
  }

  // ── Negative test helpers ─────────────────────────────────────────────────

  async submitWithEmptyUsername(nationalId: string): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill('');
    await this.nationalIdInput.fill(nationalId);
    // Send OTP button should remain disabled — just click it anyway to trigger validation
    await this.sendOtpButton.click({ force: true });
  }

  async submitWithEmptyNationalId(username: string): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill(username);
    await this.nationalIdInput.fill('');
    await this.sendOtpButton.click({ force: true });
  }

  async submitWithInvalidUsername(invalidUsername: string, nationalId: string): Promise<void> {
    await this.usernameInput.fill(invalidUsername);
    await this.nationalIdInput.fill(nationalId);
    await expect(this.sendOtpButton).toBeEnabled({ timeout: 10000 });
    await this.sendOtpButton.click();
  }

  async submitWithInvalidNationalId(username: string, invalidNationalId: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.nationalIdInput.fill(invalidNationalId);
    await expect(this.sendOtpButton).toBeEnabled({ timeout: 10000 });
    await this.sendOtpButton.click();
  }

  async expectValidationErrorVisible(): Promise<void> {
    const errorLocator = this.validationError
      .or(this.toastError)
      .or(this.page.getByRole('alert'))
      .first();
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
  }

  async expectSendOtpButtonDisabled(): Promise<void> {
    await expect(this.sendOtpButton).toBeDisabled();
  }

  /**
   * Asserts that the password reset form (Step 3) is NOT visible.
   * Used by FP-NEG-007 to verify the OTP gate is enforced.
   */
  async expectPasswordResetFormNotVisible(): Promise<void> {
    await expect(this.newPasswordInput).toBeHidden();
    await expect(this.resetPasswordButton).toBeHidden();
  }
}
