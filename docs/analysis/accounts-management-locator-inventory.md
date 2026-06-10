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

