# Feature Implementation Checklist

## Feature Scope

Feature:

Test cases in scope:

Representative smoke test:

Known defects:

## Architecture Map

Feature page:

Components:

Typed UI models:

Pure calculator/utility required:

- `Not required`, or
- `Required: <name and responsibility>`

API dependencies:

CRM dependencies:

## Locator Ownership

Locator groups:

Existing keys reused:

New keys required:

Owner of each group:

Live validation completed:

## Public Page API

Public methods used by tests:

TC-to-method mapping:

## Files

Files to create:

Files to modify:

Protected files:

## Implementation Order

- [ ] Components first
- [ ] Pure logic where needed
- [ ] Thin feature page
- [ ] One smoke test
- [ ] Architecture review
- [ ] Regression expansion

## Approval Gate

Do not begin production implementation until this checklist is completed and approved.

## Completion Checks

- [ ] Tests call page methods only
- [ ] Components own UI mechanics
- [ ] Components return typed UI values
- [ ] No API expectation influences UI selection
- [ ] All runtime locators use private lazy `repository.locator(...)` getters
- [ ] No constructor locator assignments
- [ ] No `repository.resolve()` in pages/components
- [ ] No raw Playwright locators in pages/components
- [ ] Pure calculations are outside browser-facing classes
- [ ] Focused pure-logic tests added where needed
- [ ] TypeScript passes
- [ ] `git diff --check` passes
- [ ] Discovery count matches
- [ ] Known defects remain visible
