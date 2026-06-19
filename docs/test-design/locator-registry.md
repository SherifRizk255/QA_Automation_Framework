# Locator Registry - Automation

Source: `docs/analysis/accounts-management-locator-inventory.md`

## Login

| Element | Primary Locator | Fallback Chain | Confidence | Used By |
| --- | --- | --- | --- | --- |
| Username input | `page.getByLabel(/user\s*name\|username\|user id\|customer id/i).or(page.getByPlaceholder(/user\s*name\|username\|user id\|customer id/i))` | Stable text/name/id text input | High | `LoginPage` |
| Password input | `page.locator('input[type="password"]').first()` | None documented | High | `LoginPage` |
| Sign in button | `page.getByRole('button', { name: /login|sign in/i })` | Text: sign in/login | High | `LoginPage` |
| Active-session dialog | `page.getByRole('alertdialog').filter({ hasText: /you have an active session/i }).last()` | Text: active session | High | `LoginPage` |
| Active-session confirm | `dialog.getByRole('button', { name: /^(proceed|ok|yes|continue)$/i })` | Role button: proceed | High | `LoginPage` |

### Login Locator Gaps

| Area | Element | Status | Reason |
| --- | --- | --- | --- |
| Credentials Login | Generic invalid-credential error message | Blocked | Error text and locator were not provided by the approved workbook or existing locator inventory. |
| Credentials Login | Audit trail evidence | Blocked | No UI/API/log access path was provided for audit validation. |

## Accounts Summary

| Element | Primary Locator | Fallback Chain | Confidence | Used By |
| --- | --- | --- | --- | --- |
| Accounts navigation | `page.getByRole('link', { name: /^accounts$/i })` | `page.locator('a[href="#/accounts"]')` | High | `AccountsSummaryPage` |
| Accounts heading | `page.getByText(/^accounts$/i).first()` | Heading/text fallback | High | `AccountsSummaryPage` |
| Search input | `page.getByPlaceholder(/search accounts/i)` | Text input scoped by search text | High | `AccountsSummaryPage` |
| View details buttons | `page.getByRole('button', { name: /view details/i })` | Text: view details | High | `AccountsSummaryPage`, `AccountDetailsPage` |
| Load more button | `page.getByRole('button', { name: /load more/i })` | Text: load more | High | `AccountsSummaryPage` |
| Display currency dropdown | `page.getByRole('combobox').first()` | Combobox with currency/display context | Medium | `AccountsSummaryPage` |
| Available balance labels | `page.getByText(/available balance/i)` | Account card text | Medium | `AccountsSummaryPage` |
| Masked account identifiers | `page.getByText(/\*{2,}\d{2,}/)` | Account card text regex | Medium | `AccountsSummaryPage` |

## Recent Transactions

| Element | Primary Locator | Fallback Chain | Confidence | Used By |
| --- | --- | --- | --- | --- |
| Recent Transactions heading | `page.getByText(/recent transactions/i).first()` | Heading text | High | `TransactionHistoryPage` |
| Recent Transactions table | `page.getByRole('table').filter({ hasText: /Reference Number/i }).filter({ hasText: /Transaction Date/i }).filter({ hasText: /Amount/i }).first()` | Table filtered by stable columns | Medium | `TransactionHistoryPage` |
| Reference Number column | `page.getByRole('columnheader', { name: /reference number/i })` | Text: Reference Number | High | `TransactionHistoryPage` |
| Transaction Date column | `page.getByRole('columnheader', { name: /transaction date/i })` | Text: Transaction Date | High | `TransactionHistoryPage` |
| Amount column | `page.getByRole('columnheader', { name: /^amount$/i })` | Text: Amount | High | `TransactionHistoryPage` |

## Blocked Locators

| Area | Element | Status | Reason |
| --- | --- | --- | --- |
| Account Details | Full account identifier | Blocked | Details screen content and masking behavior not confirmed. |
| Account Statements | Statement date controls | Blocked | Statement screen and controls not discovered. |
| Account Statements | Download button | Blocked | Download control not discovered. |
