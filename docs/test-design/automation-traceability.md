# Automation Traceability - Accounts Management

Source artifacts:
- Manual test cases: `docs/test-design/accounts-management-manual-test-cases.md`
- Traceability matrix: `docs/analysis/accounts-management-traceability-matrix.md`
- Locator inventory: `docs/analysis/accounts-management-locator-inventory.md`
- System map: `docs/analysis/accounts-management-system-map.md`
- Navigation map: `docs/analysis/accounts-management-navigation-map.md`

## Login & Authentication - Credentials Login

Source artifact:
- Approved workbook rows: `C:\Users\malak Mohamed\Documents\Codex\agent-automation- excel.xlsx`

```text
Login & Authentication
↓
Credentials Login
↓
SAIB-0209
↓
tests/authentication/portal/credentials-login.spec.ts
↓
pages/portal/LoginPage.js

Status:
Automated
```

```text
Login & Authentication
↓
Credentials Login
↓
SAIB-0217 / SAIB-0218
↓
tests/authentication/portal/credentials-login.spec.ts
↓
pages/portal/LoginPage.js

Status:
Automated with UI required-field validation only
```

| TC ID | Status | Reason |
| --- | --- | --- |
| SAIB-0212 | Blocked | Requires approved non-existing username/password data, exact generic error locator/message, and audit-trail access path. |
| SAIB-0214 | Blocked | Requires approved invalid password data, exact generic error locator/message, and audit-trail access path. |

## Automated Coverage

```text
REQ-5
↓
Account Summary coverage
↓
AM-TC-001 / AM-TC-002 / AM-TC-003
↓
tests/accounts/portal/accounts-summary.spec.ts
↓
pages/portal/accounts/AccountsSummaryPage.ts

Status:
Automated
```

```text
REQ-8
↓
Recent Transactions coverage
↓
AM-TC-009 / AM-TC-010
↓
tests/accounts/portal/transaction-history.spec.ts
↓
pages/portal/accounts/TransactionHistoryPage.ts

Status:
Automated
```

## Blocked Or Clarification Coverage

| Requirement | TC ID | Status | Reason |
| --- | --- | --- | --- |
| REQ-5 | AM-TC-004 | Needs Clarification | Requires approved expected account set to prove no unrelated accounts display. |
| REQ-6 | AM-TC-005 | Blocked | Full account identifier screen/control was not reliably discovered. |
| REQ-6 | AM-TC-006 | Needs Clarification | Masked/unmasked behavior is not defined. |
| REQ-6 | AM-TC-007 | Blocked | Needs selected-account to expected identifier mapping. |
| REQ-6 | AM-TC-008 | Automated by control | Active automation avoids logging full identifiers; UI identifier validation remains blocked. |
| REQ-8 | AM-TC-011 | Blocked | Requires approved account with no recent transactions. |
| REQ-8 | AM-TC-012 | Blocked | Requires selected-account transaction screen and approved account-specific expected data. |
| REQ-9 | AM-TC-013 | Blocked | Statement navigation was not discovered. |
| REQ-9 | AM-TC-014 | Needs Clarification | Historical limit duration and controls are not defined. |
| REQ-9 | AM-TC-015 | Blocked | Download control was not discovered. |
| REQ-9 | AM-TC-016 | Needs Clarification | Invalid/out-of-range behavior depends on missing controls and rules. |

## Quality Gate Notes

- No automation was generated for blocked Account Identifier or Account Statements behavior.
- Active tests use Page Object methods only for UI interactions.
- Sensitive account identifiers are not logged; assertions use count/visibility and masked identifier patterns.
- No hard-coded credentials are used; login consumes `.env` variables through existing `LoginPage`.

## Transfer - Local Transfer To Another SAIB Account

Source artifact:
- Approved workbook rows: `C:\Users\malak Mohamed\OneDrive\Documents\Local transfer to another saib account.xlsx`

```text
Transfer
â†“
Local Transfers
â†“
To another SAIB account
â†“
SAIB-1803 ... SAIB-1820
â†“
tests/transfers/portal/local-transfer-to-saib-account.spec.ts
â†“
pages/portal/LocalTransferToSaibAccountPage.ts

Status:
Reopened after system walkthrough. Safe non-transaction scenarios implemented with traceability.
```

| TC ID | Automation Status | Reason |
| --- | --- | --- |
| SAIB-1803 | Automated | Validates reachable To Another SAIB Account form and required controls. |
| SAIB-1804 | Automated | Validates source account selector exposes account entries with currency and amount evidence. |
| SAIB-1805 | Automated | Existing saved beneficiaries are selectable through UI and masking is asserted. |
| SAIB-1806 | Automated | Validates Add New Beneficiary popup is locked to Another SAIB / Account Number. |
| SAIB-1807 | Automated | Validates amount min/max limits and summary update. |
| SAIB-1808 | Automated | Validates quick-add amount behavior and summary update. |
| SAIB-1809 | Automated | Validates reason option selection and summary update. |
| SAIB-1810 | Automated - Failing | Dependencies are satisfied through UI; `Continue` remains disabled before review/OTP. |
| SAIB-1814 | Automated - Failing | Scheduled transfer state is selected through UI; `Continue` remains disabled before review. |
| SAIB-1815 | Automated - Failing | Recurring transfer state is selected through UI; `Continue` remains disabled before review. |
| SAIB-1816 | Automated - Failing | Same-currency setup is selected through UI; `Continue` remains disabled before review. |
| SAIB-1817 | Automated | Multiple beneficiaries are visible as separate selectable rows. |
| SAIB-1818 | Automated | Projected balance is calculated from displayed source balance and visible transfer amount. |
| SAIB-1819 | Automated | Cross-currency mismatch is blocked before posting. |
| SAIB-1820 | Automated | Transfer amount above displayed available balance is blocked before posting. |
