# Transfer Module Navigation Map

Discovery Date: 2026-06-23

Scope: Transfers -> Local Transfers -> To Another SAIB Account

Evidence Directory: `reports/system-walkthrough/transfers-local-transfer/`

## Navigation Path

1. Dashboard after login
   - URL: `#/dashboard`
   - Evidence: `01-dashboard-after-login.png`, `01-dashboard-after-login.json`

2. Transfers landing page
   - Action: click sidebar `Transfers`
   - URL: `#/transfers/transfer-money`
   - Visible categories:
     - Between My Accounts
     - Local Transfers
     - Pay My Credit Card
     - International Transfers
   - Evidence: `02-after-transfers-click.png`, `02-after-transfers-click.json`

3. Local Transfers page
   - Action: click `Local Transfers`
   - URL: `#/transfers/local-transfers`
   - Visible sub-pages:
     - Instant Transfers
     - To Another SAIB Account
     - To Another Bank
     - To SAIB Card
   - Evidence: `03-after-local-transfers-click.png`, `03-after-local-transfers-click.json`

4. To Another SAIB Account form
   - Action: click `To Another SAIB Account`
   - URL: `#/transfers/to-another-saib-account`
   - Visible controls:
     - From Account
     - Choose Beneficiary
     - Add New
     - Send Currency
     - Transfer Amount
     - Quick amount buttons
     - Reason of Transfer
     - Schedule Transfer
     - Terms and Conditions
     - Continue
     - Cancel Transfer
   - Evidence: `04-after-to-another-saib-account-click.png`, `04-after-to-another-saib-account-click.json`

## Child Navigation Evidence

- From Account selector opened: `05-from-account-selector-opened.png`, `05-from-account-selector-opened.json`
- Add New Beneficiary popup opened: `06-add-new-beneficiary-opened.png`, `06-add-new-beneficiary-opened.json`
- Reason selector opened: `07-reason-selector-opened.png`, `07-reason-selector-opened.json`
- Schedule/Recurring probes captured: `08-schedule-transfer-selected.*`, `09-recurring-transfer-selected.*`

## Validation Result

`To Another SAIB Account` exists and is reachable through the manual path provided by the user.
