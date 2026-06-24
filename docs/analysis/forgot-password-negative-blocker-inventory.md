# Forgot Password Negative — Blocker Inventory

**Workflow Stage:** 2 — System Walkthrough and Locator Discovery  
**Date:** 2026-06-12  

---

## Active Blockers

### BLOCKER-NEG-01: Active Session Dialog

| Field | Details |
|-------|---------|
| ID | BLOCKER-NEG-01 |
| Type | Application popup |
| Trigger | Portal detects an active/existing session cookie when navigating to the login page |
| Visible text | "You have an active session. Do you want to close it?" |
| Impact | Blocks the FP button click if not dismissed |
| Screenshot | `reports/system-walkthrough/forgot-password-negative/01b-active-session-dialog.png` (if triggered) |
| Handler | `ForgotPasswordPage.dismissActiveSessionIfVisible()` — waits 5s for dialog, clicks Proceed if visible |
| Classification | Known application behavior — NOT a defect |

---

### BLOCKER-NEG-02: OTP Cooldown (NOT in Scope)

| Field | Details |
|-------|---------|
| ID | BLOCKER-NEG-02 |
| Type | Rate-limiting business rule |
| Impact | OTP cannot be re-sent within 2 minutes |
| Status | **OUT OF SCOPE** — No OTP send in negative demo |
| Notes | FP-NEG-001 to FP-NEG-007 do not send OTP; cooldown does not apply |

---

### BLOCKER-NEG-03: CRM Access (NOT in Scope)

| Field | Details |
|-------|---------|
| ID | BLOCKER-NEG-03 |
| Type | Environment configuration blocker |
| Impact | OTP retrieval from CRM is blocked |
| Status | **OUT OF SCOPE** — Negative demo does not use CRM |
| Notes | Can be added to the positive flow demo when CRM access is restored |

---

## No Blockers Expected During Negative Demo

The 7 negative demo tests (FP-NEG-001 through FP-NEG-007) do not send OTP and do not access CRM. The only potential blocker is the Active Session dialog (BLOCKER-NEG-01), which is automatically handled by `ForgotPasswordPage.navigate()`.
