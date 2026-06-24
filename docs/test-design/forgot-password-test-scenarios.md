# Forgot Password - Test Scenarios

## Date: 2026-06-12

---

## Positive Scenarios

| ID | Scenario | Priority | CRM Required | OTP Cooldown Risk |
|----|----------|----------|-------------|------------------|
| FP-001 | Validate user can open Forgot Password screen from login page | P1 | No | No |
| FP-002 | Validate user can send OTP using valid username and valid National ID | P1 | No | Yes (2 min cooldown) |
| FP-003 | Validate user can retrieve OTP from CRM SMS Log | P1 | Yes | Yes |
| FP-004 | Validate user can verify OTP successfully | P1 | Yes | Yes |
| FP-005 | Validate user can reset password with valid OTP, matching passwords, T&C checked | P1 | Yes | Yes |
| FP-006 | Validate user can login successfully using the newly reset password | P1 | Yes | Yes |

## Negative Scenarios

| ID | Scenario | Priority | CRM Required | Requires OTP Step |
|----|----------|----------|-------------|------------------|
| FP-NEG-001 | Validate error when username is empty | P1 | No | No |
| FP-NEG-002 | Validate error when National ID is empty | P1 | No | No |
| FP-NEG-003 | Validate error when invalid username is entered | P2 | No | No |
| FP-NEG-004 | Validate error when invalid National ID is entered | P2 | No | No |
| FP-NEG-005 | Validate error when OTP field is empty | P2 | No* | Yes |
| FP-NEG-006 | Validate error when invalid OTP is entered | P2 | No* | Yes |
| FP-NEG-007 | Validate error when passwords do not match | P2 | No* | Yes (need OTP step first) |
| FP-NEG-008 | Validate error when T&C not checked | P2 | No* | Yes (need OTP step first) |
| FP-NEG-009 | Validate error when password does not meet policy | P2 | No* | Yes (need OTP step first) |

*CRM not required for these negative tests, but they DO require successfully navigating to the OTP step first.

---

## Known Test Execution Constraints

1. **OTP Cooldown**: FP-002 through FP-009 (except FP-NEG-001 through FP-NEG-004) should not be run within 2 minutes of each other with the same user credentials.
2. **Positive + Negative Ordering**: Run positive tests before negative tests in the same session to avoid cooldown conflicts.
3. **Password State**: After FP-005 runs successfully, the account password changes to `FORGOT_PASSWORD_NEW_PASSWORD`. The next run of FP-006 (or login tests) must use this new password.
4. **CRM Dependency**: FP-003 through FP-006 require properly configured CRM_USERNAME and CRM_PASSWORD in .env.
