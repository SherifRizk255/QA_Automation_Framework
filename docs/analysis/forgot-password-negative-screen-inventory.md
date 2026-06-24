# Forgot Password Negative — Screen Inventory

**Workflow Stage:** 2 — System Walkthrough and Locator Discovery  
**Date:** 2026-06-12  
**Source:** Live DOM inspection from previous system walkthrough + negative demo scope  

---

## Screens in Scope

### Screen 1: Login Page (`#/login`)

| Property | Value |
|----------|-------|
| URL | `https://demo03.cubicsystems.com:8443/Saib/.../Internet-Banking-Retail-Portal/#/login` |
| Purpose | Entry point — click "FORGOT PASSWORD?" to reach FP screen |
| Screenshot | `reports/system-walkthrough/forgot-password/01-login-page.png` |

**Elements Relevant to Negative Demo:**
- `FORGOT PASSWORD?` button — leads to FP screen

---

### Screen 2: Forgot Password — Step 1 Credentials Form (`#/forget-password`)

| Property | Value |
|----------|-------|
| URL | Same as login domain with `#/forget-password` |
| Purpose | Credentials entry (Username + National ID) to request OTP |
| Screenshot | `reports/system-walkthrough/forgot-password/fp-001-page-loaded.png` |
| Demo Screenshots | `reports/system-walkthrough/forgot-password-negative/03-fp-form-empty.png` |

**Elements:**
| Element | Type | State |
|---------|------|-------|
| Username input | `<input>` text | Required, placeholder "Enter Your Username" |
| National ID input | `<input>` text | Required, maxlength=14, placeholder "Enter Your National ID" |
| Send OTP button | `<button>` | Disabled when either field empty; enabled when both filled |
| Back link | `<a>` | Returns to login |

**Negative Behaviors Visible on this Screen:**
- Send OTP button has `disabled` attribute when validation fails
- Error toast appears after invalid credential submission (PrimeNG p-toast)
- Page URL does not change after error

---

### Screen 3: Error Toast (on Screen 2)

| Property | Value |
|----------|-------|
| Trigger | Invalid username or National ID submitted |
| Component | PrimeNG `p-toast` (message severity=error) |
| CSS selector | `.p-toast-message-error` or `.p-toast` |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/07-invalid-creds-error.png` |

---

## Screens Excluded from Demo

| Screen | Reason |
|--------|--------|
| Step 2: OTP Entry | Requires valid OTP from CRM (currently blocked) |
| Step 3: Password Reset Form | Requires OTP verification |
| Step 4: Success | Requires full positive flow |
