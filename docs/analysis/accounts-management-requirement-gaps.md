# Accounts Management Requirement Gaps

Source: Stage 1 requirement analysis for REQ-5, REQ-6, REQ-8, and REQ-9.

| Gap ID | Requirement ID | Gap / Ambiguity | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| GAP-AM-001 | REQ-5 | "Basic identifiers" are not defined. | Test assertions may be too broad or may validate the wrong identifier. | Confirm whether identifier means nickname, masked account number, account type, IBAN, or another label. |
| GAP-AM-002 | REQ-5 | Ledger balance format, currency display, and refresh timing are not defined. | Balance validations cannot confirm exact formatting or freshness. | Define expected currency, decimal precision, negative balance handling, and refresh behavior. |
| GAP-AM-003 | REQ-5 | Linked-account ownership cannot be verified from the requirement alone. | Automation may only prove account list visibility, not business ownership. | Provide approved test customer data with expected account aliases or masked identifiers. |
| GAP-AM-004 | REQ-6 | Masked versus unmasked account identifier behavior is not defined. | Test cases cannot determine whether reveal interaction is required or optional. | Define default masking, reveal control behavior, timeout/remasking behavior, and audit requirements. |
| GAP-AM-005 | REQ-6 | Full account identifier format is not specified. | Automation cannot safely assert exact format without risking sensitive data exposure. | Define a non-sensitive format rule, such as minimum length or digit grouping, that can be validated without logging values. |
| GAP-AM-006 | REQ-8 | "Recent" transaction period is not defined. | Boundary and regression coverage for date range cannot be finalized. | Define the default transaction period and any filter/date range limits. |
| GAP-AM-007 | REQ-8 | Required transaction basic details are not defined. | Test cases may omit mandatory columns or over-assert optional fields. | Confirm required transaction columns and labels. |
| GAP-AM-008 | REQ-8 | No guaranteed data condition for both debit and credit transactions. | Automated debit/credit coverage may be blocked in some environments. | Provide seeded account data or approve data-dependent test handling. |
| GAP-AM-009 | REQ-9 | The limited historical period is not defined. | Boundary tests for allowed and out-of-range statement periods cannot be exact. | Confirm the allowed historical duration, such as 6, 12, or 24 months. |
| GAP-AM-010 | REQ-9 | Statement file type and filename convention are not defined. | Download validation can only check generic file existence and extension. | Define allowed file types and filename rules. |
| GAP-AM-011 | REQ-9 | Rules for unavailable statements are not defined. | Empty-state and disabled-download behavior may be unclear. | Confirm expected no-statement message and disabled/enabled control behavior. |
| GAP-AM-012 | All | Permission rules for customers without access are not specified. | Permission/access coverage cannot be fully automated. | Provide role/access matrix for Accounts Management screens. |

