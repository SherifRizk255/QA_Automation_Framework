# Forgot Password - Page Object Recommendations

## Analysis Date: 2026-06-12

---

## Recommended Page Objects

### 1. ForgotPasswordPage.ts — `pages/portal/ForgotPasswordPage.ts`

**Responsibility**: All steps of the Forgot Password flow (steps 1–4) within `#/forget-password`

| Method | Purpose |
|--------|---------|
| `navigate(baseUrl, loginPath)` | Navigate to login page → click Forgot Password button |
| `expectForgotPasswordPageLoaded()` | Assert step 1 form is visible |
| `fillCredentials(username, nationalId)` | Fill Username and National ID (step 1) |
| `clickSendOtp()` | Click Send OTP; wait for enabled state first |
| `handleOtpCooldownIfVisible(testInfo)` | Detect and document cooldown error toast |
| `waitForOtpStep(testInfo)` | Wait for OTP entry form to appear (step 2) |
| `fillOtp(otp)` | Fill OTP — handles both PrimeNG p-inputotp and single input |
| `clickVerify()` | Click Verify (step 2 submission) |
| `waitForPasswordResetStep(testInfo)` | Wait for password reset form to appear (step 3) |
| `fillNewPassword(newPass, confirmPass)` | Fill new and confirm password fields |
| `checkTermsAndConditions()` | Check T&C checkbox |
| `clickResetPassword()` | Click Reset Password button |
| `expectPasswordResetSuccess(testInfo)` | Assert success message visible; take screenshot |
| `clickBackToLogon()` | Click Back To Logon button |

**Design notes**:
- Step transitions are in-place (same URL) — use wait-for-locator patterns to detect step changes
- Never use `page.waitForTimeout()` — use `expect(locator).toBeVisible()` patterns
- OTP input: try p-inputotp individual inputs first; fall back to single input
- T&C: use `.check()` on checkbox; use p-checkbox component as click target if checkbox has display:none

---

### 2. LoginPage.ts — `pages/portal/LoginPage.ts`

**Responsibility**: Portal login, session blocker handling  
**Note**: TypeScript version of existing `LoginPage.js`; preserves all existing logic

| Method | Purpose |
|--------|---------|
| `goto()` | Navigate to portal login URL |
| `expectLoginPageLoaded()` | Assert login form visible |
| `login(username, password, testInfo)` | Fill credentials, submit, handle session popup |
| `handleActiveSessionPopupIfVisible(testInfo)` | Session blocker detection and handling |

---

### 3. CrmSmsLogPage.ts — `pages/crm/CrmSmsLogPage.ts`

**Responsibility**: CRM navigation, SMS log retrieval, OTP extraction

| Method | Purpose |
|--------|---------|
| `navigate()` | Navigate to `CRM_SMS_LOG_URL` |
| `handleLoginIfRequired()` | Detect Microsoft login redirect; authenticate with CRM credentials |
| `openLatestSmsLog(testInfo)` | Click first row in entity list to open latest SMS log |
| `extractOtp()` | Find Message Details section; extract OTP using regex |

**Design notes**:
- CRM credentials check: if placeholder values detected, throw descriptive error
- MS Dynamics 365: entity list rows use `data-id` or `role="row"` patterns
- OTP regex: `/Please use the following OTP to complete your authentication:\s*(\d+)/i`
- Never log the raw OTP value — mask as `OTP:[***]`

---

### 4. DashboardPage.ts — Existing `DashboardPage.js`

No TypeScript version needed for this feature — positive test FP-006 can use the existing JavaScript version directly, or we create a minimal `.ts` version.

**Decision**: Create `DashboardPage.ts` as a thin TypeScript wrapper reusing existing logic.

---

## Utility File Recommendations

| File | Purpose |
|------|---------|
| `utils/otpExtractor.ts` | Pure function: extract OTP from CRM message text via regex |
| `utils/sensitiveDataMasker.ts` | Pure functions: mask OTP, national ID, password in log strings |
| `utils/failureHandler.ts` | TypeScript version of existing `failureHandler.js` |
