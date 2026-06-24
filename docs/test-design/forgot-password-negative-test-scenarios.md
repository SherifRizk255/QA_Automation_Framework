# Forgot Password Negative — Test Scenarios

**Workflow Stage:** 3 — Test Case Design  
**Feature:** Forgot Password — Negative Demo  
**Date:** 2026-06-12  
**Demo Scope:** 7 negative automated test cases, no CRM dependency  

---

## Scenario Overview

| ID | Scenario | Type | Priority |
|----|----------|------|----------|
| FP-NEG-001 | Empty username — Send OTP button remains disabled | Input validation | P1 |
| FP-NEG-002 | Empty National ID — Send OTP button remains disabled | Input validation | P1 |
| FP-NEG-003 | Invalid username — error message displayed | Server-side validation | P1 |
| FP-NEG-004 | Invalid National ID — error message displayed | Server-side validation | P1 |
| FP-NEG-005 | Both fields empty — Send OTP button blocked | Form-level gate | P1 |
| FP-NEG-006 | User remains on Forgot Password screen after invalid input | Navigation guard | P2 |
| FP-NEG-007 | Password reset form not accessible without OTP verification | Access control gate | P1 |

---

## Scenario Details

### FP-NEG-001: Empty Username
- **Given:** User is on the Forgot Password screen
- **When:** Username field is empty, National ID is filled
- **Then:** Send OTP button is disabled; form cannot be submitted

### FP-NEG-002: Empty National ID
- **Given:** User is on the Forgot Password screen
- **When:** Username is filled, National ID field is empty
- **Then:** Send OTP button is disabled; form cannot be submitted

### FP-NEG-003: Invalid Username
- **Given:** User is on the Forgot Password screen
- **When:** User fills a non-existent username and a valid format National ID, then clicks Send OTP
- **Then:** An error message (toast or inline) is displayed; no OTP is sent

### FP-NEG-004: Invalid National ID
- **Given:** User is on the Forgot Password screen
- **When:** User fills a valid username and an invalid National ID (14 zeros), then clicks Send OTP
- **Then:** An error message (toast or inline) is displayed; no OTP is sent

### FP-NEG-005: Both Fields Empty
- **Given:** User is on the Forgot Password screen
- **When:** Both Username and National ID fields are empty
- **Then:** Send OTP button is disabled; the portal does not allow form submission

### FP-NEG-006: User Stays on FP Screen After Error
- **Given:** User is on the Forgot Password screen
- **When:** User submits invalid credentials and an error is returned
- **Then:** The URL remains `#/forget-password`; the credentials form is still visible; the user is NOT redirected

### FP-NEG-007: Password Reset Gate — No OTP No Reset
- **Given:** User is on the Forgot Password screen (initial state, no OTP sent)
- **When:** Page loads at Step 1
- **Then:** The password reset form elements (new password input, confirm password, reset button) are NOT visible; the flow enforces OTP verification as a prerequisite
