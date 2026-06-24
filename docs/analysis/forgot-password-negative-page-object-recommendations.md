# Forgot Password Negative — Page Object Recommendations

**Workflow Stage:** 2 — System Walkthrough and Locator Discovery  
**Date:** 2026-06-12  

---

## Existing Page Object: `ForgotPasswordPage.ts`

The existing `pages/portal/ForgotPasswordPage.ts` already covers the negative demo scope. No new page objects are required. The following methods are directly usable:

| Method | Used By | Description |
|--------|---------|-------------|
| `navigate()` | All tests | Navigate via login → click FP button → wait for URL |
| `expectForgotPasswordPageLoaded()` | FP-NEG-006, FP-NEG-007 | Assert FP URL + form fields visible |
| `fillCredentials(user, nid)` | FP-NEG-003, FP-NEG-004, FP-NEG-006 | Fill username + NID |
| `clickSendOtp()` | FP-NEG-003, FP-NEG-004, FP-NEG-006 | Click Send OTP (asserts enabled first) |
| `expectSendOtpButtonDisabled()` | FP-NEG-001, FP-NEG-002, FP-NEG-005 | Assert button has `disabled` attribute |
| `expectValidationErrorVisible()` | FP-NEG-003, FP-NEG-004 | Assert toast/alert visible |
| `newPasswordInput` locator | FP-NEG-007 | Used to assert form NOT visible |
| `resetPasswordButton` locator | FP-NEG-007 | Used to assert form NOT visible |

---

## New Method Required: `expectPasswordResetFormNotVisible()`

Add this method to `ForgotPasswordPage.ts` for FP-NEG-007:

```typescript
async expectPasswordResetFormNotVisible(): Promise<void> {
  // Assert that the password reset step (Step 3) elements are not accessible
  // without completing OTP verification first
  await expect(this.newPasswordInput).toBeHidden();
  await expect(this.resetPasswordButton).toBeHidden();
}
```

---

## Architecture Decision

- All 7 negative demo tests use `ForgotPasswordPage` only
- `LoginPage` is not used directly (navigation is handled by `ForgotPasswordPage.navigate()`)
- `CrmSmsLogPage` is NOT used in the demo
- `utils/sensitiveDataMasker.ts` is used in tests that fill `FP_NATIONAL_ID` (FP-NEG-002, 003, 004, 006)
- `utils/failureHandler.ts` is used in all tests for failure evidence capture

---

## Sensitive Data Handling

| Data | Source | Masking |
|------|--------|---------|
| `FORGOT_PASSWORD_USERNAME` | `.env` | Never logged directly |
| `FORGOT_PASSWORD_NATIONAL_ID` | `.env` | `maskNationalId(nid)` → `"NationalID:[***]"` |
| Invalid test data | Hardcoded in spec | `INVALID_USER_XYZ_999`, `00000000000000` — not sensitive |
