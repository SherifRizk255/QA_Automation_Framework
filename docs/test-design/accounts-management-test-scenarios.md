# Accounts Management Test Scenarios

Source inputs:
- `docs/analysis/accounts-management-requirement-analysis.md`
- `docs/analysis/accounts-management-traceability-matrix.md`
- `docs/analysis/accounts-management-requirement-gaps.md`
- `docs/analysis/accounts-management-system-map.md`

| Scenario ID | Requirement ID | Type | Scenario | Expected Outcome | Automation Priority | Automation Feasibility |
| --- | --- | --- | --- | --- | --- | --- |
| AM-SCN-001 | REQ-5 | Positive | Authenticated customer opens Accounts and views linked account list. | Accounts screen displays account list/card area and account count. | High | Feasible |
| AM-SCN-002 | REQ-5 | UI display | Each visible account displays a basic identifier. | Account cards show non-empty masked/basic identifiers. | High | Feasible, with masked-value assertions only |
| AM-SCN-003 | REQ-5 | UI display | Each visible account displays current ledger/available balance. | Each visible account card shows a balance label and amount. | High | Feasible structurally; exact balance freshness needs data support |
| AM-SCN-004 | REQ-5 | Negative / permission | Customer does not see unrelated customer accounts. | Only the logged-in customer's linked accounts are displayed. | Medium | Needs approved expected account set |
| AM-SCN-005 | REQ-5 | Boundary | Account summary handles no linked accounts. | Empty state is visible and no unrelated account data appears. | Medium | Needs test customer with no accounts |
| AM-SCN-006 | REQ-5 | Regression | Accounts navigation from dashboard continues to open `#/accounts`. | Accounts route and heading display successfully. | High | Feasible |
| AM-SCN-007 | REQ-6 | Positive | Customer opens selected account details and views full identifier. | Full account identifier is displayed for selected account. | High | Blocked until details identifier view is confirmed |
| AM-SCN-008 | REQ-6 | Validation | Masked/unmasked identifier behavior follows configured rule. | Identifier masking or reveal behavior matches approved business rule. | High | Needs clarification |
| AM-SCN-009 | REQ-6 | Validation | Full identifier belongs to selected account. | Identifier context matches selected account without exposing value in reports. | High | Needs approved non-sensitive expected data |
| AM-SCN-010 | REQ-6 | Security / regression | Automation and reports do not expose full account identifiers. | No full account numbers appear in console logs, docs, or reports. | High | Feasible as process control |
| AM-SCN-011 | REQ-8 | Positive | Customer views recent transactions. | Recent Transactions table/list is visible. | High | Feasible |
| AM-SCN-012 | REQ-8 | Positive | Recent transactions include debit and credit entries when data exists. | Debit and credit indicators/amounts display for available data. | Medium | Data-dependent |
| AM-SCN-013 | REQ-8 | UI display | Each transaction row displays basic details. | Rows include reference number, transaction date, and amount as observed. | High | Feasible for observed table |
| AM-SCN-014 | REQ-8 | Boundary | Account with no recent transactions shows empty state. | Empty-state message is visible and no stale rows display. | Medium | Needs test account with no transactions |
| AM-SCN-015 | REQ-8 | Permission/access | Transaction history belongs to selected account only. | Selected account context scopes transaction list. | Medium | Needs stable account-specific history screen or expected data |
| AM-SCN-016 | REQ-9 | Positive | Customer views available statements. | Statement list is visible for eligible account. | High | Blocked: statement navigation not discovered |
| AM-SCN-017 | REQ-9 | Download behavior | Customer downloads an available statement. | Download event completes and file has valid name/extension under `reports/downloads/`. | High | Blocked: download control not discovered |
| AM-SCN-018 | REQ-9 | Boundary | Limited historical period is enforced. | Out-of-range period is unavailable or shows validation message. | High | Needs historical-period rule and controls |
| AM-SCN-019 | REQ-9 | Negative / validation | Invalid statement date period is handled. | Visible validation/error is shown without exposing sensitive content. | Medium | Needs date controls and validation rules |
| AM-SCN-020 | All | Access/blocker | Active-session blocker is documented if shown during login. | Screenshot is attached and approved confirmation is clicked only when visible. | High | Feasible through existing `LoginPage` |

