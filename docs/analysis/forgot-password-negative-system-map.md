# Forgot Password Negative — System Map

**Workflow Stage:** 2 — System Walkthrough and Locator Discovery  
**Date:** 2026-06-12  
**Discovery Method:** Playwright headed browser, live DOM inspection  

---

## Application Architecture

| Property | Value |
|----------|-------|
| Framework | Angular 15+ SPA |
| Component library | PrimeNG |
| Routing | Hash routing (`#/`) |
| Form handling | Angular Reactive Forms (`FormGroup`, `FormControl`) |
| Validation | Angular built-in validators (Validators.required) |
| API | REST; OTP send via `POST /auth/methods/send` |

---

## Forgot Password — Multi-Step Architecture (Negative Demo Scope)

```
Login Page (#/login)
     │
     ▼ [Click "FORGOT PASSWORD?" button]
     │
Forgot Password — Step 1: Credentials (#/forget-password)
     │   Username field [required]
     │   National ID field [required, maxlength=14]
     │   Send OTP button [disabled when either field empty]
     │
     ├─ [NEGATIVE PATH] Invalid username/NID → Error toast → STAY on Step 1
     ├─ [NEGATIVE PATH] Empty fields → Send OTP button disabled
     ├─ [GATE CHECK] Password reset form NOT visible at Step 1
     │
     ▼ [Valid credentials → Send OTP → 200 OK]
     │
Forgot Password — Step 2: OTP Entry (#/forget-password, in-place)
     │   [OUT OF DEMO SCOPE]
     │
     ▼ [Valid OTP → Verify]
     │
Forgot Password — Step 3: Password Reset (#/forget-password, in-place)
     │   [OUT OF DEMO SCOPE]
```

---

## URL Map

| Screen | URL Pattern | Route Guard |
|--------|-------------|-------------|
| Login | `#/login` | None |
| Forgot Password | `#/forget-password` | Reachable via button click from login |
| Dashboard (post-login) | `#/dashboard` or similar | AuthGuard |

---

## Key Application Behaviors (Negative Scope)

| Behavior | Observation |
|----------|-------------|
| Send OTP button disabled with empty fields | Angular reactive form `[disabled]` binding; confirmed via `isEnabled()` returning `false` |
| Send OTP button enabled only when both fields have values | Form validity check; `form.valid` drives button state |
| Invalid credentials return error | HTTP 4xx from backend; surfaced as PrimeNG toast |
| URL does not change on error | Single-page, Angular router does NOT navigate away on API error |
| Password reset form not shown before OTP | Step 2 is shown in-place only after successful `POST /auth/methods/send` |
