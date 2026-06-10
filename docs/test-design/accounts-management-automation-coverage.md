# Accounts Management Automation Coverage

| Manual Test Case ID | Requirement ID | Automation Status | Reason | Automated Spec File Path | Page Object Used | Risks or Assumptions |
| --- | --- | --- | --- | --- | --- | --- |
| AM-TC-001 | REQ-5 | Automated | Accounts screen and account list controls were discovered on `#/accounts`. | `tests/portal/accounts/accounts-summary.spec.ts` | `pages/portal/accounts/AccountsSummaryPage.ts` | Ownership check still needs approved expected account set. |
| AM-TC-002 | REQ-5 | Automated | Masked/basic account identifiers were visible on account cards. | `tests/portal/accounts/accounts-summary.spec.ts` | `AccountsSummaryPage.ts` | Exact business definition of basic identifier remains a gap. |
| AM-TC-003 | REQ-5 | Automated | Balance labels and amounts were visible on account cards. | `tests/portal/accounts/accounts-summary.spec.ts` | `AccountsSummaryPage.ts` | Exact ledger freshness/format is not validated. |
| AM-TC-004 | REQ-5 | Needs Clarification | Requires approved expected account set to prove no unrelated accounts display. | N/A | N/A | UI-only check cannot prove ownership. |
| AM-TC-005 | REQ-6 | Blocked | Full identifier screen/control was not reliably discovered. | `tests/portal/accounts/account-identifier-view.spec.ts` | `AccountDetailsPage.ts` | Details route and masking rules need confirmation. |
| AM-TC-006 | REQ-6 | Needs Clarification | Masked/unmasked rule is not defined. | `tests/portal/accounts/account-identifier-view.spec.ts` | `AccountDetailsPage.ts` | Cannot assert expected masking behavior safely. |
| AM-TC-007 | REQ-6 | Blocked | Needs selected account to expected identifier mapping. | `tests/portal/accounts/account-identifier-view.spec.ts` | `AccountDetailsPage.ts` | Sensitive identifier must not be logged. |
| AM-TC-008 | REQ-6 | Automated | Automation avoids logging full identifiers and skipped tests document blocked status. | N/A | N/A | Requires review after identifier automation is added. |
| AM-TC-009 | REQ-8 | Automated | Recent Transactions table was visible on Dashboard/Accounts. | `tests/portal/accounts/transaction-history.spec.ts` | `TransactionHistoryPage.ts` | Debit and credit diversity depends on current customer data. |
| AM-TC-010 | REQ-8 | Automated | Observed table exposes Reference Number, Transaction Date, and Amount. | `tests/portal/accounts/transaction-history.spec.ts` | `TransactionHistoryPage.ts` | Exact required columns remain a gap. |
| AM-TC-011 | REQ-8 | Blocked | Requires account with no recent transactions. | N/A | N/A | Test data not provided. |
| AM-TC-012 | REQ-8 | Blocked | Requires selected-account transaction screen and expected account-specific data. | N/A | N/A | Current visible table is recent transactions, not proven selected-account history. |
| AM-TC-013 | REQ-9 | Blocked | Statement navigation was not discovered. | `tests/portal/accounts/account-statements.spec.ts` | `AccountStatementsPage.ts` | Guessed statement routes returned page-not-found. |
| AM-TC-014 | REQ-9 | Needs Clarification | Historical limit duration and controls are not defined. | `tests/portal/accounts/account-statements.spec.ts` | `AccountStatementsPage.ts` | Boundary values missing. |
| AM-TC-015 | REQ-9 | Blocked | Download control was not discovered. | `tests/portal/accounts/account-statements.spec.ts` | `AccountStatementsPage.ts` | Downloads must be stored under `reports/downloads/` once available. |
| AM-TC-016 | REQ-9 | Needs Clarification | Invalid/out-of-range period behavior depends on missing controls/rules. | `tests/portal/accounts/account-statements.spec.ts` | `AccountStatementsPage.ts` | Cannot safely invent expected validation. |

