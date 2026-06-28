# Instant Transfer Automation Readiness Report

Date: 2026-06-25

Source: `C:\Users\malak Mohamed\OneDrive\Documents\instant transfers - codex.xlsx`

## Status Legend

| Status | Meaning |
| --- | --- |
| READY_FOR_AUTOMATION | Safe browser automation can validate the case with available UI paths and no unsafe dependency. |
| BLOCKED | Requires OTP, real transaction posting, controlled external registry data, or unavailable environment data. |
| INCOMPLETE | Test case lacks steps or data required to understand the scenario. |
| DUPLICATE | Test case is materially the same as another case. |
| AMBIGUOUS | Expected behavior is unclear or has multiple plausible interpretations. |
| NOT_AUTOMATABLE | The requested validation is outside the Playwright UI automation scope. |
| MISSING_EXPECTED_RESULT | Expected result is absent from the workbook row. |

## Per-Test Review

| TC ID | Title | Business Flow Coverage | Automation Feasibility | Status | Reason |
| --- | --- | --- | --- | --- | --- |
| SAIB-2184 | Method tiles displayed | Instant Transfer landing and method selection | High | READY_FOR_AUTOMATION | UI can verify all five method tiles are visible and selectable. |
| SAIB-2185 | Method selection clears beneficiary/input | Method switching state reset | High | READY_FOR_AUTOMATION | UI can switch tiles and assert beneficiary/input reset state. |
| SAIB-2186 | Mobile beneficiary hidden after Card switch | Beneficiary filtering by active method | Medium | READY_FOR_AUTOMATION | UI can verify list isolation when available list entries are present or absent. |
| SAIB-2187 | Any method switch clears beneficiary | General method switching state reset | High | READY_FOR_AUTOMATION | UI can switch representative methods and assert reset state. |
| SAIB-2188 | EGP-only currency | Currency restriction | High | READY_FOR_AUTOMATION | UI can assert currency selector absence or EGP lock. |
| SAIB-2189 | Non-EGP API tampering rejected | Server-side currency enforcement | None | NOT_AUTOMATABLE | Requires manual/proxy API tampering outside Playwright UI scope. |
| SAIB-2190 | Add Beneficiary type locked | Add Beneficiary metadata | High | READY_FOR_AUTOMATION | UI can open popup and assert type field is read-only/locked. |
| SAIB-2191 | Add Beneficiary method reflects active tile | Add Beneficiary metadata | High | READY_FOR_AUTOMATION | UI can select each method and assert popup method context. |
| SAIB-2192 | Nickname mandatory | Add Beneficiary validation | High | READY_FOR_AUTOMATION | UI can submit blank nickname and assert required validation. |
| SAIB-2193 | One-time beneficiary not saved after transaction | Beneficiary persistence after transaction | Low | BLOCKED | Requires transaction completion and post-transaction list verification. |
| SAIB-2194 | Saved beneficiary after OTP | Beneficiary persistence after OTP | Low | BLOCKED | Requires OTP confirmation and persistence. |
| SAIB-2195 | OTP challenge appears after valid Add Beneficiary | OTP boundary | Low | BLOCKED | Triggering OTP requires valid controlled beneficiary data and may send OTP. |
| SAIB-2196 | Valid OTP saves beneficiary | OTP completion | None | BLOCKED | Requires valid OTP entry. |
| SAIB-2197 | Invalid OTP blocks beneficiary save | OTP negative path | Low | BLOCKED | Requires OTP challenge interaction and controlled invalid OTP handling. |
| SAIB-2198 | Cancel closes Add Beneficiary | Add Beneficiary cancel behavior | High | READY_FOR_AUTOMATION | UI can open and cancel popup without saving. |
| SAIB-2200 | Valid mobile resolves beneficiary name | Mobile Number positive resolution | Low | BLOCKED | Requires approved valid mobile/IPN test data. |
| SAIB-2201 | Mobile name retrieval failure blocks transaction | Mobile Number external failure | Low | BLOCKED | Requires controlled IPN lookup failure condition. |
| SAIB-2202 | OTP blocked before name retrieval | Mobile Number lookup gate | Low | BLOCKED | Requires controlled resolution timing and OTP gate evidence. |
| SAIB-2203 | Invalid mobile format | Mobile Number validation | High | READY_FOR_AUTOMATION | UI can enter invalid formats and assert validation. |
| SAIB-2204 | Unregistered mobile blocked | Mobile Number external negative | Low | BLOCKED | Requires deterministic unregistered mobile data against IPN. |
| SAIB-2205 | Arabic mobile beneficiary name display | Mobile Number Arabic rendering | Low | BLOCKED | Requires registered mobile resolving to Arabic beneficiary name. |
| SAIB-2206 | Phone field mandatory | Add Beneficiary Mobile Number validation | High | READY_FOR_AUTOMATION | UI can submit blank phone field and assert required validation. |
| SAIB-2207 | Card number fewer than 16 digits | Card Number validation | High | READY_FOR_AUTOMATION | UI can enter short card number and assert validation. |
| SAIB-2208 | Card number max 16 digits | Card Number validation | High | READY_FOR_AUTOMATION | UI can enter over-length value and assert input cap. |
| SAIB-2209 | Card number numeric only | Card Number validation | High | READY_FOR_AUTOMATION | UI can enter alphanumeric value and assert rejection/filtering. |
| SAIB-2210 | Card not registered in IPN | Card Number external negative | Low | BLOCKED | Requires controlled card data absent from IPN network. |
| SAIB-2211 | Bank Account fields mandatory | Bank Account validation | High | READY_FOR_AUTOMATION | UI can select method/sub-option and assert required controls. |
| SAIB-2212 | IBAN accepts uppercase alphanumeric max 35 | IBAN validation | High | READY_FOR_AUTOMATION | UI can enter valid boundary value. |
| SAIB-2213 | IBAN over 35 rejected | IBAN validation | High | READY_FOR_AUTOMATION | UI can enter over-length value and assert cap. |
| SAIB-2214 | Lowercase IBAN rejected | IBAN validation | High | READY_FOR_AUTOMATION | UI can enter lowercase value and assert validation. |
| SAIB-2215 | IBAN special characters rejected | IBAN validation | High | READY_FOR_AUTOMATION | UI can enter spaces/hyphens and assert validation. |
| SAIB-2216 | Account number over 35 rejected | Bank Account validation | High | READY_FOR_AUTOMATION | UI can enter over-length numeric value and assert cap. |
| SAIB-2217 | Bank name mandatory | Bank Account validation | High | READY_FOR_AUTOMATION | UI can omit bank name and assert required validation. |
| SAIB-2218 | Bank Account and IBAN list isolation | Beneficiary list filtering by sub-method | Medium | READY_FOR_AUTOMATION | UI can validate list isolation where existing list entries are visible; no transaction posting is required. |
| SAIB-2219 | Valid IPA resolves beneficiary | IPA positive resolution | Low | BLOCKED | Requires valid IPA/PSP lookup data. |
| SAIB-2220 | IPA prefix shorter than five rejected | IPA validation | High | READY_FOR_AUTOMATION | UI can enter short prefix and assert validation. |
| SAIB-2221 | IPA prefix longer than 25 rejected | IPA validation | High | READY_FOR_AUTOMATION | UI can enter long prefix and assert validation. |
| SAIB-2222 | IPA total length over 30 rejected | IPA validation | High | READY_FOR_AUTOMATION | UI can enter over-length IPA and assert cap. |
| SAIB-2223 | IPA lowercasing/case-insensitive processing | IPA case handling | Medium | READY_FOR_AUTOMATION | UI can assert visible input normalization or accepted validation without backend storage access. |
| SAIB-2224 | IPA case-insensitive match to same beneficiary | IPA positive resolution | Low | BLOCKED | Requires known valid IPA pair resolving to the same beneficiary. |
| SAIB-2225 | Unsupported IPA characters rejected | IPA validation | High | READY_FOR_AUTOMATION | UI can enter unsupported characters and assert validation. |
| SAIB-2226 | Arabic IPA-linked display name | IPA Arabic rendering | Low | BLOCKED | Requires IPA resolving to Arabic display name. |
| SAIB-2227 | Non-existent IPA blocked | IPA external negative | Low | BLOCKED | Requires deterministic PSP validation response. |
| SAIB-2228 | IPA allowed special characters accepted | IPA positive resolution | Low | BLOCKED | Requires valid IPA with period/hyphen that resolves successfully. |
| SAIB-2229 | Blank Payment Address required | IPA validation | High | READY_FOR_AUTOMATION | UI can submit blank field and assert required validation. |
| SAIB-2230 | Valid wallet resolves beneficiary | Wallet positive resolution | Low | BLOCKED | Requires valid wallet number resolving through external service. |
| SAIB-2232 | Blank Wallet number required | Wallet validation | High | READY_FOR_AUTOMATION | UI can submit blank field and assert required validation. |

## Automation Scope Decision

Only `READY_FOR_AUTOMATION` cases should be executed as browser automation. `BLOCKED` and `NOT_AUTOMATABLE` cases may remain as traceability records or skipped cases, but must not perform UI actions or hidden setup.

## Totals

| Metric | Count |
| --- | ---: |
| Total Test Cases | 47 |
| Ready for Automation | 29 |
| Blocked | 17 |
| Incomplete | 0 |
| Ambiguous | 0 |
| Duplicate | 0 |
| Not Automatable | 1 |
| Missing Expected Result | 0 |

