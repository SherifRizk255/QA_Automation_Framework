# Instant Transfer Gap Analysis Report

Date: 2026-06-25

## Covered Areas

| Area | Coverage |
| --- | --- |
| Method selection | Covered |
| Method switching state reset | Covered |
| Beneficiary filtering by method | Covered |
| EGP-only currency rule | Covered |
| Add Beneficiary popup metadata | Covered |
| Add Beneficiary mandatory nickname | Covered |
| Add Beneficiary cancel behavior | Covered |
| Mobile Number negative validation | Covered |
| Card Number negative validation | Covered |
| Bank Account / IBAN negative validation | Covered |
| IPA negative validation | Covered |
| Wallet mandatory validation | Covered |

## Uncovered / Under-Covered Business Behaviors

| Gap ID | Gap | Reason |
| --- | --- | --- |
| GAP-IT-001 | Source account selection and account-balance impact in Instant Transfer | Workbook focuses on beneficiary identifier validation, not funding account behavior. |
| GAP-IT-002 | Transfer amount limits and fees for Instant Transfer | No amount, fee, charge, or limit scenarios are provided. |
| GAP-IT-003 | Review page field-level verification for Instant Transfer | Review/confirmation content is referenced only where OTP or external resolution is required. |
| GAP-IT-004 | Successful transaction completion | Unsafe without approved test transaction path and OTP handling. |
| GAP-IT-005 | Beneficiary edit/delete flows | Workbook covers Add Beneficiary only. |
| GAP-IT-006 | Error recovery, retry, and timeout behavior for IPN/PSP lookup | Only selected lookup failure outcomes are covered. |
| GAP-IT-007 | Permissions/entitlement behavior | No unauthorized or restricted-user scenarios are provided. |
| GAP-IT-008 | Audit trail and notification behavior | No audit, receipt, SMS, email, or notification assertions are provided. |
| GAP-IT-009 | Accessibility and keyboard behavior | No accessibility or keyboard-only scenarios are provided. |
| GAP-IT-010 | Cross-browser/device behavior | Browser is limited to Chromium. |

## Recommended Missing Scenarios

| Recommended TC | Scenario |
| --- | --- |
| REC-IT-001 | Validate source account selector shows only eligible EGP accounts with available balance. |
| REC-IT-002 | Validate transfer amount minimum, maximum, and available-balance rules for Instant Transfer. |
| REC-IT-003 | Validate transfer fees/charges displayed before review if applicable. |
| REC-IT-004 | Validate review page displays source account, beneficiary, method, amount, fees, and total debit before OTP. |
| REC-IT-005 | Validate user can abandon the flow from review without posting a transfer. |
| REC-IT-006 | Validate IPN/PSP lookup timeout or service unavailable message. |
| REC-IT-007 | Validate saved Instant Transfer beneficiary can be edited or deleted if supported. |
| REC-IT-008 | Validate entitlement restrictions for a user without Instant Transfer permission. |
| REC-IT-009 | Validate receipt/reference number after a safe test transaction in a controlled environment. |
| REC-IT-010 | Validate keyboard navigation and accessible names for method tiles and Add Beneficiary controls. |

