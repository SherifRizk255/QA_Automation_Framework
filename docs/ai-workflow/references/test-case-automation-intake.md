# Test-Case Automation Intake

## Purpose

Normalize candidate Playwright test cases from JSON or Excel `.xlsx` before
automation implementation. This is a reusable intake stage owned by the
Automation Implementation Agent.

## Supported inputs

- JSON matching `docs/ai-workflow/schemas/playwright-test-case.schema.json`.
- Excel `.xlsx` with these canonical columns:
  - `TC ID`
  - `Module`
  - `Sub-module`
  - `Title`
  - `Steps`
  - `Expected Result`
  - `Known API endpoint/fields`
  - `Known test data`
  - `Known route/heading`
  - `Additional business rules`
  - `Priority`
  - `Suite/tags`

Column matching is case-insensitive and ignores spaces, hyphens, underscores,
and `/`. Existing workbook columns are mapped to canonical names; the source
workbook is never rewritten. Multiline cells remain ordered multiline values.

## Mandatory validation

Each case must contain:

- `tcId`
- `module`
- `subModule`
- `title`
- at least one non-empty step
- `expectedResult`

The parser rejects duplicate IDs after trimming and case-insensitive
normalization. It preserves the original supplied TC ID in output.

## Readiness analysis

The parser reports explicit gaps for:

- API contracts
- UI contracts
- navigation contracts
- test-data contracts
- formatting/normalization contracts
- conditional/null behavior

Absence alone is not always a gap. The parser detects a gap when the supplied
case requires that contract category but does not supply an approved contract.
The resulting classification is `Ready` or `Needs contract clarification`.
Human review may refine the classification with repository, application,
network, or approved-document evidence.

## Approval gate

Intake output is a proposal. After producing the normalized contract and
readiness report:

```text
STOP

Explicit user approval is required before implementation.
```

Approval must cover the finalized contract, UI-only selection rules,
UI-to-API mappings, skill/file changes, and implementation scope.

## Implementation rules after approval

- Generate only approved cases and preserve every supplied TC ID.
- Reuse existing pages, components, observers, fixtures, utilities, and locator
  keys where equivalent behavior is proven.
- Expected API data must not influence UI record selection.
- Install observers before the action that triggers the compared response.
- Use the same-action response from the active UI session.
- Keep locators out of tests.
- Keep API parsing and calculations out of tests.
- Keep expected API values and Allure logic out of UI components.
- Put IDs, titles, tags, and test orchestration in the test.
- Put UI/API comparison in the feature page.
- Put numeric, date, currency, text, and composite-key normalization in pure
  utilities with focused tests.
- Never add arbitrary waits, retries, skips, fixmes, or weaker assertions to
  manufacture a passing result.

## CLI

```powershell
node --experimental-strip-types scripts/test-case-ingestion/parse-test-cases.ts <input.json|input.xlsx> [output.json]
```

The CLI exits non-zero for invalid input or duplicate TC IDs.
