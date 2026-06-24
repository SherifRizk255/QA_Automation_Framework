# Forgot Password Negative — Manual Test Cases

**Workflow Stage:** 3 — Test Case Design  
**Date:** 2026-06-12  
**Demo Scope:** 7 negative cases — no CRM, no OTP, no password reset  

---

### FP-NEG-001: Empty Username — Send OTP Blocked

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-001 |
| Priority | P1 |
| Precondition | Portal accessible; user on Forgot Password screen |
| Test Data | Username: (empty), National ID: `00000000000000` |
| Steps | 1. Navigate to Forgot Password screen<br>2. Leave Username field empty<br>3. Fill National ID with any value<br>4. Observe Send OTP button state |
| Expected Result | Send OTP button remains **disabled**; user cannot submit the form |
| Pass Criteria | `button[Send OTP].disabled == true` |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/fp-neg-001-username-empty.png` |

---

### FP-NEG-002: Empty National ID — Send OTP Blocked

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-002 |
| Priority | P1 |
| Precondition | Portal accessible; user on Forgot Password screen |
| Test Data | Username: `Sherif Rizk`, National ID: (empty) |
| Steps | 1. Navigate to Forgot Password screen<br>2. Fill Username<br>3. Leave National ID empty<br>4. Observe Send OTP button state |
| Expected Result | Send OTP button remains **disabled** |
| Pass Criteria | `button[Send OTP].disabled == true` |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/fp-neg-002-nid-empty.png` |

---

### FP-NEG-003: Invalid Username — Error Shown

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-003 |
| Priority | P1 |
| Precondition | Portal accessible; user on Forgot Password screen |
| Test Data | Username: `INVALID_USER_XYZ_999`, National ID: `00000000000000` |
| Steps | 1. Navigate to Forgot Password screen<br>2. Fill Username with invalid value<br>3. Fill National ID with 14-digit value<br>4. Click Send OTP |
| Expected Result | Error toast or inline message appears; OTP is NOT sent |
| Pass Criteria | Error element visible within 10s |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/fp-neg-003-invalid-username-error.png` |

---

### FP-NEG-004: Invalid National ID — Error Shown

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-004 |
| Priority | P1 |
| Precondition | Portal accessible; user on Forgot Password screen |
| Test Data | Username: `Sherif Rizk` (valid), National ID: `00000000000000` (invalid format/value) |
| Steps | 1. Navigate to Forgot Password screen<br>2. Fill Username with valid value<br>3. Fill National ID with invalid value<br>4. Click Send OTP |
| Expected Result | Error toast or inline message appears |
| Pass Criteria | Error element visible within 10s |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/fp-neg-004-invalid-nid-error.png` |

---

### FP-NEG-005: Both Fields Empty — Send OTP Blocked

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-005 |
| Priority | P1 |
| Precondition | Portal accessible; user on Forgot Password screen |
| Test Data | Username: (empty), National ID: (empty) |
| Steps | 1. Navigate to Forgot Password screen<br>2. Leave both fields empty<br>3. Observe Send OTP button state |
| Expected Result | Send OTP button is **disabled**; form cannot be submitted |
| Pass Criteria | `button[Send OTP].disabled == true` |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/fp-neg-005-both-empty.png` |

---

### FP-NEG-006: User Remains on FP Screen After Error

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-006 |
| Priority | P2 |
| Precondition | Portal accessible; user on Forgot Password screen |
| Test Data | Username: `INVALID_USER_XYZ_999`, National ID: `00000000000000` |
| Steps | 1. Navigate to Forgot Password screen<br>2. Fill invalid credentials<br>3. Click Send OTP<br>4. Wait for error response<br>5. Check page URL and form visibility |
| Expected Result | URL still contains `#/forget-password`; credentials form is still visible |
| Pass Criteria | `page.url()` matches `/forget-password/`; username input still visible |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/fp-neg-006-stays-on-screen.png` |

---

### FP-NEG-007: Password Reset Form Not Accessible Without OTP

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-007 |
| Priority | P1 |
| Precondition | Portal accessible; user on Forgot Password screen (initial state) |
| Test Data | None (no data entry required) |
| Steps | 1. Navigate to Forgot Password screen<br>2. Observe the screen content<br>3. Check if password reset form elements are visible |
| Expected Result | New Password input, Confirm Password input, and Reset Password button are NOT visible; Step 1 (credentials) is the only form visible |
| Pass Criteria | All Step 3 elements are hidden |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/fp-neg-007-no-reset-form.png` |
