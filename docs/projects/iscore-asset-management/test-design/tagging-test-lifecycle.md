# Tagging — Test Lifecycle Report

> Concrete application of `docs/test-design/test-lifecycle.md` (the shared,
> project-agnostic lifecycle specification) to the Tagging regression suite.
> Required by master-workflow Rule 8: Test Execution may not run without this
> report plus defined setup/teardown. Consumed by Failure Analysis (skill 15)
> and Self-Healing (skill 16) to classify lifecycle vs. test-logic failures.

## Lifecycle hierarchy for this suite

```
SUITE (tests/regression-tcs/{authentication,tagging}/**)
↓
TEST CASE (one of the 21 TCs in tagging-manual-test-cases.md)
↓
TEST STEP (page-object method calls, per skill 23)
```

## SUITE_SETUP

| Action | Category | Where implemented |
|---|---|---|
| Environment validation (`TARGET_ENV != PROD` guard) | ENVIRONMENT_STATE | `config/resources.ts` module load (throws at import time) |
| Locator repository load | ENVIRONMENT_STATE | `utils/locatorRepository.ts` (lazy, per-resolve) |
| CRM role assignment — set `cis_users.cis_role = Maker` **once per worker** | EXTERNAL_DEPENDENCY | `RoleApplier.ensureRoleApplied('MAKER')`, called by the `roleApplier` worker-scoped fixture the first time `signInAs()` is used |

**This suite deliberately does NOT run the CRM role write in `SUITE_SETUP` for
every regression case** — see Dependency Resolution below. Only a test that
explicitly needs `signInAs()` (currently none in the default suite) triggers
it, and then only once per worker (Rule 5: suite setup executes once,
generalized here to "once per shared dependency" since Playwright workers are
the actual isolation unit, not a single global process).

## TC_SETUP (per test case)

| Dependency | Category | Lifecycle action | Fixture |
|---|---|---|---|
| Authenticated portal session | AUTHENTICATION | Portal FORM_LOGIN (skill 19) | `authenticatedPortal` fixture → `LoginPage.goto()` + `loginWithConfiguredUser()` + `assertLoginRouteLeft()` |
| Already on the Tagging module | ENVIRONMENT_STATE | Open Tagging from the header | `makerTaggingPage` fixture (built on `authenticatedPortal`) |
| Maker role active | AUTHORIZATION | Assumed already set on the CRM record (see `project-profile.md` role model) — **not** re-verified per case | N/A — this is the one deliberate deviation from "TC_SETUP validates every dependency"; documented, not silent (see Rule 7 note below) |

TC_SETUP is implemented as Playwright **fixtures**, not `beforeEach()` hooks
(per skill 23's Playwright-first rule — fixtures are the framework's native
lifecycle mechanism and give per-test dependency injection that a bare
`beforeEach` cannot).

Mapping to the shared spec's fixture-generation rules:

```
authenticatedPortal → LOGIN_PORTAL_USER   (reusable, independent, deterministic)
makerTaggingPage    → OPEN_TAGGING_MODULE (reusable, depends on authenticatedPortal)
signInAs            → APPLY_ROLE_AND_LOGIN (reusable, worker-cached role write)
```

## TEST EXECUTION

Test steps are the business assertions in each spec file — see
`tagging-manual-test-cases.md` for the full list. No lifecycle logic belongs
here (skill 23: specs read as business scenarios only).

## TC_TEARDOWN (per test case)

| Action | Category | Where implemented |
|---|---|---|
| Close the browser context opened for this test | Session cleanup | Playwright's own `page`/context fixture teardown (automatic — `authenticatedPortal` reuses the standard `page` fixture, so no manual cleanup code exists or is needed) |
| Close any context opened by `signInAs()` | Session cleanup | `signInAs` fixture's `use()` continuation closes every context it opened, per test |

This suite is **read-mostly with one exception**: TC-TAG-ASSET-031/032/033
submit real assets to the container, which mutates grid state for the rest
of the run. No teardown reverts this — see Rule 4 exception below.

### Rule 4 exception — why submitted assets are not un-submitted

The shared spec's Rule 4 ("Teardown Must Restore State") is intentionally
not applied to the submit cases. Un-submitting would require a documented
CRM/portal "return to pending" action that is out of scope for this work
order, and reversing it via direct data manipulation would violate skill
16's "never bypass business validations" rule. Consequence: **submit cases
consume grid rows** — the environment owner must ensure the demo tenant's
Tagging grid is seeded with enough eligible rows to survive a full suite run
(TC-031 consumes 1, TC-032 consumes `TEST_DATA.tagging.multiSelectCount`,
TC-033 consumes every remaining eligible row). This is a data-ownership
note, not an automation defect.

## SUITE_TEARDOWN

| Action | Category |
|---|---|
| None required | This suite creates no suite-shared data structures beyond the CRM role field, which is a persistent, reusable precondition — not a temporary object to clean up. |

## Dependency resolution rules applied

Per the shared spec: "when a dependency is shared across multiple test
cases → generate SUITE_SETUP + SUITE_TEARDOWN." The Maker role is exactly
this kind of shared dependency, which is why `RoleApplier` is worker-scoped
(effectively suite-level, once per worker) rather than re-applied in every
TC_SETUP — re-writing the same CRM field before all 21 cases would be both
wasteful and would reintroduce the CRM-network dependency this suite
deliberately decoupled from the default path (see project-profile.md's role
model section).

## Retry eligibility

| Failure | Retry eligible? |
|---|---|
| Portal connection reset / timeout before any DOM exists | **No** — classified ENVIRONMENT, not a transient retry candidate in this context (see `reports/failure-analysis.md` FA-001); retrying without fixing reachability just repeats the same failure. |
| A locator resolves to 0 or >1 elements | No — classify via Failure Analysis first (skill 15), do not retry blindly. |
| CRM role write fails mid-worker | Yes, once — matches the shared spec's "temporary environment connectivity issues" retry class, since `RoleApplier` is a network write that can transiently fail independent of a code defect. |

Maximum retries: 3, per the shared spec — enforced at the Playwright config
level (`retries: process.env.CI ? 2 : 0`), not per-lifecycle-action, since
this suite has no custom retry orchestration beyond Playwright's own.

## Self-healing scope for this suite's lifecycle

Allowed: fix a locator or synchronization issue inside `LoginPage.goto()`,
`TaggingPage.openFromHeader()`, or the `RoleApplier`/`RoleSwitchOrchestrator`
fixtures themselves.

Not allowed: removing the CRM role-application step from `signInAs()`,
skipping `assertLoginRouteLeft()`, or treating a submit-case's grid mutation
as a bug to "fix" by weakening the row-count assertion.

## Lifecycle traceability example

```
REQ-007
↓
IU-007
↓
SCN-016
↓
TC-TAG-ASSET-031
↓
TC_SETUP
↓
authenticatedPortal fixture → LoginPage.goto() + loginWithConfiguredUser()
↓
makerTaggingPage fixture → TaggingPage.openFromHeader()
```
