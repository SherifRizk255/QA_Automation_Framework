# Accounts Management Traceability Matrix

Source: User-provided Accounts Management requirements.

| Requirement ID | Module | Feature | Extracted Rule | Validation Target | Gaps / Risks |
| --- | --- | --- | --- | --- | --- |
| REQ-5 | Accounts Management | Account Summary | Customer can view linked accounts. | Account list, account row/card, dashboard/account summary route. | GAP-AM-003: ownership verification needs approved data. |
| REQ-5 | Accounts Management | Account Summary | Each linked account includes a basic identifier. | Identifier label/text in each account entry. | GAP-AM-001: identifier definition missing. |
| REQ-5 | Accounts Management | Account Summary | Each linked account includes current ledger balance. | Balance label/text in each account entry. | GAP-AM-002: balance format/freshness missing. |
| REQ-5 | Accounts Management | Account Summary | No unrelated customer accounts should display. | Account list scoping to logged-in customer. | Needs approved expected account set. |
| REQ-6 | Accounts Management | Account Identifier View | Customer can view full account identifier. | Account details screen, identifier/reveal control. | GAP-AM-004 and GAP-AM-005. |
| REQ-6 | Accounts Management | Account Identifier View | Identifier belongs to selected account. | Selected account context and details identifier relationship. | Needs stable selected account context. |
| REQ-6 | Accounts Management | Account Identifier View | Sensitive identifiers are protected in logs/reports. | Automation reporting behavior. | Must mask or avoid outputting real values. |
| REQ-6 | Accounts Management | Real-time Account Details | SAIB-0059 validates Account Number, IBAN, Product Name, Account Type, Currency, Available Balance, Actual Balance, Hold Balance, Status, Opening Date, Branch, and conditional Collateral against the same-navigation account-details response. | `#/accounts`, selected product selector, product card, Account Details component, `POST /accounts/details`. | Current live API has no Collateral field, so Collateral is correctly not applicable. |
| REQ-8 | Accounts Management | Transaction History | Customer can view recent debit and credit transactions. | Transaction history screen/table/list. | GAP-AM-006 and GAP-AM-008. |
| REQ-8 | Accounts Management | Transaction History | Transactions include basic details. | Transaction table columns or card fields. | GAP-AM-007. |
| REQ-8 | Accounts Management | Transaction History | History belongs to selected account only. | Selected account context and transaction list. | Needs approved account-specific expected data. |
| REQ-8 | Accounts Management | Transaction History Drill-down | SAIB-0062 checks enabled accounts through deterministic UI selections until a same-action `accounts/statement` response contains transactions, then correlates the selected account and transaction and validates approved detail fields. | Accounts selector, account API requests/responses, recent-transactions list, transaction-details dialog. | Focused UAT reached a populated account and exposed the deployed popup's missing Running Balance as `APP_UI`. Beneficiary/Payer remains asserted when supplied by the API. |
| REQ-9 | Accounts Management | Account Statements | Customer can view statements. | Statement list/table/cards. | GAP-AM-011 if no statements exist. |
| REQ-9 | Accounts Management | Account Statements | Statements are limited to a historical period. | Date controls, filters, validation messages, disabled states. | GAP-AM-009. |
| REQ-9 | Accounts Management | Account Statements | Customer can download statements when available. | Download button/link and file download event. | GAP-AM-010; sensitive content must not be parsed/exposed. |

