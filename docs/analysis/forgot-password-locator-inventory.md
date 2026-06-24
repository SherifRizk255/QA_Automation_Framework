# Forgot Password - Locator Inventory

## Discovery Date: 2026-06-12
## Method: Playwright headed browser, live DOM inspection, network logs

---

## Screen: Login Page (`#/login`)

| Element | Locator Strategy | Confidence | Notes |
|---------|-----------------|------------|-------|
| Username input | `page.getByPlaceholder('Enter your username')` | High | placeholder confirmed |
| Password input | `page.locator('input[type="password"]').first()` | High | type confirmed |
| Sign In button | `page.getByRole('button', { name: /sign in/i })` | High | type="submit" confirmed |
| Forgot Password button | `page.getByRole('button', { name: /forgot.*password/i })` | High | type="button", text "FORGOT PASSWORD?" confirmed |
| Register Now button | `page.getByRole('button', { name: /register now/i })` | High | confirmed |
| Language toggle | `page.getByRole('button', { name: /العربية/ })` | High | confirmed |

---

## Screen: Forgot Password Form (`#/forget-password`) — Step 1

| Element | Locator Strategy | Confidence | Notes |
|---------|-----------------|------------|-------|
| Username input | `page.getByPlaceholder(/enter your username/i)` | High | formcontrolname="UserName", confirmed via DOM |
| National ID input | `page.getByPlaceholder(/enter your national id/i)` | High | formcontrolname="NationalId", maxlength="14", confirmed |
| Send OTP button | `page.getByRole('button', { name: /send\s*otp/i })` | High | type="submit", PrimeNG p-button, confirmed |
| Back link | `page.getByRole('link', { name: /back/i })` | High | `<a>Back</a>` confirmed |
| Form element | `page.locator('form[novalidate]')` | High | Angular reactive form confirmed |

### Notes on Send OTP button behavior:
- Button is **disabled** until BOTH username AND national ID fields are valid (Angular reactive form validation)
- After form is filled with valid values, button becomes **enabled**
- Wait strategy: `await expect(sendOtpBtn).toBeEnabled()` before clicking

---

## Screen: OTP Entry Step (`#/forget-password`) — Step 2

> Status: **Inferred** — screen appears in-place after successful `POST /auth/methods/send`  
> Not directly captured due to 2-minute OTP cooldown during discovery  
> Locators are best-guess based on PrimeNG patterns and Angular conventions

| Element | Locator Strategy | Confidence | Fallback |
|---------|-----------------|------------|---------|
| OTP digit inputs (PrimeNG) | `page.locator('p-inputotp input')` | Medium | individual `input[maxlength="1"]` elements |
| OTP single input (alt) | `page.getByPlaceholder(/enter.*otp\|otp/i)` | Medium | `page.locator('input[formcontrolname="otp"]')` |
| Verify button | `page.getByRole('button', { name: /^verify$/i })` | Medium | `page.getByRole('button', { name: /verify/i })` |
| Resend OTP link | `page.getByText(/resend.*otp/i)` | Low | Presence not confirmed |
| OTP step heading | `page.getByText(/otp|verification/i).first()` | Low | Use as readiness signal only |

---

## Screen: Password Reset Step (`#/forget-password`) — Step 3

> Status: **Inferred** — screen appears after successful OTP verification  
> Locators based on Angular reactive form conventions

| Element | Locator Strategy | Confidence | Fallback |
|---------|-----------------|------------|---------|
| New Password input | `page.locator('input[type="password"]').first()` | Medium | `page.getByPlaceholder(/new.*password/i)` |
| Confirm Password input | `page.locator('input[type="password"]').nth(1)` | Medium | `page.getByPlaceholder(/confirm.*password/i)` |
| T&C checkbox | `page.locator('p-checkbox input[type="checkbox"]').first()` | Medium | `page.getByRole('checkbox').first()` |
| T&C checkbox (PrimeNG click target) | `page.locator('p-checkbox').first()` | Medium | click the label or span wrapping the checkbox |
| Reset Password button | `page.getByRole('button', { name: /reset.*password/i })` | Medium | `page.getByRole('button', { name: /reset/i })` |

---

## Screen: Success / Confirmation — Step 4

| Element | Locator Strategy | Confidence | Notes |
|---------|-----------------|------------|-------|
| Success message | `page.getByText(/password.*reset.*successful\|successfully.*reset/i)` | Medium | exact text TBC on first run |
| Back To Logon button | `page.getByRole('button', { name: /back.*logon/i })` | Medium | may be link or button |

---

## Error / Toast Messages

| Element | Locator Strategy | Confidence | Notes |
|---------|-----------------|------------|-------|
| Toast error | `page.locator('.p-toast-message-error')` | High | PrimeNG toast confirmed via console log (TOASTTTT) |
| OTP cooldown error | `page.getByText(/error occurred while sending the OTP/i)` | High | Exact text confirmed from console log |
| Validation error messages | `page.locator('.p-error, .ng-invalid ~ .error, small.text-red')` | Medium | Angular validation |

---

## Selector Confidence Legend
- **High**: Confirmed from live DOM inspection during discovery run
- **Medium**: Inferred from similar patterns/technology (PrimeNG + Angular); verify on first test run
- **Low**: Best guess; must self-heal after first run
