# KFH CVM Kiosk — System Walkthrough (skill 02)

**Env:** `demo03.cubicsystems.com:8443/KFH/KoiskPortalNew` (Kiosk, "New" variant) + `/KFH/AgentAndManagerPortalNew` (Agent).
**Date:** 2026-09-01 · Desk login `Cairo.Kiosk`. Evidence: `reports/system-walkthrough/kfh/kiosk/`.
**Stack:** Angular/PrimeNG SPA, all kiosk steps under `#/app-takenumber` (a 4-step stepper: Customer Details → Select Service → Select Sub Service → Ticket).

## Confirmed kiosk flow (all `<button>`s unless noted)

```
Login  ("Welcome to KFH CVM", labeled User Name / Password, button "login", + Select Language dropdown)
 → "Please Select Language"      [ English | عربي ]
 → "Please Select"  ★new★        [ Customer | Non-Customer ]        (+ Back)
 → "Please Select"  ★new★        [ Retail | Corporate | Special Needs / Senior ]
 → "Please Select"  ★new★        [ New ticket | Pre-booked ticket ]        ← always "New ticket"
 → "Please Enter Your Mobile Number or National ID"  ★new★  [ Mobile Number | National ID ] (clickable cards)  ← always "Mobile Number"
 → mobile keypad (1-9, 0, Delete, Next); enter "010"+8 digits; Next   (validates: "Please enter correct mobile number")
 → "Select Service"              [ Customer Services | Tellers | Operations ]
      → CONDITIONAL modal: "Expected waiting time is Nmin … Scan to go" [ Cancel | Proceed ] → click **Proceed**
 → "Select Sub Service"          sub-service CARDS (getByText); SINGLE click → auto-advances to Ticket
 → Ticket screen                 "Ticket Number <PREFIX>-<n>", "Service Name <service>", "Customers before you <n>", printer icon
 → (auto) "Printer not connected…" → AUTO-RETURNS to "Please Select Language" after ~10-12s   ← per-customer reset
```

**Key differences vs ABK kiosk:**
- KFH login is the "New" UI (User Name/Password/login + language dropdown); ABK was "Desk Login"/"Sign In".
- KFH ADDS 4 Customer-Details screens: Customer/Non-Customer, Segment, Ticket Type, Identification Method. (ABK had none of these.)
- Sub-service is SINGLE-select cards that auto-generate the ticket. ABK was multi-select buttons + Continue + ticket-format + summary + Confirm. KFH has **no** ticket-format/summary/confirm screens.
- Reset is **auto-return to language** (~12s); ABK used a "Main Menu" button.
- Service selection may raise a **wait-time Cancel/Proceed modal** (KFH-specific) — handle with Proceed.

## Service → Sub-service catalog (UI = source of truth)

| Main service | Sub-services (exact UI text) |
|---|---|
| **Tellers** | Deposits Below 1.5 Million · Deposits Above 1.5 Million · Cash Withdrawals · Combined Transactions |
| **Operations** | Cheque Book · Cheque Collection · Transfers · Others |
| **Customer Services** | Certificate of Deposits · New Accounts · Investment Produsts · KYC Updates · Time Deposits · Dormant Accounts · Credit Cards · Others |

- "Investment Produsts" — same app typo as ABK; match exactly.
- Ticket prefix confirmed: **Tellers = `T-`** (T-501). Operations / Customer Services prefixes not yet observed → capture the actual ticket number and correlate by number + Service Name (don't hard-assert unknown prefixes).

## Locator strategy
Buttons: `getByRole('button', { name, exact:true })` (services, language, customer type, segment, ticket type, digits, Next, Proceed). Cards: `getByText(label, { exact:true })` (Mobile Number/National ID, sub-service tiles). Ticket number: regex `/[A-Z]-\d+/` from the ticket card. Stepper heading is generic ("Please Select") — gate on the option labels, not the heading.

## Agent Portal
`AgentAndManagerPortalNew` — "New" variant; serving flow to be discovered (login, desk assignment, home, serve). Reuse target = ABK `AgentQueuePage`/`AgentLoginPage`; adapt locators if the New portal differs.
