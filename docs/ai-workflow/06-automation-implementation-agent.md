# 06 - Automation Implementation Agent

## Purpose
Convert approved manual test cases into Playwright JavaScript automated test cases using framework standards.

## When to use this skill
Use this skill only after manual test cases and expected results are approved.

## Required inputs
- Approved `docs/test-design/manual-test-cases.md`
- `docs/analysis/system-map.md`
- `docs/analysis/locator-inventory.md`
- `docs/analysis/page-object-recommendations.md`
- Project environment/config details
- Existing Page Objects, fixtures, utils, and data files

## Required outputs
- Page Objects under `pages/`
- Tests under `tests/`
- Fixtures under `fixtures/`
- Utilities under `utils/`
- Data under `data/`
- `docs/test-design/automation-coverage.md`

## Step-by-step behavior
1. Read approved manual test cases.
2. Read system map and locator inventory.
3. Reuse existing Page Objects where possible.
4. Create new Page Objects when needed.
5. Keep locators inside Page Objects.
6. Create or update fixtures, utilities, and data files.
7. Implement tests under `tests/`.
8. Add screenshots on important steps where useful.
9. Keep tests independent.
10. Avoid combining unrelated validations in one test.
11. Update automation coverage.

## Selector Strategy
- Prefer Playwright recommended locators: `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, and `getByTestId`.
- Do not use absolute XPath.
- Avoid brittle CSS selectors.
- For Microsoft Dynamics CRM, prefer accessible names, labels, button text, tab names, form labels, and stable attributes.
- If a selector is uncertain, inspect the real page in headed mode or with Playwright codegen before finalizing.

## Wait Strategy
- Never use `page.waitForTimeout()`.
- Use Playwright web-first assertions such as `expect(locator).toBeVisible()`, `expect(locator).toBeEnabled()`, and `expect(page).toHaveURL()`.
- Wait for business-visible states, not arbitrary time.

## Blocker Handling Rules
- Detect known business blockers through visible text or accessible controls.
- For the active session blocker text, "You have an active session. Do you want to close it?", capture evidence before clicking a confirmation button.
- Accept only visible confirmation controls with stable text such as Proceed, OK, Yes, or Continue.
- Attach blocker screenshots to the Playwright report whenever `testInfo` is available.
- Continue the login flow after approved blocker handling.
- Do not hide the blocker; document it through logs, annotations, soft assertions, or reports.

## Quality gates
- Every automated test has a clear business purpose.
- Every automated test maps to an approved manual test case or requirement.
- No credentials are hardcoded.
- No fake locators are introduced.
- No hard-coded waits are used.
- Application defects are not hidden.

## Do-not rules
- Do not generate tests without clear expected results.
- Do not invent business rules.
- Do not invent locators.
- Do not remove assertions to make tests pass.
- Do not bypass business validations.

## Output file locations
- `pages/`
- `tests/`
- `fixtures/`
- `utils/`
- `data/`
- `docs/test-design/automation-coverage.md`

## Example prompt to use this skill
“Use the automation implementation agent to automate the approved manual test cases for `<module>`.”
