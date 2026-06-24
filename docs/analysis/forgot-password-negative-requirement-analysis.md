# Forgot Password Negative — Requirement Analysis

**Workflow Stage:** 1 — Requirement and Project Data Analysis  
**Feature:** Forgot Password — Negative Scenarios  
**Demo Scope:** Negative path validation only. No OTP retrieval, no CRM dependency, no password changes.  
**Date:** 2026-06-12  
**Analyst:** Claude Code AI Agent  

---

## Feature Description

The Forgot Password screen is the portal's self-service password recovery entry point. Users must provide a valid username and 14-digit National ID to trigger an OTP. This analysis focuses exclusively on the **error handling, input validation, and access control** behaviors observable on the Forgot Password credentials form (Step 1) and the structural gate against bypassing OTP verification.

---

## Portal Details

| Item | Value |
|------|-------|
| Portal URL | https://demo03.cubicsystems.com:8443 |
| Login path | /Saib/Channels/Internet-Banking-Retail-Portal/#/login |
| FP page route | #/forget-password |
| Framework | Angular SPA, PrimeNG component library |
| Auth method | Username + 14-digit National ID |

---

## Negative Scenarios Under Analysis

| ID | Scenario | Source |
|----|----------|--------|
| FP-NEG-001 | Username field empty — Send OTP must be blocked | Input validation |
| FP-NEG-002 | National ID field empty — Send OTP must be blocked | Input validation |
| FP-NEG-003 | Invalid username submitted — error message expected | Server-side validation |
| FP-NEG-004 | Invalid National ID submitted — error message expected | Server-side validation |
| FP-NEG-005 | Both required fields empty — Send OTP button must be disabled | Form-level gate |
| FP-NEG-006 | After invalid input, user must remain on Forgot Password screen | Navigation guard |
| FP-NEG-007 | Password reset form must not be accessible without OTP verification | Access control |

---

## Functional Requirements Extracted

### REQ-NEG-01: Required Field Validation
- The Username field is required. The Send OTP button must be disabled when Username is empty.
- The National ID field is required. The Send OTP button must be disabled when National ID is empty.
- When both fields are empty, the Send OTP button must be disabled.
- The Angular reactive form controls this gate via `[disabled]` binding on the submit button.

### REQ-NEG-02: Invalid Credential Handling
- When a username that does not exist in the system is submitted, the application must return an error.
- When a National ID that does not match the account on file is submitted, the application must return an error.
- Errors must be surfaced to the user via a toast notification or an inline validation message.
- The error must NOT reveal whether the username or the National ID specifically was wrong (security through ambiguity).

### REQ-NEG-03: Post-Error Navigation
- After submitting invalid credentials, the user must remain on the Forgot Password screen (#/forget-password).
- The user must NOT be redirected to the login page, an error page, or any other route.
- The credentials form must remain visible and interactive for retry.

### REQ-NEG-04: OTP Verification Gate
- The password reset form (new password, confirm password, T&C checkbox, Reset Password button) must NOT be visible on the Forgot Password screen before OTP verification.
- The multi-step flow must enforce: Credentials → OTP Verification → Password Reset.
- Users must not be able to skip OTP and access the password reset form directly.

---

## Business Rules

| Rule | Description |
|------|-------------|
| BR-01 | National ID must be exactly 14 digits. |
| BR-02 | OTP is required to proceed to the password reset form. |
| BR-03 | OTP has a 2-minute resend cooldown — NOT tested in this demo scope. |
| BR-04 | Positive flow (password reset) excluded from this demo. |

---

## Out of Scope for This Demo

- OTP entry and verification (requires a valid OTP from CRM, which is currently blocked)
- CRM SMS Log navigation
- Password reset completion
- Login with reset password
- Account lockout behavior
- Password policy enforcement
- OTP expiry and resend behavior
