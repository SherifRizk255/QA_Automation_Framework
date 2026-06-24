# Forgot Password Negative — Navigation Map

**Workflow Stage:** 2 — System Walkthrough and Locator Discovery  
**Date:** 2026-06-12  

---

## Navigation Path for Negative Demo Tests

```
Start: Portal base URL
  │
  ▼ page.goto(PORTAL_BASE_URL + PORTAL_LOGIN_PATH)
  │
Login Page (#/login)
  │  [if active session dialog appears → dismiss via Proceed button]
  │
  ▼ Click button[name=/forgot.*password/i]
  │
  ▼ waitForURL(/forget-password/, { timeout: 15000 })
  │
Forgot Password Form — Step 1 (#/forget-password)
  │
  ├─ Scenario A (FP-NEG-001): Leave username empty → assert Send OTP disabled
  ├─ Scenario B (FP-NEG-002): Leave National ID empty → assert Send OTP disabled
  ├─ Scenario C (FP-NEG-005): Both fields empty → assert Send OTP disabled
  ├─ Scenario D (FP-NEG-003): Fill invalid username → click Send OTP → assert error
  ├─ Scenario E (FP-NEG-004): Fill invalid NID → click Send OTP → assert error
  ├─ Scenario F (FP-NEG-006): Fill invalid data → click Send OTP → assert URL unchanged
  └─ Scenario G (FP-NEG-007): Assert password reset form NOT visible (gate check)
```

---

## Navigation Steps (Per Test)

Each test navigates independently (no shared state between tests):

1. `fpPage.navigate()` — goes to login, dismisses active session if needed, clicks FP button, waits for URL
2. Perform the specific negative action
3. Assert the expected negative behavior
4. Test ends — browser context is closed

---

## Known Navigation Blockers

| Blocker | Trigger | Handler |
|---------|---------|---------|
| Active session dialog | Portal detects existing session cookie | `dismissActiveSessionIfVisible()` in `ForgotPasswordPage.navigate()` |
| OTP cooldown (out of scope) | Rapid repeated OTP sends | `handleOtpCooldownIfVisible()` — not needed for this demo |
