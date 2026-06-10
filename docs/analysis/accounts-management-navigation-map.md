# Accounts Management Navigation Map

Source: Stage 2 Playwright walkthrough.

| From | Action | To | Status | Evidence / Notes |
| --- | --- | --- | --- | --- |
| Login | Submit valid `.env` credentials | Dashboard `#/dashboard` | Confirmed with blocker handling | Active-session prompt appeared and was handled by existing `LoginPage`. |
| Dashboard | Click sidebar/bottom navigation `Accounts` or dashboard `View All` | Accounts `#/accounts` | Confirmed | `clicked-1-accounts.png`, `route-accounts.png`. |
| Dashboard | Click account card link | Account details route candidate `#/accounts/account-details/<account-id>` | Partially confirmed | Links were visible in discovery notes, but stable details page content was not confirmed. |
| Accounts | Click `VIEW DETAILS` | Account details candidate | Not finalized | Visible buttons exist; deeper pass was interrupted by session behavior before reliable details inventory was captured. |
| Accounts | Use search input | Filter account list | Candidate | Search input was visible, but filtering behavior was not tested because it is outside requested non-destructive discovery scope. |
| Accounts | Use display currency combobox | Change display currency | Candidate | Combobox visible. Currency conversion behavior not validated. |
| Accounts | Click `LOAD MORE` | More account cards | Candidate | Button visible. Not clicked during discovery to avoid changing view state without test data expectations. |
| Accounts | Navigate direct guessed statement/transaction routes | Page not found or redirect | Not valid | `#/transactions`, `#/transaction-history`, `#/statements`, and `#/account-statements` returned page-not-found in discovery. |

