# Forgot Password Negative — Requirement Gaps

**Workflow Stage:** 1 — Requirement and Project Data Analysis  
**Date:** 2026-06-12  

---

## Gap Summary

| Gap ID | Description | Severity | Impact |
|--------|-------------|----------|--------|
| NEG-GAP-001 | Exact validation error message text is not documented | Medium | Test assertions use regex patterns; exact text may differ |
| NEG-GAP-002 | Invalid input format rules for username are not specified | Low | Cannot test format-specific validation (length, special chars) |
| NEG-GAP-003 | Whether error differentiates username vs National ID mismatch is unknown | Medium | Security concern — combined error protects enumeration attacks |
| NEG-GAP-004 | Timeout behavior on the FP screen is not documented | Low | No session timeout testing in scope |
| NEG-GAP-005 | Input field character limits (other than NID maxlength=14) are not specified | Low | Username max length not confirmed |
| NEG-GAP-006 | Whether the OTP step can be reached directly via URL manipulation is not tested | Low | Deep-link access control not in current scope |

---

## Handling Strategy for Gaps

| Gap | Strategy |
|-----|---------|
| NEG-GAP-001 | Use regex assertions `/error|invalid|not found|incorrect/i` to handle any valid error message text. Capture actual text in screenshots for documentation. |
| NEG-GAP-002 | Use known invalid data: `INVALID_USER_XYZ_999` for username, `00000000000000` (14 zeros) for National ID. |
| NEG-GAP-003 | Assert that ANY error is shown; do not assert on specific field attribution. |
| NEG-GAP-004 | Out of scope for this demo. |
| NEG-GAP-005 | No length-limit tests included in this demo. |
| NEG-GAP-006 | Out of scope for this demo. |
