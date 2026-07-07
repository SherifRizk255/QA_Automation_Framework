# AI Workflow Skills — Full Audit Report

Date: 2026-07-05
Scope: `docs/ai-workflow/` (19 skill files, ~12,500 lines), `docs/analysis/`, `docs/test-design/`

---

## Overall assessment

The skill set is unusually mature: clear stage separation, explicit input/output contracts, approval gates, handoff blocks, and a genuinely good locator-repository model with confidence/volatility/healing history. The architecture (Intent Candidates → Intent Units → Traceability → TC → Automation → Execution → Healing → Report → Sign-off) is sound and consistent with how the real artifacts in `docs/analysis/` and `docs/test-design/` were produced.

The problems found are of two kinds: **internal inconsistencies** that would make an autonomous agent stall or mis-route, and **missing skills** for things the real project demonstrably does (Allure, NTLM/CRM, cross-system tests, multi-client configuration).

---

## A. Issues found and FIXED in this upgrade

| # | Issue | Where | Fix applied |
|---|-------|-------|-------------|
| A1 | Broken references to a non-existent `playwright-generator.md` (skill was renamed to Automation Implementation Agent but references weren't updated) | 08, 12, others | All references now point to `13-automation-implementation-agent.md` |
| A2 | Filename typo `06-requirment-quality-checker.md` while every cross-reference uses "requirements" | file name | Renamed to `06-requirements-quality-checker.md` |
| A3 | Contradictory stage numbers in headers: 04 called itself "Pipeline Step 2", 05 also "Step 2", 06 "Step 4", 09 "Step 3" — none matching the master pipeline order | 04, 05, 06, 09 | Headers corrected to the true stage positions |
| A4 | Approval keyword mismatch: 04-intent-preview requires `APPROVE_DETECTION`, but the master workflow's approval gate section only listed intent approvals — an agent following the master doc would never issue the detection approval and the pipeline would deadlock | 00 vs 04 | Master workflow now defines both gates: Gate 1 `APPROVE_DETECTION`, Gate 2 `APPROVE_INTENTS`/`NORMALIZE`/`RUN_NORMALIZER` |
| A5 | No stage↔file mapping: stage numbers (01–17) don't equal file numbers (00–18), e.g. Stage 11 = TC Generator = file 12 | 00 | Mapping table appended to master workflow |
| A6 | Artifact naming mismatch: skills promise `docs/analysis/system-map.md` but real artifacts are module-prefixed (`accounts-management-system-map.md`) | 00, 02 vs reality | Naming convention section added to master workflow (module-prefixed kebab-case; shared `locator-repository.json` unprefixed) |
| A7 | Windows-style path `docs\test-design\test-lifecycle.md` in one skill vs POSIX everywhere else | 09 | Normalized to POSIX |

## B. Gaps found and FILLED with new skills

| # | Gap (verified: zero mentions across all 19 files) | New skill |
|---|---|---|
| B1 | No NTLM / Windows auth guidance at all, despite D365 on-prem being a primary target; no storage-state/session-reuse strategy; no session-expiry protocol | **19-authentication-session-manager.md** |
| B2 | No cross-system test pattern (Portal action → CRM validation): no tab/context rules, no data-correlation rules, no propagation-delay handling, no per-system failure classification | **20-cross-system-orchestration.md** |
| B3 | No Allure standard, despite every real page object using `allure.step` and every spec using feature/story/severity — generated tests had no enforced metadata contract for the Final Report Agent to consume | **21-allure-reporting-standard.md** |
| B4 | No multi-project configuration model (SAIB/ABK/HDB...): no env-file convention, no per-project artifact isolation, no production-URL guard, no air-gapped flag | **22-multi-project-configuration.md** |
| B5 | No master onboarding document for other AI models | **docs/GUIDELINES.md** |

## C. Remaining recommendations (not applied — need your decision)

| # | Recommendation | Why deferred |
|---|----------------|--------------|
| C1 | 02-System Walkthrough promises 10 outputs, but 3 (`ui-behavior-inventory.md`, `workflow-observations.md`, `automation-readiness-report.md`) have never been produced in `docs/analysis/`. Either produce them on the next walkthrough run or trim the contract to the 7 real outputs. | Choice depends on whether you want the richer contract |
| C2 | Two duplicate/legacy locator files exist: `docs/test-design/locator-inventory.md` (283 bytes, near-empty) and `docs/test-design/locator-repository.md` (770 bytes) overlapping `docs/analysis/` versions. Consolidate to the `docs/analysis/` versions and delete the stubs. | Deleting files needs your confirmation |
| C3 | Migrate existing artifacts into the per-project layout `docs/projects/saib/...` per skill 22, since ABK/HDB work will otherwise collide in shared folders. | Bulk move — should be a deliberate migration |
| C4 | The master workflow's Execution Readiness Gate (12.5) and Recovery Decision Gate (14.5) have no corresponding skill files; their logic lives only in the master doc. Consider extracting them into small dedicated skills for symmetry. | Optional structural refactor |
| C5 | `locator-repository.json` carries both legacy (`primaryLocator` string) and new (`primary` object) shapes per entry. Pick one schema and version-bump to 2.0.0. | Requires updating whatever code reads it |

---

## Verdict

With fixes A1–A7 the pipeline is now internally consistent end-to-end (an agent can route from detection to sign-off without hitting a dead reference or a deadlocked gate). With skills 19–22 and GUIDELINES.md the framework now covers the real-world patterns your projects actually use: NTLM CRM, cross-system validation, Allure, and multi-client switching.
