# Forgot Password Negative — Automation Coverage

**Workflow Stage:** 3 — Test Case Design  
**Date:** 2026-06-12  
**Demo Scope:** Negative scenarios only — no CRM, no OTP  

---

## Coverage Summary

| Category | Count |
|----------|-------|
| Total negative scenarios designed | 7 |
| Total automated test cases | 7 |
| Automation coverage | 100% |
| CRM-dependent tests | 0 |
| OTP-dependent tests | 0 |
| Tests that change user data | 0 |
| Tests that expose sensitive data | 0 |

---

## Test File Mapping

| Test ID | Title | File | Dependencies |
|---------|-------|------|-------------|
| FP-NEG-001 | Empty username — button disabled | forgot-password-negative.spec.ts | ForgotPasswordPage.ts |
| FP-NEG-002 | Empty National ID — button disabled | forgot-password-negative.spec.ts | ForgotPasswordPage.ts |
| FP-NEG-003 | Invalid username — error shown | forgot-password-negative.spec.ts | ForgotPasswordPage.ts |
| FP-NEG-004 | Invalid National ID — error shown | forgot-password-negative.spec.ts | ForgotPasswordPage.ts |
| FP-NEG-005 | Both fields empty — button blocked | forgot-password-negative.spec.ts | ForgotPasswordPage.ts |
| FP-NEG-006 | User stays on FP screen after error | forgot-password-negative.spec.ts | ForgotPasswordPage.ts |
| FP-NEG-007 | Password reset gate — no OTP no reset | forgot-password-negative.spec.ts | ForgotPasswordPage.ts |

---

## Page Objects Used

| Page Object | File | Used By |
|-------------|------|---------|
| ForgotPasswordPage | pages/portal/ForgotPasswordPage.ts | All 7 tests |

## Utilities Used

| Utility | Purpose | Used By |
|---------|---------|---------|
| sensitiveDataMasker | Mask NID in logs | FP-NEG-002, 003, 004, 006 |
| failureHandler | Capture screenshot on failure | All 7 tests |

---

## Out of Scope for This Demo

| Area | Reason |
|------|--------|
| OTP entry and verification | Requires CRM access |
| CRM SMS Log retrieval | CRM access blocked |
| Password reset (positive flow) | Out of demo scope |
| FP-NEG-008 / FP-NEG-009 (old) | Were CRM-dependent; removed for demo |
