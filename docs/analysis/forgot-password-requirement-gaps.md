# Forgot Password - Requirement Gaps

## Analysis Date: 2026-06-12

---

## Open Questions / Gaps

| Gap ID | Area | Description | Impact | Status |
|--------|------|-------------|--------|--------|
| GAP-001 | Password Policy | Exact password policy rules (min length, required character types) are not documented | Cannot fully automate FP-NEG-009 without knowing policy constraints | Open |
| GAP-002 | OTP Expiry Window | OTP validity duration is not specified | Risk of test timing out between CRM retrieval and portal entry | Open |
| GAP-003 | OTP Digit Count | Number of digits in OTP is not specified (4, 6, 8 digits?) | Regex may need adjustment after first real run | Open |
| GAP-004 | CRM Authentication Type | CRM authentication mechanism not documented (Microsoft SSO, NTLM, basic auth?) | CRM login automation cannot be finalized until verified | Open |
| GAP-005 | CRM Credentials | CRM_USERNAME and CRM_PASSWORD in .env are placeholders | Tests FP-003 through FP-006 will be blocked without real CRM credentials | Blocked |
| GAP-006 | Error Message Wording | Exact portal error messages for negative scenarios are not documented | Assertions for negative tests use partial/regex match — may need tuning after first run | Open |
| GAP-007 | Password Reset Success Message | Exact text of success message not specified | Assertion uses regex pattern — may need adjustment | Open |
| GAP-008 | Session State After Reset | Whether portal auto-logs in after reset or requires manual login is unspecified | FP-006 login test approach depends on this | Open |
| GAP-009 | Terms and Conditions Checkbox | Whether T&C links to a modal/popup before checking is unknown | Test may need to handle T&C modal if present | Open |
| GAP-010 | OTP Resend | Whether a resend OTP feature exists is not specified | No resend test case currently designed | Out of Scope |
| GAP-011 | Account Lock-out | Whether failed OTP attempts trigger account lock is not documented | No lock-out test designed | Out of Scope |
| GAP-012 | Password Reset With Currently Active Session | Behavior when user attempts forgot password while already logged in is unknown | Not tested in current scope | Out of Scope |

---

## Resolved Gaps / Assumptions Made

| Gap | Resolution |
|-----|-----------|
| OTP regex format | Using `/Please use the following OTP to complete your authentication:\s*(\d+)/i` — will validate after first real CRM extraction |
| Success message assertion | Using `/password.*reset.*successful|successfully.*reset|reset.*successful/i` — will validate on first positive run |
| Password policy | Assuming `Test@2026` satisfies policy (uppercase T, lowercase est, digit 2026, special char @) |
| CRM sort order | Assuming list defaults to newest-first; will verify during walkthrough stage |

---

## Blockers That Prevent Full Automation

| Blocker ID | Description | Affected Tests | Workaround |
|------------|-------------|----------------|-----------|
| BLOCKER-001 | CRM credentials not configured in .env | FP-003, FP-004, FP-005, FP-006 | Configure CRM_USERNAME and CRM_PASSWORD in .env before running |
| BLOCKER-002 | OTP delivery depends on live SMS service | FP-003, FP-004, FP-005, FP-006 | Requires live environment with active SMS gateway |
