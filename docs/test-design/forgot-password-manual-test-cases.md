# Forgot Password - Manual Test Cases

## Date: 2026-06-12

---

## Positive Test Cases

### FP-001: Validate user can open Forgot Password screen

| Field | Value |
|-------|-------|
| Test ID | FP-001 |
| Priority | P1 |
| Precondition | Portal is accessible at PORTAL_BASE_URL |
| Steps | 1. Open portal login URL<br>2. Click "FORGOT PASSWORD?" button |
| Expected Result | Forgot Password form displayed with Username and National ID fields and Send OTP button |

---

### FP-002: Validate user can send OTP with valid username and National ID

| Field | Value |
|-------|-------|
| Test ID | FP-002 |
| Priority | P1 |
| Precondition | FP-001 passed; account exists in system |
| Steps | 1. Fill Username with valid value<br>2. Fill National ID with valid value<br>3. Click Send OTP |
| Expected Result | OTP step appears; "An OTP has been sent" indicator or OTP input fields visible |
| Note | OTP cooldown: cannot resend within 2 minutes |

---

### FP-003: Validate user can retrieve OTP from CRM SMS Log

| Field | Value |
|-------|-------|
| Test ID | FP-003 |
| Priority | P1 |
| Precondition | FP-002 passed; CRM credentials configured |
| Steps | 1. Open CRM SMS Log URL<br>2. Login to CRM<br>3. Open latest SMS Log record<br>4. Locate Message Details section<br>5. Find OTP in message text |
| Expected Result | OTP value extracted from message: "Please use the following OTP to complete your authentication: NNNNNN" |

---

### FP-004: Validate user can verify OTP successfully

| Field | Value |
|-------|-------|
| Test ID | FP-004 |
| Priority | P1 |
| Precondition | FP-003 passed; OTP extracted |
| Steps | 1. Enter OTP in OTP field<br>2. Click Verify |
| Expected Result | Password reset form (Step 3) becomes visible |

---

### FP-005: Validate user can reset password successfully

| Field | Value |
|-------|-------|
| Test ID | FP-005 |
| Priority | P1 |
| Precondition | FP-004 passed |
| Steps | 1. Enter new password<br>2. Enter same value in confirm password<br>3. Check Terms and Conditions<br>4. Click Reset Password |
| Expected Result | Success message: "Password reset successful" (or similar) |

---

### FP-006: Validate user can login with newly reset password

| Field | Value |
|-------|-------|
| Test ID | FP-006 |
| Priority | P1 |
| Precondition | FP-005 passed |
| Steps | 1. Click Back To Logon<br>2. Enter username<br>3. Enter new password<br>4. Click Sign In |
| Expected Result | Dashboard loads; user is authenticated |

---

## Negative Test Cases

### FP-NEG-001: Empty username

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-001 |
| Steps | 1. Leave Username empty<br>2. Fill National ID<br>3. Observe Send OTP button |
| Expected Result | Send OTP button remains disabled (Angular form validation) |

---

### FP-NEG-002: Empty National ID

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-002 |
| Steps | 1. Fill Username<br>2. Leave National ID empty<br>3. Observe Send OTP button |
| Expected Result | Send OTP button remains disabled |

---

### FP-NEG-003: Invalid username

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-003 |
| Steps | 1. Enter invalid/non-existent username<br>2. Enter valid National ID<br>3. Click Send OTP |
| Expected Result | Error toast or inline error: user not found or credentials mismatch |

---

### FP-NEG-004: Invalid National ID

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-004 |
| Steps | 1. Enter valid username<br>2. Enter invalid National ID (wrong digits)<br>3. Click Send OTP |
| Expected Result | Error toast or inline error: national ID mismatch |

---

### FP-NEG-005: Empty OTP on verify

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-005 |
| Precondition | OTP step visible |
| Steps | 1. Reach OTP step<br>2. Leave OTP empty<br>3. Click Verify (or observe button state) |
| Expected Result | Verify button disabled or error shown for empty OTP |

---

### FP-NEG-006: Invalid OTP

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-006 |
| Precondition | OTP step visible |
| Steps | 1. Enter wrong OTP (e.g. 000000)<br>2. Click Verify |
| Expected Result | Error: invalid or expired OTP |

---

### FP-NEG-007: Password mismatch

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-007 |
| Precondition | Password reset form visible |
| Steps | 1. Enter new password<br>2. Enter different confirm password<br>3. Click Reset Password |
| Expected Result | Error: passwords do not match |

---

### FP-NEG-008: T&C not checked

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-008 |
| Precondition | Password reset form visible |
| Steps | 1. Enter matching passwords<br>2. Leave T&C unchecked<br>3. Click Reset Password |
| Expected Result | Error or button disabled when T&C not accepted |

---

### FP-NEG-009: Weak password (policy violation)

| Field | Value |
|-------|-------|
| Test ID | FP-NEG-009 |
| Precondition | Password reset form visible |
| Steps | 1. Enter weak password (e.g. "abc")<br>2. Check T&C<br>3. Click Reset Password |
| Expected Result | Error: password does not meet policy requirements |
| Note | Exact policy rules not documented (GAP-001) |
