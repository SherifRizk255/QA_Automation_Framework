# CVM Multi-Portal — System Walkthrough (skill 02)

**Environment:** `demo03.cubicsystems.com:8443/ABK-CVM` — Kiosk Portal + Agent & Management Portal.
**Date:** 2026-08-20 · **Method:** Playwright discovery scripts (`.env` creds), evidence in `reports/system-walkthrough/cvm/{kiosk,agent}/`.
**Stack:** Angular SPA (PrimeNG), hash-routed. Post-login kiosk under `#/kiosk`; agent under `#/app-home`.
**Status:** Kiosk flow **complete**; Agent flow **complete** (only the post-Confirm "served" success toast is inferred, to verify on first real run).

---

## 1. Kiosk Portal — confirmed flow

```
Desk Login  (labels User Name / Password, button "Sign In"; Sign In disabled until filled)
  → "Please select your language"     [ English | العربية | Exit ]
  → "Please enter your mobile number"  on-screen keypad, 11 digits (010 + 8), [Back | Next(disabled until valid)]
  → "Please select a service"          [ Customer Services | Operations | Tellers | Back ]
  → "Select your sub-services"  ★NEW★  MULTI-select cards, [ Back | Continue(disabled until ≥1) ]
  → "Go Green" ticket format           [ Digital ticket (SMS) | Printed ticket | Back ]
  → SUMMARY screen (heading = service)  shows SUB-SERVICES, TICKET DELIVERY, Waiting Time, Customers Ahead, Available Desks; [ Back | Confirm ]
  → "Printing your ticket" (transient)
  → TICKET screen:  "Your Number: <PREFIX>-<n>", Service Name, Customers Ahead, Estimated Waiting Time, Issued at; [ Retry printing | Main Menu ]
  → Main Menu → back to language screen (per-customer reset)
```

**Removed vs legacy:** customer-type/segment screen and QR-scanner "Skip" screen.
**Use "Printed ticket"** in automation — avoids sending an SMS to the (random) mobile number. "printing failed" on the demo box (no printer) is expected and does NOT block getting the ticket number.

### Service → Sub-service catalog (UI = source of truth)

| Main service | Sub-services (exact UI text) |
|---|---|
| **Tellers** | Cash Withdrawals · Combined Transactions · Deposits Above 1.5 Million · Deposits Below 1.5 Million |
| **Operations** | Cheque Book · Cheque Collection · Others · Trade Finance · Transfers |
| **Customer Services** | Certificate of Deposits · Credit Cards · Dormant Accounts · Investment Produsts · KYC Updates · New Accounts · Others · Time Deposits |

**Differences vs prompt §7:** labels are plural; Tellers has 4 (not 8); Operations set differs; **`Investment Produsts`** is an app typo (use exact string, flag to devs).

---

## 2. Agent Portal — confirmed flow

```
Login  (headings Username / Password, button "login")
  → Desk-assignment screen:  "Welcome Back <user>", Current Branch (e.g. Madinety), Current Desk (e.g. 06); [ Confirm | Change ]
  → Home (#/app-home):  "Hello <user>", <service area> (e.g. Operations), "Max Serving Time (60) min"
        NEXT SERVING → Ticket Number: <next queued ticket>      (FIFO)
        CURRENT TICKET → Ticket Number: <serving> | "No tickets to serve"
        [ Customers In Queue | Next | Ticket Served ]  (+ Delay Ticket / Cancel Ticket while serving)
  → "Next"  → calls next customer (FIFO) → Current Ticket = that ticket
             (if already serving → confirm dialog "Forbbiden Action — You are still working on a customer")
  → "Ticket Served"  → dialog cards [ Done | Routing | Cancel ]
  → "Done" (card, not a <button>)  → "summary of services" dialog:
        "Select Sub-Services" MULTISELECT (full union of ALL sub-services) + Notes + [ Cancel | Confirm(disabled until ≥1) ]
  → select served sub-service(s) → "Confirm"  → ticket completed → home idle
```

**Correlation model (the whole point):**
`Customer → mainService → subService(s) → kiosk ticket "<PREFIX>-<n>" → agent queue (Next Serving/Current Ticket number) → served sub-service confirm → completion`
- **Ticket prefix encodes the service:** Tellers → `T-`, Operations → `O-`, Customer Services → `C-` (observed T-514, O-402). Strong correlation key.
- Agent routing (segments removed): **Tellers → Teller1 · Operations → CS2 · Customer Services → CS3**.
- The agent completion multiselect contains every sub-service, so the customer's kiosk sub-service is selectable by exact name.

---

## 3. Locator strategy (stable — skill 02 / brief §6). No absolute XPath.

| Element | Locator |
|---|---|
| Desk user / password | `form input` (nth 0) / `input[type=password]` (no name/id — MEDIUM) |
| Sign In / login | `getByRole('button', { name: /sign in/i })` / `/login/i` |
| Any service / sub-service / language / digit | `getByRole('button', { name: '<exact label>', exact: true })` |
| Keypad clear / delete | `getByRole('button', { name: 'Clear number' / 'Delete last digit' })` (aria) |
| Kiosk ticket number | text matching `/^[A-Z]-\d+$/` on the ticket screen |
| Screen gate | `getByRole('heading', { name: '<screen title>' })` |
| Agent "Done"/"Routing" | `.p-dialog >> getByText('Done'/'Routing', { exact:true })` (cards) |
| Agent served sub-service | PrimeNG multiselect inside the "summary of services" p-dialog; select item by exact text; **close panel without Escape** (Escape dismisses the dialog) |

Disabled Continue/Next/Confirm buttons are natural state gates → rely on Playwright auto-wait, never sleeps.

---

## 4. Blockers / risks

| Item | Note |
|---|---|
| **Desk & agent login throttle** | ~6 logins/hr per account → "exceeded maximum login attempts … one hour". Locked `Teller1` and `Teller3` during discovery. Real test logs in once/run (safe); **dev must reuse a saved session** (skill 19) and not re-run rapidly. |
| Demo server latency | occasional slow navigations (60s+); use generous navigation timeout. |
| PrimeNG confirm/dialog masks | intercept clicks until handled; accept confirms (`.p-confirm-dialog-accept`) before next action. |
| "Forbbiden Action" | agent can't call Next while a customer is current — finish current first. |

---

## 5. PLAYWRIGHT_HANDOFF

```
Pages:
  - KioskLoginPage, KioskJourneyPage (language, mobile keypad, service, sub-service, ticket format, summary, ticket)
  - AgentLoginPage (login + desk-assignment confirm), AgentQueuePage (home, next, serve, done/routing, summary sub-service confirm)

Recommended Page Objects:
  - pages/cvm/kiosk/KioskLoginPage.ts, pages/cvm/kiosk/KioskJourneyPage.ts
  - pages/cvm/agent/AgentLoginPage.ts, pages/cvm/agent/AgentQueuePage.ts

Data:
  - data/cvm/serviceCatalog.ts (service → sub-services + agent + ticket prefix)
  - data/cvm/distribution.ts (round-robin over service×sub-service combos)

Correlation keys captured at kiosk: ticketNumber (PREFIX-n), mainService, subService, mobile, issuedAt.
```
