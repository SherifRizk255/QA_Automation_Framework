# Instant Transfer Test Case Review Summary

Date: 2026-06-25

Source: `C:\Users\malak Mohamed\OneDrive\Documents\instant transfers - codex.xlsx`

## Business Flow Reconstruction

```text
Transfers
|
Instant Transfer
|
Select transfer method
|-- Mobile Number
|-- Card Number
|-- Bank Account
|-- Payment Address / IPA
|-- Wallet
|
Choose existing beneficiary or Add Beneficiary
|
Validate method-specific identifier
|
Resolve beneficiary through IPN/PSP/wallet service when required
|
Review / OTP / persistence boundary
|
Transaction or beneficiary-save completion
```

## Covered Business Behaviors

| Behavior | Covered By |
| --- | --- |
| Instant Transfer method tile visibility and selection | SAIB-2184 |
| Method switching clears beneficiary state | SAIB-2185, SAIB-2186, SAIB-2187 |
| EGP-only currency restriction | SAIB-2188, SAIB-2189 |
| Add Beneficiary type/method behavior | SAIB-2190, SAIB-2191 |
| Add Beneficiary nickname and cancel behavior | SAIB-2192, SAIB-2198 |
| OTP and beneficiary persistence boundaries | SAIB-2193 to SAIB-2197 |
| Mobile Number validation and resolution | SAIB-2200 to SAIB-2206 |
| Card Number validation and IPN rejection | SAIB-2207 to SAIB-2210 |
| Bank Account / IBAN validation and list isolation | SAIB-2211 to SAIB-2218 |
| IPA validation, case handling, PSP lookup, and character rules | SAIB-2219 to SAIB-2229 |
| Wallet validation and resolution | SAIB-2230, SAIB-2232 |

## Classification Summary

| Status | Count |
| --- | ---: |
| Total Test Cases | 47 |
| READY_FOR_AUTOMATION | 29 |
| BLOCKED | 17 |
| INCOMPLETE | 0 |
| AMBIGUOUS | 0 |
| DUPLICATE | 0 |
| NOT_AUTOMATABLE | 1 |
| MISSING_EXPECTED_RESULT | 0 |

## Review Findings

- No exact duplicate test cases were found.
- No workbook row is missing an expected result.
- The largest blocker group is transaction, OTP, and external beneficiary-resolution behavior.
- `SAIB-2189` is not automatable in the current Playwright UI framework because it requires manual API tampering through a proxy tool.
- The automation implementation should execute only the 29 `READY_FOR_AUTOMATION` cases. The remaining cases may be represented as skipped/blocker records for traceability only.

