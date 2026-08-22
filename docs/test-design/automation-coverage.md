# Automation Coverage

## Account Management - Transaction History Drill-down

| TC ID | Coverage Status | Automation File | Notes |
| --- | --- | --- | --- |
| SAIB-0062 | Automated - Application UI Failure | `tests/regression-tcs/accounts/saib-0062-transaction-history-drill-down.spec.ts` | Phase 1 checks the current account, then selects each enabled account through the UI in stable order until the same-action statement response contains transactions. The focused UAT run reached the third account and opened a transaction. Phase 2 failed because the deployed details popup omits required Running Balance. |

## Account Management - Real-time Account Details

| TC ID | Coverage Status | Automation File | Notes |
| --- | --- | --- | --- |
| SAIB-0059 | Automated - Passed | `tests/regression-tcs/accounts/saib-0059-account-details.spec.ts` | Captures `POST /accounts/details` from the same Accounts navigation and validates all currently applicable visible fields. Collateral is asserted only when an explicit API field exists. |

## Transfer - Local Transfer To Another SAIB Account

Source workbook:

`C:\Users\malak Mohamed\OneDrive\Documents\Local transfer to another saib account.xlsx`

Automation file:

`tests/transfers/portal/local-transfer-to-saib-account.spec.ts`

| TC ID | Coverage Status | Notes |
| --- | --- | --- |
| SAIB-1803 | Automated | Validates reachable To Another SAIB Account form and required controls. |
| SAIB-1804 | Automated | Validates source account selector exposes account entries with currency and amount evidence. |
| SAIB-1805 | Automated | Validates existing saved beneficiary masking through the Beneficiary selector. |
| SAIB-1806 | Automated | Validates Add New Beneficiary popup is locked to Another SAIB / Account Number and Add Beneficiary is disabled until data entry. |
| SAIB-1807 | Automated | Validates min/max amount limits and entered amount summary update. |
| SAIB-1808 | Automated | Validates quick-add amount buttons increment the amount field and summary. |
| SAIB-1809 | Automated | Validates reason selector option and selected reason in summary. |
| SAIB-1810 | Automated - Failing | Dependencies are filled through UI; review/OTP navigation is blocked by disabled Continue. |
| SAIB-1814 | Automated - Failing | Scheduled state is selectable; review navigation is blocked by disabled Continue. |
| SAIB-1815 | Automated - Failing | Recurring state is selectable; review navigation is blocked by disabled Continue. |
| SAIB-1816 | Automated - Failing | Same-currency setup is selectable; proceed validation is blocked by disabled Continue. |
| SAIB-1817 | Automated | Validates multiple existing beneficiaries as separate selectable rows. |
| SAIB-1818 | Automated | Validates projected balance using displayed source balance minus transfer amount. |
| SAIB-1819 | Automated | Validates cross-currency mismatch is blocked before posting. |
| SAIB-1820 | Automated | Validates amount exceeding displayed balance is blocked before posting. |

## Existing Transfer Coverage

| Scenario | Coverage Status | Automation File |
| --- | --- | --- |
| Transfer Between My Accounts - From Account ownership | Automated | `tests/portal/transfer-between-own-accounts.spec.ts` |
| Transfer Between My Accounts - To Account exclusion | Automated | `tests/portal/transfer-between-own-accounts.spec.ts` |
| Transfer Between My Accounts - Account entry details | Existing APP_UI failure from prior execution | `tests/portal/transfer-between-own-accounts.spec.ts` |
| Locator Repository Validation | Automated | `tests/framework/locator-repository/transfer-locator-repository-validation.spec.ts` |
