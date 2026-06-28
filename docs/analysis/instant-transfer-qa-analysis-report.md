# Instant Transfer QA Analysis Report

Date: 2026-06-25

## Scenario Classes

| Scenario Class | TC IDs | Automation Decision |
| --- | --- | --- |
| Navigation and method visibility | SAIB-2184 | Automated |
| Method switching and filtering | SAIB-2185, SAIB-2186, SAIB-2187 | Automated |
| Source account currency | SAIB-2188 | Automated |
| Add Beneficiary metadata and required fields | SAIB-2190, SAIB-2191, SAIB-2192 | Automated |
| Cancel behavior | SAIB-2198 | Automated |
| Negative input validation | SAIB-2203, SAIB-2206 to SAIB-2209, SAIB-2211 to SAIB-2217, SAIB-2220 to SAIB-2225, SAIB-2229, SAIB-2232 | Automated |
| Unsafe or external-dependent behavior | SAIB-2189, SAIB-2193 to SAIB-2197, SAIB-2200 to SAIB-2202, SAIB-2204, SAIB-2205, SAIB-2210, SAIB-2219, SAIB-2224, SAIB-2226 to SAIB-2228, SAIB-2230 | Skipped with blocker reason |

## Risk Notes

Positive beneficiary resolution and OTP flows require dedicated safe test data and approval before automation can complete them.

