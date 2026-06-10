# Accounts Management Manual Test Cases

## REQ-5 - Account Summary

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-001 |
| Requirement ID | REQ-5 |
| Module | Accounts Management |
| Feature | Account Summary |
| Title | Verify linked accounts are displayed. |
| Preconditions | Customer is authenticated and has linked accounts. |
| Test Data | Approved customer with one or more linked accounts. |
| Steps | 1. Login to the portal. 2. Navigate to Accounts. 3. Observe the account summary area. |
| Expected Result | Accounts screen displays the customer's linked accounts or an approved empty state if no accounts exist. |
| Priority | High |
| Severity | Critical |
| Automation Candidate | Yes |
| Notes | Ownership verification requires approved expected account set. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-002 |
| Requirement ID | REQ-5 |
| Module | Accounts Management |
| Feature | Account Summary |
| Title | Verify each account shows a basic identifier. |
| Preconditions | Customer is authenticated and Accounts screen displays accounts. |
| Test Data | Approved customer with linked accounts. |
| Steps | 1. Open Accounts. 2. Review each visible account card/list row. |
| Expected Result | Each account displays a non-empty basic identifier such as a masked account identifier, account type, or approved label. |
| Priority | High |
| Severity | Major |
| Automation Candidate | Yes |
| Notes | Exact identifier definition is a requirement gap. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-003 |
| Requirement ID | REQ-5 |
| Module | Accounts Management |
| Feature | Account Summary |
| Title | Verify each account shows current ledger balance. |
| Preconditions | Customer is authenticated and Accounts screen displays accounts. |
| Test Data | Approved customer with linked accounts and visible balances. |
| Steps | 1. Open Accounts. 2. Review each visible account card/list row. 3. Confirm balance label and amount are shown. |
| Expected Result | Each account displays a balance value in an approved currency/amount format. |
| Priority | High |
| Severity | Critical |
| Automation Candidate | Yes |
| Notes | Exact ledger balance freshness and formatting rules are gaps. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-004 |
| Requirement ID | REQ-5 |
| Module | Accounts Management |
| Feature | Account Summary |
| Title | Verify no unrelated customer accounts are displayed. |
| Preconditions | Customer is authenticated; approved expected account set is available. |
| Test Data | Customer account list from approved test data source. |
| Steps | 1. Open Accounts. 2. Compare visible account identifiers with approved expected account set. |
| Expected Result | Only accounts linked to the authenticated customer are displayed. |
| Priority | High |
| Severity | Critical |
| Automation Candidate | No |
| Notes | Not automatable safely until expected account fixtures are approved. |

## REQ-6 - Account Identifier View

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-005 |
| Requirement ID | REQ-6 |
| Module | Accounts Management |
| Feature | Account Identifier View |
| Title | Verify user can view full account identifier. |
| Preconditions | Customer is authenticated and can open account details. |
| Test Data | Approved customer account with identifier view permission. |
| Steps | 1. Open Accounts. 2. Select an account. 3. Open account details or identifier reveal control. |
| Expected Result | Full account identifier is displayed for the selected account according to approved security rules. |
| Priority | High |
| Severity | Critical |
| Automation Candidate | No |
| Notes | Blocked until account details/identifier screen and masking rules are confirmed. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-006 |
| Requirement ID | REQ-6 |
| Module | Accounts Management |
| Feature | Account Identifier View |
| Title | Verify masked/unmasked behavior if applicable. |
| Preconditions | Customer is authenticated and identifier masking/reveal rules are approved. |
| Test Data | Account with masked identifier and reveal permission. |
| Steps | 1. Open account details. 2. Observe default identifier state. 3. Trigger reveal/hide control if available. |
| Expected Result | Identifier masking and reveal behavior match approved rule. |
| Priority | High |
| Severity | Major |
| Automation Candidate | No |
| Notes | Needs clarified masking behavior. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-007 |
| Requirement ID | REQ-6 |
| Module | Accounts Management |
| Feature | Account Identifier View |
| Title | Verify account identifier belongs to selected account. |
| Preconditions | Customer is authenticated and approved account mapping is available. |
| Test Data | Approved selected account and expected non-sensitive identifier mapping. |
| Steps | 1. Select a known account. 2. Open account details. 3. Verify displayed identifier belongs to selected account. |
| Expected Result | The identifier corresponds to the selected account and not another account. |
| Priority | High |
| Severity | Critical |
| Automation Candidate | No |
| Notes | Needs expected data source and masking-safe validation rule. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-008 |
| Requirement ID | REQ-6 |
| Module | Accounts Management |
| Feature | Account Identifier View |
| Title | Verify sensitive data is not exposed unnecessarily in logs/reports. |
| Preconditions | Identifier view test is executed. |
| Test Data | Any account where identifier may be visible. |
| Steps | 1. Execute identifier view validation. 2. Review screenshots/logs/reports for unnecessary full identifier exposure. |
| Expected Result | Full account identifiers are not printed to console, written to generated docs, or exposed beyond required controlled screenshots. |
| Priority | High |
| Severity | Critical |
| Automation Candidate | Yes |
| Notes | Can be handled as automation/reporting control; UI identifier validation remains blocked. |

## REQ-8 - Transaction History

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-009 |
| Requirement ID | REQ-8 |
| Module | Accounts Management |
| Feature | Transaction History |
| Title | Verify recent debit and credit transactions are displayed. |
| Preconditions | Customer is authenticated and has recent debit/credit transaction data. |
| Test Data | Approved account with recent debit and credit transactions. |
| Steps | 1. Open Accounts or dashboard transaction area. 2. Review recent transactions. |
| Expected Result | Recent debit and credit transactions are displayed when such data exists. |
| Priority | High |
| Severity | Major |
| Automation Candidate | Yes |
| Notes | Debit and credit diversity is data-dependent. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-010 |
| Requirement ID | REQ-8 |
| Module | Accounts Management |
| Feature | Transaction History |
| Title | Verify each transaction shows basic details. |
| Preconditions | Customer is authenticated and recent transaction table/list is visible. |
| Test Data | Account with recent transactions. |
| Steps | 1. Open recent transactions. 2. Review transaction rows and columns. |
| Expected Result | Each visible transaction includes basic details such as reference number, transaction date, and amount as observed in the UI. |
| Priority | High |
| Severity | Major |
| Automation Candidate | Yes |
| Notes | Exact required columns remain a requirement gap. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-011 |
| Requirement ID | REQ-8 |
| Module | Accounts Management |
| Feature | Transaction History |
| Title | Verify empty transaction state if no transactions exist. |
| Preconditions | Customer is authenticated and has an account with no recent transactions. |
| Test Data | Approved account with no recent transactions. |
| Steps | 1. Open transaction history for the no-transaction account. |
| Expected Result | Empty-state message is displayed and no stale transaction rows appear. |
| Priority | Medium |
| Severity | Minor |
| Automation Candidate | No |
| Notes | Needs approved test data. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-012 |
| Requirement ID | REQ-8 |
| Module | Accounts Management |
| Feature | Transaction History |
| Title | Verify transaction history belongs to selected account only. |
| Preconditions | Customer is authenticated and selected-account transaction history is accessible. |
| Test Data | Approved account-specific transaction set. |
| Steps | 1. Select an account. 2. Open transaction history. 3. Compare visible transactions to approved expected data. |
| Expected Result | Only transactions for the selected account are displayed. |
| Priority | High |
| Severity | Critical |
| Automation Candidate | No |
| Notes | Needs account-specific transaction screen and data mapping. |

## REQ-9 - Account Statements

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-013 |
| Requirement ID | REQ-9 |
| Module | Accounts Management |
| Feature | Account Statements |
| Title | Verify user can view available statements. |
| Preconditions | Customer is authenticated and statements screen is accessible. |
| Test Data | Approved account with available statements. |
| Steps | 1. Navigate to account statements. 2. Review available statement list. |
| Expected Result | Available statements are displayed for the selected account or a valid empty state appears. |
| Priority | High |
| Severity | Major |
| Automation Candidate | No |
| Notes | Blocked because statement navigation was not discovered. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-014 |
| Requirement ID | REQ-9 |
| Module | Accounts Management |
| Feature | Account Statements |
| Title | Verify limited historical period is enforced. |
| Preconditions | Statement date controls and historical-period rule are available. |
| Test Data | Approved historical period boundary dates. |
| Steps | 1. Open statements. 2. Select allowed period. 3. Select out-of-range period if controls allow. |
| Expected Result | Allowed period returns statements or empty state; out-of-range period is blocked or shows validation. |
| Priority | High |
| Severity | Major |
| Automation Candidate | No |
| Notes | Needs historical limit and date controls. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-015 |
| Requirement ID | REQ-9 |
| Module | Accounts Management |
| Feature | Account Statements |
| Title | Verify user can download statement if download is available. |
| Preconditions | Customer is authenticated and an available statement has a download control. |
| Test Data | Approved downloadable statement. |
| Steps | 1. Open statements. 2. Trigger statement download. 3. Save file under `reports/downloads/`. |
| Expected Result | Download completes with valid filename and extension; statement content is not exposed in reports. |
| Priority | High |
| Severity | Major |
| Automation Candidate | No |
| Notes | Blocked because download control was not discovered. |

| Field | Value |
| --- | --- |
| Test Case ID | AM-TC-016 |
| Requirement ID | REQ-9 |
| Module | Accounts Management |
| Feature | Account Statements |
| Title | Verify invalid/out-of-range period is handled correctly if controls exist. |
| Preconditions | Statement date controls are visible and validation rules are known. |
| Test Data | Out-of-range date period from approved rule. |
| Steps | 1. Open statements. 2. Enter or select invalid/out-of-range period. 3. Submit or apply filter if available. |
| Expected Result | System shows validation or prevents invalid selection without downloading sensitive content. |
| Priority | Medium |
| Severity | Major |
| Automation Candidate | No |
| Notes | Needs controls and rule clarification. |

