# SAIB-0059 Feature Implementation Checklist

## Feature Scope

Feature: Real-time Account Details

Test case: SAIB-0059

Expected fields:

- Account Number
- IBAN
- Product Name
- Account Type
- Currency
- Available Balance
- Actual Balance
- Hold Balance
- Status
- Opening Date
- Branch
- Collateral Amount when an explicit API/UI field is present

## Architecture

```text
SAIB-0059 spec
â†“
AccountManagementPage.verifyRealTimeAccountDetails()
â†“
AccountSelectorComponent + AccountDetailsComponent
â†“
AccountManagementApiObserver
â†“
accountDetailsNormalization
â†“
Locator Repository
```

The test contains metadata and one public page call only. Components return
actual UI values. The page owns comparison. The observer owns response parsing.
The pure utility owns formatting rules.

## Verified contracts

- Route: `#/accounts`
- API: `POST /api/v1/customer/accounts/details`
- Request: `AccountNumber`, `QueryType`, `Lang`
- Product Name: `ProductCodeDescription`
- Account Type: `ProductCodeDescription`
- Available Balance: `Balance.Avail.Amt`
- Actual Balance: `Balance.BookingBalance.Amt`
- Hold Balance: `Balance.TotalHoldAmount.Amt`
- Status: `IsDormantAccount` mapped to Active/Dormant
- Opening Date: `OpeningDate`, displayed as English long date
- Branch: `BranchDescription`, normalized for the UI's omitted `Branch` suffix
- Collateral: no explicit field in the current live response; not applicable

## Completion

- [x] User explicitly requested implementation
- [x] Live DOM and same-navigation network contract verified
- [x] Locators centralized
- [x] Typed API model added
- [x] Pure formatting tests added
- [x] Test calls page facade only
- [x] TypeScript passes
- [x] Focused UAT test passes
- [x] SAIB-0062 shared-code regression iterates to a populated account and reaches its strict APP_UI Running Balance assertion
