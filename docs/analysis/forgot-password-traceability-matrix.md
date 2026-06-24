# Forgot Password - Requirement Traceability Matrix

## Analysis Date: 2026-06-12

---

## Traceability: Requirements → Test Cases

| Requirement ID | Requirement Description | Test Case(s) | Automation |
|---------------|------------------------|-------------|-----------|
| FP-REQ-001 | User can open Forgot Password screen from login page | FP-001 | fp-positive.spec.ts |
| FP-REQ-002 | User can send OTP with valid username and National ID | FP-002 | fp-positive.spec.ts |
| FP-REQ-003 | System sends OTP via SMS; CRM SMS Log captures it | FP-003 | fp-positive.spec.ts |
| FP-REQ-004 | User can verify OTP successfully | FP-004 | fp-positive.spec.ts |
| FP-REQ-005 | User can reset password with valid OTP, matching passwords, T&C checked | FP-005 | fp-positive.spec.ts |
| FP-REQ-006 | User can login with the newly reset password | FP-006 | fp-positive.spec.ts |
| FP-VAL-001 | Username is mandatory for OTP send | FP-NEG-001 | fp-negative.spec.ts |
| FP-VAL-002 | National ID is mandatory for OTP send | FP-NEG-002 | fp-negative.spec.ts |
| FP-VAL-003 | Invalid username produces error | FP-NEG-003 | fp-negative.spec.ts |
| FP-VAL-004 | Invalid National ID produces error | FP-NEG-004 | fp-negative.spec.ts |
| FP-VAL-005 | OTP field is mandatory | FP-NEG-005 | fp-negative.spec.ts |
| FP-VAL-006 | Invalid/expired OTP produces error | FP-NEG-006 | fp-negative.spec.ts |
| FP-VAL-007 | Password and confirm password must match | FP-NEG-007 | fp-negative.spec.ts |
| FP-VAL-008 | Terms and Conditions must be accepted | FP-NEG-008 | fp-negative.spec.ts |
| FP-VAL-009 | New password must meet policy | FP-NEG-009 | fp-negative.spec.ts |

---

## Traceability: Test Cases → Source

| Test Case ID | Test Name | Source Requirement | File |
|-------------|-----------|-------------------|------|
| FP-001 | Validate user can open Forgot Password screen | FP-REQ-001 | forgot-password-positive.spec.ts |
| FP-002 | Validate user can send OTP with valid username and National ID | FP-REQ-002 | forgot-password-positive.spec.ts |
| FP-003 | Validate user can retrieve OTP from CRM SMS Log | FP-REQ-003 | forgot-password-positive.spec.ts |
| FP-004 | Validate user can verify OTP successfully | FP-REQ-004 | forgot-password-positive.spec.ts |
| FP-005 | Validate user can reset password successfully | FP-REQ-005 | forgot-password-positive.spec.ts |
| FP-006 | Validate user can login with newly reset password | FP-REQ-006 | forgot-password-positive.spec.ts |
| FP-NEG-001 | Validate error when username is empty | FP-VAL-001 | forgot-password-negative.spec.ts |
| FP-NEG-002 | Validate error when National ID is empty | FP-VAL-002 | forgot-password-negative.spec.ts |
| FP-NEG-003 | Validate error when invalid username entered | FP-VAL-003 | forgot-password-negative.spec.ts |
| FP-NEG-004 | Validate error when invalid National ID entered | FP-VAL-004 | forgot-password-negative.spec.ts |
| FP-NEG-005 | Validate error when OTP is empty | FP-VAL-005 | forgot-password-negative.spec.ts |
| FP-NEG-006 | Validate error when invalid OTP entered | FP-VAL-006 | forgot-password-negative.spec.ts |
| FP-NEG-007 | Validate error when passwords do not match | FP-VAL-007 | forgot-password-negative.spec.ts |
| FP-NEG-008 | Validate error when T&C not checked | FP-VAL-008 | forgot-password-negative.spec.ts |
| FP-NEG-009 | Validate error when password does not meet policy | FP-VAL-009 | forgot-password-negative.spec.ts |

---

## Coverage Summary

| Category | Count |
|----------|-------|
| Positive test cases | 6 |
| Negative test cases | 9 |
| Total test cases | 15 |
| CRM-dependent tests | 4 (FP-003, FP-004, FP-005, FP-006) |
| Portal-only tests | 11 |
| Fully automated | 15 |
