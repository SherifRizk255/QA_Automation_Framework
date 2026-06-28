# Instant Transfer Traceability Matrix

| REQ | IU | TC IDs | AUT | Execution Status |
| --- | --- | --- | --- | --- |
| REQ-IT-001 | IU-IT-001 | SAIB-2184 | `tests/portal/transfers/instant-transfer.spec.ts` | Passed |
| REQ-IT-002 | IU-IT-002 | SAIB-2185, SAIB-2187 | `tests/portal/transfers/instant-transfer.spec.ts` | Passed after targeted rerun |
| REQ-IT-003 | IU-IT-003 | SAIB-2186 | `tests/portal/transfers/instant-transfer.spec.ts` | Executed |
| REQ-IT-004 | IU-IT-004 | SAIB-2188, SAIB-2189 | `tests/portal/transfers/instant-transfer.spec.ts` | SAIB-2188 executable; SAIB-2189 blocked by API tampering requirement |
| REQ-IT-005 | IU-IT-005 | SAIB-2190, SAIB-2191, SAIB-2192 | `tests/portal/transfers/instant-transfer.spec.ts` | Passed / executable |
| REQ-IT-006 | IU-IT-006 | SAIB-2193 to SAIB-2197 | `tests/portal/transfers/instant-transfer.spec.ts` | Skipped, OTP/real transaction boundary |
| REQ-IT-007 | IU-IT-007 | SAIB-2200 to SAIB-2206 | `tests/portal/transfers/instant-transfer.spec.ts` | Negative validations executable; external positive resolution blocked |
| REQ-IT-008 | IU-IT-008 | SAIB-2207 to SAIB-2210 | `tests/portal/transfers/instant-transfer.spec.ts` | SAIB-2208 and SAIB-2209 failed as APP_VALIDATION; SAIB-2210 blocked |
| REQ-IT-009 | IU-IT-009 | SAIB-2211 to SAIB-2218 | `tests/portal/transfers/instant-transfer.spec.ts` | SAIB-2216 failed as APP_VALIDATION; remaining executable validations passed after healing |
| REQ-IT-010 | IU-IT-010 | SAIB-2219 to SAIB-2229 | `tests/portal/transfers/instant-transfer.spec.ts` | Negative validations passed after healing; positive/external cases blocked |
| REQ-IT-011 | IU-IT-011 | SAIB-2230, SAIB-2232 | `tests/portal/transfers/instant-transfer.spec.ts` | SAIB-2232 passed; SAIB-2230 blocked by external positive wallet resolution |

