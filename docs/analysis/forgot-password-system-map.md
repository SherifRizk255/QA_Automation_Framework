# Forgot Password - System Map

## Discovery Date: 2026-06-12
## Method: Playwright headed browser inspection + network log analysis

---

## Application Overview

| Property | Value |
|----------|-------|
| Application | Internet Banking Retail Portal |
| Technology | Angular SPA (PrimeNG component library) |
| Base URL | `PORTAL_BASE_URL` (env) |
| Routing | Client-side hash routing (`#/`) |
| API Base | `https://demo03.cubicsystems.com:8443/Saib/Channels/Internet-Banking-Retail-APIs-UAT/api/v1/` |

---

## API Endpoints Discovered (Forgot Password Flow)

| Step | Method | Endpoint | Expected Status |
|------|--------|----------|----------------|
| Validate credentials | POST | `/auth/forget-password` | 200 |
| Send OTP | POST | `/auth/methods/send` | 200 (400 if cooldown active) |
| Verify OTP | POST | (inferred) `/auth/methods/verify` or `/auth/otp/verify` | 200 |
| Reset Password | POST | (inferred) `/auth/reset-password` or `/auth/change-password` | 200 |

---

## OTP Cooldown Business Rule

- **Rule**: Only one OTP can be active per user at a time
- **Cooldown**: 2 minutes after OTP send before a new OTP can be requested
- **Error on violation**: HTTP 400 — toast message: "An error occurred while sending the OTP. Please try again."
- **Implication for automation**: Test must wait 2+ minutes between OTP re-send attempts; test data should not be reused within the cooldown window
- **Classification**: Application business rule — NOT an automation bug

---

## Screens Discovered

| Screen ID | Screen Name | Route | Notes |
|-----------|-------------|-------|-------|
| SCR-001 | Login Page | `#/login` | Entry point |
| SCR-002 | Forgot Password Form | `#/forget-password` | Step-based form; stays at same URL across steps |
| SCR-003 | OTP Entry Step | `#/forget-password` (step 2) | Appears in-place after successful Send OTP |
| SCR-004 | Password Reset Step | `#/forget-password` (step 3) | Appears in-place after OTP verification |
| SCR-005 | Success Screen | `#/forget-password` (step 4) | Password reset confirmation |
| SCR-006 | Dashboard | `#/dashboard` or similar | After login with new password |

---

## Known Application Errors / Non-Blocking Issues

| Error | HTTP Status | Message | Type |
|-------|-------------|---------|------|
| Theme fetch failure | 500 | "Error fetching theme" | Non-blocking UI error — does not affect functionality |
| OTP cooldown | 400 | "An error occurred while sending the OTP. Please try again." | Expected business behavior |
