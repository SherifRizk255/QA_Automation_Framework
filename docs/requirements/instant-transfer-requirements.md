# Instant Transfer Requirements

Source: `C:\Users\malak Mohamed\OneDrive\Documents\instant transfers - codex.xlsx`

## Requirement Groups

| Requirement ID | Description | Source TC Range |
| --- | --- | --- |
| REQ-IT-001 | Instant Transfer method tiles are visible and selectable. | SAIB-2184 |
| REQ-IT-002 | Switching Instant Transfer methods clears previously selected beneficiary/input state. | SAIB-2185, SAIB-2187 |
| REQ-IT-003 | Beneficiary lists are filtered by selected Instant Transfer method. | SAIB-2186 |
| REQ-IT-004 | Instant Transfer source account currency is restricted to EGP. | SAIB-2188, SAIB-2189 |
| REQ-IT-005 | Add Beneficiary flow locks beneficiary type to the active method and requires nickname where applicable. | SAIB-2190, SAIB-2191, SAIB-2192 |
| REQ-IT-006 | Save beneficiary and OTP behavior is enforced for transaction completion paths. | SAIB-2193, SAIB-2194, SAIB-2195, SAIB-2196, SAIB-2197 |
| REQ-IT-007 | Mobile Number beneficiary inputs validate format, registration, and required state. | SAIB-2200 to SAIB-2206 |
| REQ-IT-008 | Card Number beneficiary inputs validate length, numeric content, and IPN registration. | SAIB-2207 to SAIB-2210 |
| REQ-IT-009 | Bank Account beneficiary inputs validate account number, IBAN, bank name, and list isolation. | SAIB-2211 to SAIB-2218 |
| REQ-IT-010 | Payment Address beneficiary inputs validate IPA format, case handling, allowed characters, existence, and required state. | SAIB-2219 to SAIB-2229 |
| REQ-IT-011 | Wallet beneficiary inputs validate wallet resolution and required state. | SAIB-2230, SAIB-2232 |

## Safety-Restricted Requirements

Transaction posting, OTP completion, API tampering, and externally controlled positive beneficiary resolution are outside the safe automation boundary for this run.

