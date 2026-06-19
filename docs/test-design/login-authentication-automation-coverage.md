# Login & Authentication Automation Coverage

Source artifact: `C:\Users\malak Mohamed\Documents\Codex\agent-automation- excel.xlsx`

Assumption: Earlier framework stages are complete and approved per user instruction. This file records the Automation Implementation Agent output only.

| Test Case ID | Module | Feature | Automation Status | Reason | Automated Spec File Path | Page Object Used | Risks or Assumptions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SAIB-0209 | Login & Authentication | Credentials Login | Automated | Existing approved login locators support username, password, sign-in, active-session blocker handling, and dashboard arrival evidence. | `tests/portal/credentials-login.spec.ts` | `pages/portal/LoginPage.js`, `pages/portal/DashboardPage.js` | Dashboard assertion reuses existing `DashboardPage`; API parameter validation is not observable from UI automation. |
| SAIB-0212 | Login & Authentication | Credentials Login | Blocked | Workbook does not provide approved non-existing username/password test data, exact generic error message, error locator, or audit-trail access path. | `tests/portal/credentials-login.spec.ts` | N/A | Automating this without approved data or observable audit evidence would invent test data/assertions. |
| SAIB-0214 | Login & Authentication | Credentials Login | Blocked | Workbook does not provide approved invalid password test data, exact generic error message, error locator, or audit-trail access path. | `tests/portal/credentials-login.spec.ts` | N/A | Automating this without approved data or observable audit evidence would invent test data/assertions. |
| SAIB-0217 | Login & Authentication | Credentials Login | Automated | Existing username and password locators support a login-page blocking check without hardcoded waits or credentials. | `tests/portal/credentials-login.spec.ts` | `pages/portal/LoginPage.js` | Exact validation message is not asserted because no approved exact message exists. |
| SAIB-0218 | Login & Authentication | Credentials Login | Automated | Existing username and password locators support a login-page blocking check for both empty fields. | `tests/portal/credentials-login.spec.ts` | `pages/portal/LoginPage.js` | Exact validation message is not asserted because no approved exact message exists. |

## Quality Gate Notes

- Tests use Page Object methods only for UI interactions.
- Locators are stored in `LoginPage`.
- Credentials are read from `.env`, matching the existing login automation pattern.
- No hardcoded waits were introduced.
- No negative credentials, error messages, audit assertions, API assertions, or business rules were invented.
