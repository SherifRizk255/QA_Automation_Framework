# Accounts Management Locator Inventory

| Screen | Element | Recommended Playwright Locator | Fallback Locator | Confidence | Reason / Risk |
| --- | --- | --- | --- | --- | --- |
| Login | Username input | `page.getByPlaceholder(/enter your username/i)` | `page.getByLabel(/user\\s*name|username|user id|customer id/i)` | High | Placeholder observed; existing `LoginPage` already has layered locator. |
| Login | Password input | `page.locator('input[type="password"]').first()` | None | High | Standard password input observed and reused by existing login page. |
| Login | Sign in button | `page.getByRole('button', { name: /sign in|login/i })` | `page.getByText(/sign in/i)` | High | Accessible button text observed. |
| Login | Active-session dialog | `page.getByRole('alertdialog').filter({ hasText: /you have an active session/i }).last()` | `page.getByText(/you have an active session/i)` | High | Existing `LoginPage` handles this safely and captures evidence. |
| Login | Active-session confirm | `dialog.getByRole('button', { name: /^(proceed|ok|yes|continue)$/i })` | `page.getByRole('button', { name: /proceed/i })` | High | `PROCEED` observed. |
| Dashboard | Accounts navigation | `page.getByRole('link', { name: /^Accounts$/i })` | `page.locator('a[href="#/accounts"]').first()` | High | Sidebar/bottom link text and href observed. |
| Dashboard | My Accounts account links | `page.locator('a[href*="#/accounts/account-details/"]')` | `page.getByText(/My Accounts/i).locator('..')` scoped links | Medium | Href is stable route pattern, but contains sensitive/internal account id; do not log href values. |
| Accounts Summary | Page heading | `page.getByRole('heading', { name: /^Accounts$/i })` | `page.getByText(/^Accounts$/i).first()` | High | Heading visible on Accounts screen. |
| Accounts Summary | Search input | `page.getByPlaceholder(/search accounts/i)` | `page.locator('input[type="text"]').filter({ hasText: /search/i })` | High | Placeholder observed. |
| Accounts Summary | Account cards | `page.locator('text=Your Accounts').locator('..').locator('..').getByText(/Available Balance/i)` | `page.getByText(/Available Balance/i)` | Medium | Cards lack known semantic role/test id; visible text is stable but layout-dependent. |
| Accounts Summary | Masked account identifiers | `page.getByText(/\\*{2,}\\d{2,}/)` | Account card text regex | Medium | Masked account values visible, but text must not be logged. |
| Accounts Summary | Per-account balances | `page.getByText(/Available Balance/i)` | Regex inside account card for currency/amount | Medium | Label observed, but exact card DOM not semantically identified. |
| Accounts Summary | View details buttons | `page.getByRole('button', { name: /view details/i })` | `page.getByText(/view details/i)` | High | Button text visible on account cards. Details destination needs further confirmation. |
| Accounts Summary | Load more button | `page.getByRole('button', { name: /load more/i })` | `page.getByText(/load more/i)` | High | Button text observed. |
| Accounts Summary | Display currency dropdown | `page.getByRole('combobox', { name: /EGP|USD|display/i })` | `page.locator('[role="combobox"]').first()` | Medium | Combobox observed; accessible name may be current currency. |
| Accounts Summary | Recent Transactions table | `page.getByRole('heading', { name: /recent transactions/i }).locator('..').getByRole('table')` | `page.getByRole('table').filter({ hasText: /Reference Number/ })` | Medium | Table visible with stable column text; container scoping may vary. |
| Accounts Summary | Reference Number column | `page.getByRole('columnheader', { name: /reference number/i })` | `page.getByText(/Reference Number/i)` | High | Column header observed. |
| Accounts Summary | Transaction Date column | `page.getByRole('columnheader', { name: /transaction date/i })` | `page.getByText(/Transaction Date/i)` | High | Column header observed. |
| Accounts Summary | Amount column | `page.getByRole('columnheader', { name: /amount/i })` | `page.getByText(/^Amount$/i)` | High | Column header observed. |
| Account Details | Full identifier | Not finalized | Not finalized | Low | Details screen content was not confirmed. Do not automate with guessed locator. |
| Account Statements | Statement date controls | Not discovered | Not finalized | Low | Statement screen and date controls were not observed. |
| Account Statements | Download button | Not discovered | Not finalized | Low | Download control was not observed. |

## SAIB-0062 live and client-contract additions

| Screen | Element | Repository Key | Primary Locator | Confidence | Evidence / Risk |
| --- | --- | --- | --- | --- | --- |
| Accounts | Product selector | `PORTAL.ACCOUNTS.SELECTOR.ROOT` | `cubic-product-selector` | High | Unique live UAT component root. |
| Accounts | Selector trigger | `PORTAL.ACCOUNTS.SELECTOR.TRIGGER` | `.product-selector-trigger` | High | Live UAT button; disabled for a single-account set. |
| Accounts | Dynamic position | `PORTAL.ACCOUNTS.SELECTOR.POSITION` | `.product-selector-position` | High | Live text validated with a dynamic current-of-total integer pattern. |
| Accounts | Account options | `PORTAL.ACCOUNTS.SELECTOR.OPTIONS` | `getByRole('option')` | High | Live listbox options with `aria-selected` and visible identity fields. |
| Accounts | Recent transaction rows | `PORTAL.ACCOUNTS.TRANSACTIONS.ROWS` | `.recent-tx-table tbody tr` | High | Stable semantic table structure; live UAT iteration reached a populated account and validated visible rows. |
| Accounts | Row details action | `PORTAL.ACCOUNTS.TRANSACTIONS.ROW.DETAILS` | `.recent-tx-link` | High | Deployed recent-transactions component template. |
| Transaction Details | Dialog | `PORTAL.ACCOUNTS.TRANSACTION_DETAILS.DIALOG` | `.txn-details-dialog` | High | Live UAT dialog opened successfully from a populated account. |
| Transaction Details | Label/value rows | `PORTAL.ACCOUNTS.TRANSACTION_DETAILS.LABELS` / `VALUES` | `.txn-row dt` / `.txn-row dd` | High | Live semantic description list exposes dates, `Transaction reference No.`, Transaction Name, and Account number; required Running Balance is absent. |

All runtime consumers resolve these keys through the central Locator
Repository. Collection indexing is bounded and is used only after a visible
business identity has been enumerated; it is not used to guess an account or
transaction.

## SAIB-0059 Account Details additions

| Region | Element | Repository Key | Primary Locator | Confidence |
| --- | --- | --- | --- | --- |
| Product selector | Selected product name | `PORTAL.ACCOUNTS.SELECTOR.SELECTED_PRODUCT_NAME` | `.product-selector-name` | High |
| Account Details | Root | `PORTAL.ACCOUNTS.DETAILS.ROOT` | `cubic-product-details` | High |
| Account Details | Field collection | `PORTAL.ACCOUNTS.DETAILS.FIELDS` | `.account-info-stat` | High |
| Account Details | Field label/value | `PORTAL.ACCOUNTS.DETAILS.FIELD.LABEL` / `VALUE` | `.account-info-field-head span` / `strong` | High |
| Selected product card | Root | `PORTAL.ACCOUNTS.PRODUCT_CARD.ROOT` | `cubic-product-card` | High |
| Selected product card | Balance collection | `PORTAL.ACCOUNTS.PRODUCT_CARD.BALANCES` | `.acct-balance` | High |
| Selected product card | Balance label/value/currency | `PORTAL.ACCOUNTS.PRODUCT_CARD.BALANCE.*` | Stable `acct-balance-*` classes | High |

All entries were verified against the live UAT DOM. The response-to-display
mapping was correlated without logging customer values.

