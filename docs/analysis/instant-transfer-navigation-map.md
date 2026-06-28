# Instant Transfer Navigation Map

Date: 2026-06-25

## Walkthrough

| Step | Action | Evidence |
| --- | --- | --- |
| 1 | Login using existing portal login Page Object and environment credentials. | `reports/dashboard-after-login.png` |
| 2 | Select Transfers from the sidebar. | DOM and Playwright trace evidence under `test-results/` |
| 3 | Open Transfer Money / Transfers landing content. | Navigation handled by `InstantTransferPage.navigateToInstantTransfer()` |
| 4 | Select Instant Transfer. | `reports/transfer/instant-transfer-opened.png` |
| 5 | Open Add Beneficiary for each supported method. | `reports/transfer/instant-transfer-add-beneficiary-*.png` |

## Visible Instant Transfer Methods

| Method | Status |
| --- | --- |
| Mobile Number | Visible and selectable |
| Card Number | Visible and selectable |
| Bank Account | Visible and selectable |
| Payment Address | Visible and selectable |
| Wallet | Visible and selectable |

