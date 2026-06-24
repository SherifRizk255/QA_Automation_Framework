# Forgot Password - Screen Inventory

## Discovery Date: 2026-06-12

---

## SCR-001: Login Page

| Property | Value |
|----------|-------|
| Route | `#/login` |
| Navigation Path | Direct URL navigation |
| Purpose | Portal authentication entry point |
| Visible Controls | Username input, Password input, Sign In button, Forgot Password button, Forgot Username button, Register Now button |
| Blockers | Active session popup ("You have an active session. Do you want to close it?") |
| Recommended Page Object | `LoginPage.ts` |
| Screenshot | `reports/system-walkthrough/forgot-password/01-login-page.png` |

---

## SCR-002: Forgot Password Form (Step 1 — Credentials Entry)

| Property | Value |
|----------|-------|
| Route | `#/forget-password` |
| Navigation Path | Login Page → Click "FORGOT PASSWORD?" button |
| Purpose | Collect username + national ID to initiate OTP flow |
| Visible Controls | Back link, Username input (placeholder: "Enter your Username"), National ID input (placeholder: "Enter your National ID"), Send OTP button (disabled until form valid) |
| Validation | Both fields required; button disabled until both filled |
| API Calls on Submit | `POST /auth/forget-password` then `POST /auth/methods/send` |
| Blockers | OTP cooldown: 400 error if OTP already sent within last 2 minutes |
| Recommended Page Object | `ForgotPasswordPage.ts` |
| Screenshot | `reports/system-walkthrough/forgot-password/02-forgot-password-form.png` |

---

## SCR-003: OTP Entry Screen (Step 2 — OTP Verification)

| Property | Value |
|----------|-------|
| Route | `#/forget-password` (same URL, in-place step) |
| Navigation Path | Step 1 → Successful Send OTP |
| Purpose | User enters the OTP received via SMS |
| Visible Controls | OTP input field(s), Verify button, possibly Resend OTP countdown |
| OTP Source | CRM SMS Log — latest `cis_smslog` record, Message Details section |
| Locator Confidence | Medium (not directly captured; inferred from API flow and PrimeNG patterns) |
| Recommended Page Object | `ForgotPasswordPage.ts` (step-based) |
| Screenshot | Not captured (OTP cooldown prevented discovery) |

---

## SCR-004: Password Reset Form (Step 3 — New Password)

| Property | Value |
|----------|-------|
| Route | `#/forget-password` (same URL, in-place step) |
| Navigation Path | Step 2 → Successful OTP Verification |
| Purpose | User sets a new password |
| Visible Controls | New Password input, Confirm Password input, Terms & Conditions checkbox, Reset Password button |
| Validation | Passwords must match; T&C must be checked; password must meet policy |
| Locator Confidence | Medium (not directly captured; inferred) |
| Recommended Page Object | `ForgotPasswordPage.ts` (step-based) |
| Screenshot | Not captured |

---

## SCR-005: Success Screen (Step 4 — Password Reset Confirmation)

| Property | Value |
|----------|-------|
| Route | `#/forget-password` (same URL, in-place) |
| Navigation Path | Step 3 → Successful Password Reset |
| Purpose | Confirm password has been reset |
| Visible Controls | Success message, Back To Logon button |
| Locator Confidence | Medium (not directly captured) |
| Recommended Page Object | `ForgotPasswordPage.ts` |
| Screenshot | Not captured |

---

## CRM: SMS Log Entity List

| Property | Value |
|----------|-------|
| URL | `CRM_SMS_LOG_URL` (env var) |
| Platform | Microsoft Dynamics 365 |
| Purpose | Source for OTP retrieval |
| Entity | `cis_smslog` |
| Authentication | Microsoft login (CRM_USERNAME / CRM_PASSWORD from .env) |
| OTP Location | Latest row → Message Details section → message text |
| OTP Pattern | "Please use the following OTP to complete your authentication: {OTP}" |
| Locator Confidence | Low (not directly captured; placeholder credentials blocked access) |
| Recommended Page Object | `CrmSmsLogPage.ts` |
