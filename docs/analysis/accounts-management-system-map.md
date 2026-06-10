# Accounts Management System Map

Source: Stage 2 Playwright walkthrough using `.env` portal values on 2026-06-10.

## Environment

| Item | Value |
| --- | --- |
| Application | Internet Banking Retail Portal |
| Authentication | Existing portal login flow using `.env` values |
| Login route | `#/login` |
| Dashboard route | `#/dashboard` |
| Accounts route | `#/accounts` |
| Screenshot folder | `reports/system-walkthrough/accounts-management/` |

## Discovered Screens

| Screen | Route / URL Hash | Purpose | Evidence |
| --- | --- | --- | --- |
| Login | `#/login` | Customer authentication. | `reports/system-walkthrough/accounts-management/01-login.png` |
| Dashboard | `#/dashboard` | Customer landing page with My Accounts, latest transactions, card/deposit/loan summaries. | `reports/system-walkthrough/accounts-management/02-dashboard.png` |
| Accounts Summary | `#/accounts` | Account summary screen with total balance, account list, search, display currency selector, recent transactions, and load more. | `reports/system-walkthrough/accounts-management/clicked-1-accounts.png` |
| Account Details Candidate | `#/accounts/account-details/<account-id>` | Detail route is linked from dashboard account cards, but a stable details page was not confirmed during the walkthrough. | `reports/system-walkthrough/accounts-management/discovery-notes.json` |
| Route Not Found | `#/account-summary`, `#/account/details`, `#/transactions`, `#/transaction-history`, `#/statements`, `#/account-statements` | Guessed routes return page-not-found and are not valid final locators/navigation paths. | `reports/system-walkthrough/accounts-management/route-account-summary.png` and related route screenshots |

## Business-Safe Observations

| Requirement Area | Observation |
| --- | --- |
| Account Summary | The Accounts screen displays a heading, total balance section, account count, account cards, masked account identifiers, balance labels, `VIEW DETAILS` buttons, search input, currency selector, and `LOAD MORE`. |
| Account Identifier | Dashboard account cards link to account-detail routes containing an internal account identifier in the route. The full identifier view was not confirmed as safely accessible during walkthrough. |
| Transaction History | The Dashboard and Accounts screen display a visible `Recent Transactions` table with reference number, transaction date, and amount columns. |
| Account Statements | Statement list/download controls were not found in the observed Accounts summary UI or guessed statement routes. |

