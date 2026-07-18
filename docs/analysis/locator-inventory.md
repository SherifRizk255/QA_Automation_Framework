# Transfer Module Locator Inventory

Discovery Date: 2026-06-23

Discovery Scope: Transfer module, Local Transfers, To Another SAIB Account.

Discovery Sources:

- Discovery tool: `scripts/discovery/transfers/local-transfer-navigation.ts`
- Live Playwright DOM walkthrough from Dashboard to `#/transfers/to-another-saib-account`
- Screenshots and DOM captures under `reports/system-walkthrough/transfers-local-transfer/`
- Existing Transfer Between My Accounts automation evidence
- Locator repository validation artifacts

## Repository Statistics

- Total repository entries: 26
- Active entries: 26
- High confidence entries: 14
- Medium confidence entries: 12
- Low confidence entries: 0
- Reopened subflow: Local Transfer -> To Another SAIB Account
- Remaining data/transaction-safety blocked cases: 9

## Newly Validated Local Transfer Elements

| Element ID | Element Name | Screen | Locator Type | Primary Locator | Fallback Chain | Confidence | Volatility | Source | Last Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRANSFER.LOCAL_TRANSFERS_CARD | Local Transfers Card | Transfer Money | ACCESSIBILITY | `getByRole('button', { name: /local transfers/i })` | `.transfer-card:has-text("Local Transfers")` | HIGH | LOW | Live DOM | 2026-06-23 |
| TRANSFER.TO_ANOTHER_SAIB_ACCOUNT_CARD | To Another SAIB Account Card | Local Transfers | ACCESSIBILITY | `getByRole('button', { name: /to another saib account/i })` | `.lt-type-card:has-text("To Another SAIB Account")` | HIGH | LOW | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_TRANSFER_FORM | Transfer to SAIB Account Form | Transfer to SAIB Account | CSS | `.page-wrapper:has-text("Transfer to SAIB Account")` | `.page-body:has-text("From Account")` | HIGH | MEDIUM | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_FROM_ACCOUNT_SELECTOR | From Account Selector | Transfer to SAIB Account | CSS | `.card-group:has-text("From Account") .account-selector` | `getByText(/select source account/i)` | MEDIUM | MEDIUM | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_BENEFICIARY_SELECTOR | Beneficiary Selector | Transfer to SAIB Account | CSS | `.beneficiary-selection-list .account-selector` | `.card-group:has-text("Choose Beneficiary") .account-selector` | MEDIUM | MEDIUM | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_ADD_NEW_BENEFICIARY_LINK | Add New Beneficiary Link | Transfer to SAIB Account | CSS | `.add-new-link` | `getByText(/^Add New$/i)` | HIGH | MEDIUM | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_AMOUNT_INPUT | Transfer Amount Input | Transfer to SAIB Account | CSS | `input[formcontrolname="amount"]` | `.amount-input` | HIGH | LOW | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_QUICK_AMOUNT_BUTTONS | Quick Amount Buttons | Transfer to SAIB Account | CSS | `.quick-amount-btn` | `getByRole('button', { name: /\+EGP/i })` | HIGH | LOW | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_REASON_SELECTOR | Reason of Transfer Selector | Transfer to SAIB Account | ACCESSIBILITY | `getByRole('combobox', { name: /select a reason/i })` | `.field-group:has-text("Reason of Transfer") [role="combobox"]` | HIGH | LOW | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_SUMMARY_CARD | Transfer Summary Card | Transfer to SAIB Account | CSS | `.summary-card` | `.summary-column` | MEDIUM | MEDIUM | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_TERMS_CHECKBOX | Terms Checkbox | Transfer to SAIB Account | CSS | `#anotherSaibTerms` | `.p-checkbox-input` | HIGH | LOW | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_CONTINUE_BUTTON | Continue Button | Transfer to SAIB Account | CSS | `.continue-btn` | `getByRole('button', { name: /^continue$/i })` | HIGH | MEDIUM | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_CANCEL_BUTTON | Cancel Transfer Button | Transfer to SAIB Account | CSS | `.cancel-btn` | `getByRole('button', { name: /cancel transfer/i })` | HIGH | MEDIUM | Live DOM | 2026-06-23 |
| TRANSFER.SAIB_ADD_BENEFICIARY_DIALOG | Add New Beneficiary Dialog | Add New Beneficiary | CSS | `.p-dialog:has-text("Add New Beneficiary")` | `getByText(/Add New Beneficiary/i)` | MEDIUM | MEDIUM | Live DOM | 2026-06-23 |

## Reused Elements

- `TRANSFER.SIDEBAR_TRANSFERS_LINK`
- `TRANSFER.HUB_HEADING`
- `TRANSFER.ACCOUNT_DIALOG_ROW`
- Existing login/session locators in `LoginPage.js`

## Remaining Blockers

The form is reachable. The remaining skipped cases require controlled saved beneficiaries, currency pair test data, balance-specific data, or would approach review/OTP transaction execution. No locator is blocked for the base page.
