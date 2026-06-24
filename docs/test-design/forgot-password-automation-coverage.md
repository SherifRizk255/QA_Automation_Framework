# Forgot Password - Automation Coverage

## Date: 2026-06-12

---

## Coverage Summary

| Category | Count |
|----------|-------|
| Total manual test cases | 15 |
| Total automated test cases | 15 |
| Automation coverage | 100% |
| CRM-dependent tests | 4 (FP-003 to FP-006) |
| Tests blocked by CRM config | 4 (when CRM credentials are placeholders) |
| Serial suite (positive) | 6 tests |
| Independent suite (negative) | 9 tests |

---

## Test File Mapping

| Test ID | Test Name | File | Suite Type |
|---------|-----------|------|-----------|
| FP-001 | Open Forgot Password screen | forgot-password-positive.spec.ts | Serial |
| FP-002 | Send OTP with valid credentials | forgot-password-positive.spec.ts | Serial |
| FP-003 | Retrieve OTP from CRM SMS Log | forgot-password-positive.spec.ts | Serial |
| FP-004 | Verify OTP successfully | forgot-password-positive.spec.ts | Serial |
| FP-005 | Reset password successfully | forgot-password-positive.spec.ts | Serial |
| FP-006 | Login with reset password | forgot-password-positive.spec.ts | Serial |
| FP-NEG-001 | Empty username | forgot-password-negative.spec.ts | Independent |
| FP-NEG-002 | Empty National ID | forgot-password-negative.spec.ts | Independent |
| FP-NEG-003 | Invalid username | forgot-password-negative.spec.ts | Independent |
| FP-NEG-004 | Invalid National ID | forgot-password-negative.spec.ts | Independent |
| FP-NEG-005 | Empty OTP | forgot-password-negative.spec.ts | Independent (needs OTP step) |
| FP-NEG-006 | Invalid OTP | forgot-password-negative.spec.ts | Independent (needs OTP step) |
| FP-NEG-007 | Password mismatch | forgot-password-negative.spec.ts | Independent (needs CRM) |
| FP-NEG-008 | T&C not checked | forgot-password-negative.spec.ts | Independent (needs CRM) |
| FP-NEG-009 | Weak password | forgot-password-negative.spec.ts | Independent (needs CRM) |

---

## Page Objects Used

| Page Object | File | Language |
|-------------|------|----------|
| ForgotPasswordPage | pages/portal/ForgotPasswordPage.ts | TypeScript |
| LoginPage | pages/portal/LoginPage.ts | TypeScript |
| CrmSmsLogPage | pages/crm/CrmSmsLogPage.ts | TypeScript |

## Utilities Used

| Utility | File | Purpose |
|---------|------|---------|
| otpExtractor | utils/otpExtractor.ts | Extract OTP from CRM message |
| sensitiveDataMasker | utils/sensitiveDataMasker.ts | Mask OTP/NID/passwords in logs |
| failureHandler | utils/failureHandler.ts | Capture failure evidence |

---

## Out-of-Scope

- OTP resend with cooldown bypass
- Account lockout after N failed OTP attempts
- Forgot password with SSO/OAuth accounts
- Password reset link expiry
- Multi-session concurrency during reset
