# 02 - System Walkthrough Agent

## Purpose
Use the system URL and Playwright browser inspection to safely walk through a live application, understand screens and interactions, and create a locator inventory.

## When to use this skill
Use this skill after project intake, before writing automated tests, or whenever locators/navigation paths are unclear.

## Required inputs
- Project profile
- Environment/config values
- Approved login credentials strategy, if login is needed
- Scope of screens/modules to inspect
- Known blockers and safe handling rules

## Required outputs
- `docs/analysis/system-map.md`
- `docs/analysis/navigation-map.md`
- `docs/analysis/screen-inventory.md`
- `docs/analysis/locator-inventory.md`
- `docs/analysis/blocker-inventory.md`
- `docs/analysis/page-object-recommendations.md`
- Screenshots under `reports/system-walkthrough/`

## Step-by-step behavior
1. Open the system URL from environment or project config values.
2. Login only if credentials are provided and approved.
3. Handle known blockers safely.
4. Walk through visible non-destructive screens.
5. Capture navigation paths, screen names, routes, and hashes.
6. Capture visible buttons, dropdowns, text fields, tables, tabs, links, and modals.
7. Identify loading indicators, validation messages, required fields, and blockers.
8. Recommend stable Playwright locators.
9. Assign locator confidence as High, Medium, or Low.
10. Capture screenshots for discovered screens.
11. Create system map, navigation map, screen inventory, locator inventory, blocker inventory, and page object recommendations.

## Quality gates
- Only non-destructive navigation is performed.
- Every discovered screen includes screen name, route, navigation path, purpose, visible controls, blockers, and recommended page object name.
- Every interactive element includes locator recommendation, fallback locator, confidence, reason, and instability risks.
- Screenshots are saved under `reports/system-walkthrough/`.

## Do-not rules
- Do not create or submit real transactions.
- Do not delete data.
- Do not change customer data.
- Do not change passwords.
- Do not update profile information.
- Do not perform destructive or irreversible actions.
- Do not use low-confidence locators as final automation locators without noting risk.

## Output file locations
- `docs/analysis/system-map.md`
- `docs/analysis/navigation-map.md`
- `docs/analysis/screen-inventory.md`
- `docs/analysis/locator-inventory.md`
- `docs/analysis/blocker-inventory.md`
- `docs/analysis/page-object-recommendations.md`
- `reports/system-walkthrough/`

## Example prompt to use this skill
“Use the system walkthrough agent to inspect the application navigation and create a locator inventory.”
