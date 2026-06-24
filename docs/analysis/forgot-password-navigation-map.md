# Forgot Password - Navigation Map

## Discovery Date: 2026-06-12

---

## Navigation Flow

```
[Portal Login Page]  #/login
        │
        │  Click "FORGOT PASSWORD?" button
        ▼
[Forgot Password Page]  #/forget-password  ◄─── stays at same URL for all steps
        │
        │  Step 1: Fill Username + National ID
        │  Click "SEND OTP"
        │  → POST /auth/forget-password (200 OK)
        │  → POST /auth/methods/send (200 OK) 
        │     [400 if OTP cooldown active → toast error, stay on Step 1]
        ▼
[OTP Entry]  #/forget-password  (Step 2 — in-place, same route)
        │
        │  Enter OTP digits
        │  Click "VERIFY"
        │  → POST /auth/methods/verify (or similar)
        ▼
[Password Reset Form]  #/forget-password  (Step 3 — in-place, same route)
        │
        │  Enter New Password
        │  Enter Confirm Password
        │  Check Terms & Conditions
        │  Click "RESET PASSWORD"
        ▼
[Success Screen]  #/forget-password  (Step 4 — in-place, same route)
        │
        │  Click "Back To Logon"
        ▼
[Portal Login Page]  #/login
        │
        │  Login with new password
        ▼
[Dashboard]
```

---

## Key Navigation Notes

1. The Forgot Password route is `#/forget-password` (note: "forget" not "forgot")
2. Direct navigation to `#/forget-password` does NOT work — Angular router guard likely redirects to `#/login`
3. Must enter via login page → click "FORGOT PASSWORD?" button → `waitForURL(/forget-password/)`
4. All steps (1-4) of the forgot password flow stay at the same URL: `#/forget-password`
5. Step transitions are in-place Angular component state changes, NOT route changes
6. OTP cooldown: 2-minute wait required between OTP send attempts

---

## Back Navigation

- "Back" link on the forgot password page → navigates back to `#/login`
- This clears the OTP session context — clicking "FORGOT PASSWORD?" again within 2 minutes triggers cooldown error
