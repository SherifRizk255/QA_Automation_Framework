# Accounts Management Screen Inventory

## Login Screen

| Field | Details |
| --- | --- |
| Screen name | Login |
| Route/hash URL | `#/login` |
| Navigation path | Open portal login URL from `.env`. |
| Visible buttons | `FORGOT USER NAME?`, `FORGOT PASSWORD?`, `SIGN IN`, `REGISTER NOW`; active-session prompt can show `CANCEL` and `PROCEED`. |
| Visible text boxes | Username input, password input. |
| Modals/blockers | Active-session prompt: "You have an active session. Do you want to close it?" |
| Screenshot | `reports/system-walkthrough/accounts-management/01-login.png` |

## Dashboard

| Field | Details |
| --- | --- |
| Screen name | Dashboard |
| Route/hash URL | `#/dashboard` |
| Navigation path | Login with `.env` credentials; handle active-session blocker if displayed. |
| Visible buttons | Sidebar/bottom navigation buttons including Home, Accounts, Transfers, cards, Loans, Deposits, More; card carousel buttons; language button. |
| Visible dropdowns | Display currency combobox. |
| Visible tables | `Latest Transactions` table. |
| Account list elements | `My Accounts` area with account cards and masked identifiers. |
| Balance elements | Total balance and account card balances. |
| Transaction table elements | Reference Number, Transaction Date, Amount. |
| Modals/blockers | Theme fetch error toast observed; active-session prompt can appear during login. |
| Screenshot | `reports/system-walkthrough/accounts-management/02-dashboard.png` |

## Accounts Summary

| Field | Details |
| --- | --- |
| Screen name | Accounts Summary |
| Route/hash URL | `#/accounts` |
| Navigation path | Dashboard > Accounts, or Dashboard > `View All` under My Accounts. |
| Visible buttons | `VIEW DETAILS`, `LOAD MORE`, sidebar navigation, language button. |
| Visible dropdowns | Display currency combobox. |
| Visible text boxes | `Search accounts...` input. |
| Visible tables | `Recent Transactions` table. |
| Account list elements | `Your Accounts`, account count, account cards, masked identifiers, account status, balance cards. |
| Balance elements | Total balance across all accounts; per-account available balance. |
| Transaction table elements | Reference Number, Transaction Date, Amount. |
| Statement date controls | Not observed. |
| Download buttons | Not observed. |
| Loading indicators | Loading image appears in shell/sidebar area during navigation. |
| Modals/blockers | Theme fetch error toast observed. |
| Screenshot | `reports/system-walkthrough/accounts-management/clicked-1-accounts.png` |

## Account Details / Identifier

| Field | Details |
| --- | --- |
| Screen name | Account Details / Identifier Candidate |
| Route/hash URL | `#/accounts/account-details/<account-id>` from dashboard links. |
| Navigation path | Dashboard account card link or Accounts `VIEW DETAILS` candidate. |
| Visible controls | Not reliably inventoried; direct details page content was not confirmed before session/blocker behavior interrupted discovery. |
| Locator confidence | Low until a stable details walkthrough is completed. |
| Screenshot | No confirmed account-details screenshot. |

## Account Statements

| Field | Details |
| --- | --- |
| Screen name | Account Statements Candidate |
| Route/hash URL | Guessed statement routes returned page not found. |
| Navigation path | Not discovered. |
| Statement date controls | Not observed. |
| Download buttons | Not observed. |
| Locator confidence | Low / blocked. |
| Screenshot | `reports/system-walkthrough/accounts-management/route-account-statements.png` |

