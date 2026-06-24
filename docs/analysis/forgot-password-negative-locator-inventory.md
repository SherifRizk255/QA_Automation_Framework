# Forgot Password Negative — Locator Inventory

**Workflow Stage:** 2 — System Walkthrough and Locator Discovery  
**Date:** 2026-06-12  
**Confidence Basis:** Confirmed from live DOM inspection in previous Playwright sessions + discovery scripts  

---

## Login Page Locators (Used for Navigation)

| Element | Locator | Confidence | How Confirmed |
|---------|---------|------------|---------------|
| Forgot Password button | `getByRole('button', { name: /forgot.*password/i })` | ✅ High | Text "FORGOT PASSWORD?" confirmed via DOM |

---

## Forgot Password Form — Step 1 (Negative Demo Scope)

| Element | Locator | Confidence | Notes |
|---------|---------|------------|-------|
| Username input | `getByPlaceholder(/enter your username/i)` | ✅ High | `formcontrolname="UserName"`, confirmed |
| National ID input | `getByPlaceholder(/enter your national id/i)` | ✅ High | `formcontrolname="NationalId"`, `maxlength="14"`, confirmed |
| Send OTP button | `getByRole('button', { name: /send\s*otp/i })` | ✅ High | PrimeNG `p-button`, `type="submit"`, confirmed |
| Back link | `getByRole('link', { name: /back/i }).first()` | ✅ High | `<a>Back</a>`, confirmed |

### Send OTP Button Behavior
- **Disabled** when either Username or National ID is empty → Angular `Validators.required`
- **Enabled** only when BOTH fields have non-empty values
- Wait strategy: `await expect(sendOtpBtn).toBeDisabled()` / `await expect(sendOtpBtn).toBeEnabled()`

---

## Error / Toast Locators

| Element | Locator | Confidence | Notes |
|---------|---------|------------|-------|
| PrimeNG error toast | `.p-toast-message-error` | ✅ High | Confirmed via previous test runs |
| Toast container | `.p-toast .p-toast-message` | ✅ High | PrimeNG toast confirmed |
| General error/alert | `page.getByRole('alert')` | Medium | Fallback if toast class differs |
| Inline validation | `.p-error, small.ng-star-inserted` | Medium | Angular form validation messages |

---

## Negative Gate Check Locators (FP-NEG-007)

| Element | Locator | Usage |
|---------|---------|-------|
| New password input | `getByPlaceholder(/new.*password/i)` or `locator('input[type="password"]').first()` | Assert `toBeHidden()` at Step 1 |
| Confirm password input | `getByPlaceholder(/confirm.*password/i)` or `locator('input[type="password"]').nth(1)` | Assert `toBeHidden()` at Step 1 |
| Reset Password button | `getByRole('button', { name: /reset.*password/i })` | Assert `toBeHidden()` at Step 1 |

---

## Active Session Dialog (Blocker Handling)

| Element | Locator | Notes |
|---------|---------|-------|
| Dialog | `getByRole('alertdialog').filter({ hasText: /active session/i }).last()` | Appears on repeated portal visits |
| Proceed button | `dialog.getByRole('button', { name: /proceed\|ok\|yes\|continue/i })` | Click to dismiss |
