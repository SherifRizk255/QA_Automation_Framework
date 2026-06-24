# Forgot Password - Blocker Inventory

## Discovery Date: 2026-06-12

---

## Confirmed Blockers

### BLOCKER-001: OTP Cooldown (Application Business Rule)

| Property | Detail |
|----------|--------|
| Trigger | Clicking "SEND OTP" within 2 minutes of previous OTP send for same user |
| API Response | HTTP 400 on `POST /auth/methods/send` |
| Toast Message | "An error occurred while sending the OTP. Please try again." |
| Impact | Prevents test re-runs within 2-minute window |
| Type | Application business rule — NOT an automation defect |
| Handling | Detect the toast error; capture screenshot; annotate test with type=blocker; do NOT retry in automation |
| Test Impact | FP-002 will fail if run again within 2 minutes of previous successful Send OTP |

---

### BLOCKER-002: Active Session Dialog (Known from Login Flow)

| Property | Detail |
|----------|--------|
| Trigger | Previous session still active when logging in |
| Dialog Text | "You have an active session. Do you want to close it?" |
| Impact | Blocks login until handled |
| Type | Application behavior — handled by `LoginPage.ts` existing logic |
| Handling | Existing `handleActiveSessionPopupIfVisible()` in LoginPage.ts handles this |

---

### BLOCKER-003: Theme API Error (Non-Blocking)

| Property | Detail |
|----------|--------|
| Trigger | Application startup |
| HTTP Status | 500 on `/api/v1/masterdata/configuration-theme` |
| Toast | "Error fetching theme" |
| Impact | Visual theme may not load; functional flow continues |
| Type | Application environment issue — does NOT block test execution |
| Handling | Log and continue; do not fail tests due to this error |

---

### BLOCKER-004: CRM Credentials Not Configured

| Property | Detail |
|----------|--------|
| Trigger | CRM_USERNAME / CRM_PASSWORD set to placeholder values in .env |
| Impact | Tests FP-003, FP-004, FP-005, FP-006 cannot proceed |
| Type | Configuration / environment issue |
| Handling | Tests check for placeholder credentials and skip with clear message; document as configuration blocker |

---

## Business Blocker Handling Rules (from automation requirements)

1. Detect blockers through visible text or accessible controls.
2. Capture screenshot evidence before handling.
3. Attach screenshot to Playwright report via `testInfo.attach()`.
4. Continue flow after approved blocker handling (session popup only).
5. Document all blockers in test annotations and reports.
6. Do NOT silently ignore any blocker.
7. OTP cooldown: classify as application behavior, not automation failure.
