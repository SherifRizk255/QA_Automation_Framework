# Accounts Management Page Object Recommendations

| Page Object | Recommended Path | Purpose | Status |
| --- | --- | --- | --- |
| AccountsSummaryPage | `pages/portal/accounts/AccountsSummaryPage.ts` | Navigate to `#/accounts`, validate account summary cards, masked identifiers, balances, search field, currency selector, and recent transactions table. | Feasible now. |
| AccountDetailsPage | `pages/portal/accounts/AccountDetailsPage.ts` | Encapsulate `VIEW DETAILS` / account detail candidate navigation and full identifier checks only after details screen is confirmed. | Create shell with guarded methods; mark tests blocked until locator confidence improves. |
| TransactionHistoryPage | `pages/portal/accounts/TransactionHistoryPage.ts` | Encapsulate visible Recent Transactions table on dashboard/accounts and future transaction-history screen if discovered. | Feasible for visible recent transactions; full selected-account history needs clarification. |
| AccountStatementsPage | `pages/portal/accounts/AccountStatementsPage.ts` | Encapsulate statement list, date controls, and download validation once statement screen is discovered. | Blocked until navigation/control discovery. |

## Recommended Automation Scope

| Requirement | Automation Decision |
| --- | --- |
| REQ-5 | Automate visible account summary structure on `#/accounts`: heading, account count/list, masked identifiers, balances, `VIEW DETAILS`, search, display currency, and load-more visibility if present. |
| REQ-6 | Do not automate full identifier validation yet. Create page object placeholders with explicit blocked coverage, because full identifier locator and masking behavior are not confirmed. |
| REQ-8 | Automate visible recent transactions table structure and at least one populated row when data exists. Mark debit/credit diversity as data-dependent. |
| REQ-9 | Do not automate statement view/download yet. Statement route and download control were not discovered. |

