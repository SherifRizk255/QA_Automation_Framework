# CLAUDE.md — QA Automation Framework

This file is loaded automatically at the start of every session. It defines MANDATORY behavior for every request in this project.

---

## RULE 0 — SKILLS FIRST, ALWAYS

Before acting on ANY request, you MUST:

1. Read `docs/GUIDELINES.md` (once per session).
2. Check the routing table below and open every skill file relevant to the request.
3. State which skill(s) you are applying in your first response line, e.g.:
   `Applying skills: 13-automation-implementation-agent, 21-allure-reporting-standard, 23-clean-code-standard`
4. Follow those skills' rules exactly. If a request conflicts with a skill, say so before proceeding.

If NO skill matches the request, say `No workflow skill applies` and proceed with GUIDELINES.md rules only.

Never skip this step, even for small requests. A one-line code edit still passes through skill 23.

---

## SKILL ROUTING TABLE

All skills live in `docs/ai-workflow/`. Match the request to the row(s) below:

| If the request involves... | Open these skills |
|---|---|
| Starting a new project / client / environment onboarding | 01-project-intake-agent, 22-multi-project-configuration |
| Exploring a live app, discovering screens or locators | 02-system-walkthrough-agent, 19-authentication-session-manager |
| Analyzing requirements, BRD/FRD/user stories/CRs | 00-master-workflow, 03-input-detector, 04-intent-preview, 05-normalizer, 06-requirements-quality-checker |
| Change Requests specifically | 10-cr-analyzer (+ the requirements row above) |
| Risk, coverage, gap, or dependency analysis | 09-qa-analyzer |
| Traceability, RTM, coverage plans | 11-traceability-manager |
| Writing/generating manual test cases | 12-tc-generator, 11-traceability-manager |
| Writing/editing ANY Playwright code (page objects, specs, fixtures) | 13-automation-implementation-agent, 23-clean-code-standard, 21-allure-reporting-standard, 24-centralized-resource-standard |
| Anything touching login, credentials, sessions, NTLM, storage state | 19-authentication-session-manager |
| Tests spanning Portal AND CRM (or any two systems) | 20-cross-system-orchestration, 19-authentication-session-manager |
| Running tests, collecting results | 14-test-execution-agent, 21-allure-reporting-standard, 25-execution-report-standard |
| Investigating failures, flaky tests, root cause | 15-failure-analysis-agent, 25-execution-report-standard |
| Fixing broken locators / self-healing | 16-self-healing-agent, 23-clean-code-standard, 24-centralized-resource-standard |
| Reports, summaries, sign-off, release readiness | 17-final-report-agent, 18-qa-review-agent, 25-execution-report-standard |
| Env files, URLs, switching between SAIB/ABK/HDB/etc. | 22-multi-project-configuration, 24-centralized-resource-standard |
| Adding a URL/route/test-data value, or anything about `config/resources.ts` / the locator repository | 24-centralized-resource-standard |
| The Cubic HTML report, execution reporting, failure classification (F1–F5) | 25-execution-report-standard |
| ANY code creation or modification (always, in addition to above) | 23-clean-code-standard, 24-centralized-resource-standard |

Pipeline order, approval gates, and the stage↔file mapping are authoritative in `00-master-workflow.md`.

---

## RULE 1 — FIND BEFORE YOU CREATE

Before creating any file, method, fixture, or locator: search the repo for it first (multiple names, `grep -ri`). Code snippets provided by the user may reference symbols from other projects — those symbols almost always exist HERE under the same name. Locate them; never scaffold parallel versions of `BaseCrmPage`, `AREAS`, fixtures files, or anything else that already exists.

## RULE 2 — DEFINITION OF DONE

Every code task ends with:
1. `npx tsc --noEmit` → zero errors
2. Run the touched spec in isolation
3. Skill 23 review checklist passed
4. Allure metadata present (skill 21)
5. No hardcoded URLs/credentials/locators outside the central resources — `config/resources.ts` + locator repository (skill 24)
6. Runs produce the Cubic HTML report automatically (skill 25) — never unregister the reporter

## RULE 3 — STOP CONDITIONS

Stop and ask (with a precise question) ONLY for: tenant-specific values that genuinely don't exist in the repo (e.g., a D365 data-id), missing credentials, or a skill conflict. Everything else: read the repo and proceed.

## RULE 4 — NEVER

Never touch production URLs. Never commit `.auth/` or secrets. Never weaken assertions to force green. Never modify unrelated passing tests. Never use `waitForTimeout`.
