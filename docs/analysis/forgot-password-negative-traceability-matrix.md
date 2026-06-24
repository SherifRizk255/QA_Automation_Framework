# Forgot Password Negative — Traceability Matrix

**Workflow Stage:** 1 — Requirement and Project Data Analysis  
**Date:** 2026-06-12  

---

## Matrix

| Test ID | Test Name | Requirement | Business Rule | Automation |
|---------|-----------|-------------|---------------|-----------|
| FP-NEG-001 | Empty username — button disabled | REQ-NEG-01 | BR-01 | ✅ Automated |
| FP-NEG-002 | Empty National ID — button disabled | REQ-NEG-01 | BR-01 | ✅ Automated |
| FP-NEG-003 | Invalid username — error shown | REQ-NEG-02 | — | ✅ Automated |
| FP-NEG-004 | Invalid National ID — error shown | REQ-NEG-02 | — | ✅ Automated |
| FP-NEG-005 | Both fields empty — button blocked | REQ-NEG-01 | — | ✅ Automated |
| FP-NEG-006 | User stays on FP screen after error | REQ-NEG-03 | — | ✅ Automated |
| FP-NEG-007 | Password reset not accessible without OTP | REQ-NEG-04 | BR-02 | ✅ Automated |

---

## Coverage Summary

| Category | Count |
|----------|-------|
| Requirements covered | 4 (REQ-NEG-01 through 04) |
| Business rules covered | 2 (BR-01, BR-02) |
| Automated test cases | 7 |
| Manual test cases | 7 |
| CRM-dependent tests | 0 |
| Demo coverage | 100% of in-scope negative scenarios |
