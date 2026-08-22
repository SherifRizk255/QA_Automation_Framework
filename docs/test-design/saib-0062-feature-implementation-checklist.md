# SAIB-0062 Feature Implementation Checklist

## Feature Scope

Feature: Account Management transaction-history drill-down

Test cases in scope: SAIB-0062

Representative smoke test: the single approved SAIB-0062 two-phase E2E flow

Known defects:

- The deployed transaction-details popup exposes amount, Transaction Date,
  Value Date, Reference No, Transaction Name, and Account Number.
- It does not expose the required Running Balance or Beneficiary/Payer row.

## Architecture Map

Feature page: `pages/portal-pages/accounts/AccountManagementPage.ts`

Components:

- `AccountSelectorComponent`
- `TransactionListComponent`
- `TransactionDetailsComponent`

Typed UI models: `AccountSelectorOption`, `TransactionRowUi`,
`TransactionDetailsUi`

Pure calculator/utility required:

- Required: `transactionNormalization.ts` owns text, account identity, money,
  date, running-balance, party-name, and transaction identity normalization.

API dependencies:

- `POST /api/v1/customer/accounts/details`
- `POST /api/v1/customer/accounts/statement`

CRM dependencies: None

## Locator Ownership

Locator groups: `PORTAL.ACCOUNTS.SELECTOR.*`,
`PORTAL.ACCOUNTS.TRANSACTIONS.*`,
`PORTAL.ACCOUNTS.TRANSACTION_DETAILS.*`

Existing keys reused:

- `PORTAL.DASHBOARD.NAV.ACCOUNTS`
- `PORTAL.DASHBOARD.DESTINATION.ACCOUNTS_HEADING`
- `PORTAL.COMMON.LOADING.PROGRESSBAR`

New keys required: 16 Accounts selector/list/dialog keys registered in the
central repository.

Owner of each group: the three narrow components listed above.

Live validation completed:

- Selector root, trigger, dynamic count, option collection, and option fields:
  yes.
- Transaction root and zero-row state: yes.
- Account search: current account first, followed by each enabled account in a
  stable lexical order until the same-action statement response has
  transactions.
- Statement request contract: POST route, JSON headers, `x-channel`, language,
  origin, and referer are validated. Chromium-managed transport headers are not
  pinned to browser-version-specific values.

## Public Page API

Public methods used by tests:

- `establishSelectedAccountContext()`
- `validateTransactionDrillDown(context)`

TC-to-method mapping: SAIB-0062 uses both methods as two major Allure phases.

## Files

Files to create: feature page, three components, observer/models, pure
normalizer, focused unit tests, regression spec.

Files to modify: fixture, resources, locator repository, component catalog,
coverage, traceability, and locator inventory.

Protected files: `.env`, credentials, business application code, unrelated
user changes.

## Implementation Order

- [x] Components first
- [x] Pure logic where needed
- [x] Thin feature page
- [x] One smoke test
- [x] Architecture review
- [x] Regression expansion limited to the one approved case

## Approval Gate

Approved by the user in-thread on 2026-07-30 before implementation.

## Completion Checks

- [x] Tests call page methods only
- [x] Components own UI mechanics
- [x] Components return typed UI values
- [x] Every account is selected through the UI in a deterministic order
- [x] The same-action statement response decides whether the search continues
- [x] Search stops at the first account whose response contains transactions
- [x] All runtime locators use private lazy `repository.locator(...)` getters
- [x] No constructor locator assignments
- [x] No `repository.resolve()` in new pages/components
- [x] No raw Playwright locators in new pages/components
- [x] Pure calculations are outside browser-facing classes
- [x] Focused pure-logic tests added
- [x] TypeScript passes
- [x] `git diff --check` passes
- [x] Discovery count includes SAIB-0062
- [x] Known defects remain visible
