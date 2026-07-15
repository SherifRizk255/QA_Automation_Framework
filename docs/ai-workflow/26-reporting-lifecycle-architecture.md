# 26 - Reporting Lifecycle Architecture Standard

> Governance standard. Not a pipeline stage.
>
> Applies To:
>
> * Execution Agent
> * Playwright Reporters
> * Allure Reporters
> * Failure Analysis Agent
> * Self-Healing Agent
> * Traceability Agent
> * Walkthrough Agent
> * Release Reporting
> * Trend Analysis
> * Archive Management
>
> Purpose:
>
> Establish a single reporting architecture for the entire framework, ensuring all execution artifacts, evidence, AI analysis, trends, release deliverables, and archives are stored consistently, remain traceable, and can be accessed from one centralized location.


---

# PURPOSE

The Reporting Lifecycle Architecture defines:

* Where every report and execution artifact is stored.
* Ownership of reporting locations.
* Execution report lifecycle.
* Historical report retention.
* Trend analysis storage.
* Release deliverable storage.
* Archival and cleanup strategy.
* Rules preventing report sprawl and duplicate report locations.

This standard ensures:

* Single source of truth.
* Consistent report generation.
* Centralized navigation.
* Historical traceability.
* Long-term maintainability.

---

# SCOPE

This standard governs only execution reporting and report lifecycle management.

It does not define:

* Playwright reporter implementation
* Allure reporter implementation
* HTML report rendering
* Trend calculation algorithms
* Archive compression implementation
* AI analysis logic

Those behaviors are defined by their respective implementation standards.

This document defines where artifacts belong, who owns them, and how they move through the reporting lifecycle.

---

# DESIGN PRINCIPLES

## 1. Single Source of Truth

Every artifact must exist in exactly one canonical location.

Forbidden:

```text
playwright-report/
reports/playwright/
reports/latest/playwright/
```

Allowed:

```text
reports/history/<execution-id>/playwright/
```

The `latest` location must only reference the most recent execution.

---

## 2. Execution-Centric Architecture

The framework is organized around **executions**, not reporting technologies.

Playwright, Allure, AI analysis, evidence, and logs are artifacts belonging to a single execution.

They SHALL NOT exist as independent top-level report directories.

---

## 3. Immutable Execution History

Once an execution completes:

```text
reports/history/<execution-id>/
```

becomes immutable.

No agent may modify execution artifacts after execution finalization.

Corrections must generate a new execution

---

## 4. Latest is a Pointer

```text
reports/latest
```

is not an execution.

It is only a convenience pointer to the most recent execution.

Implementation may use:

* Symbolic link
* Junction
* Redirect
* Alias

depending on platform capabilities.

No unique data may exist under `latest`.

**Clarification — "successful finalization":** `latest` updates whenever an execution reaches a **completed** state, regardless of pass/fail outcome. "Successful" refers to the execution *process* finishing cleanly (all agents wrote their artifacts, `metadata.json` was written), not to the test results themselves. A run with failing tests still becomes `latest`. Only a *crashed or aborted* execution (one that never finalizes `metadata.json`) is excluded from updating the pointer.

---

## 5. Reports and Knowledge Are Separate

Reports answer:

> What happened?

Knowledge answers:

> What have we learned?

Knowledge artifacts must not be stored under:

```text
reports/
```

Knowledge assets belong under:

```text
docs/knowledge/
```

Examples:

* Locator evaluations
* NTLM investigations
* Walkthrough discoveries
* CRM validation libraries
* Engineering playbooks

---


## 6. Centralized Path Resolution

No component may hardcode report paths.

Forbidden:

```ts
"reports/"
"playwright-report/"
"allure-results/"
```

All report locations must be resolved through:

```ts
REPORT_PATHS
```

and

```ts
ExecutionManager
```

### REPORT_PATHS Contract

This is the minimal shape every consumer must import rather than reconstruct. No component may build these strings manually.

```ts
export const REPORT_PATHS = {
  root: 'reports',
  latest: 'reports/latest',
  history: (executionId: string) => `reports/history/${executionId}`,
  historyIndex: 'reports/history/index.json',
  trends: 'reports/trends',
  release: 'reports/release',
  archives: 'reports/archives',
} as const;
```

### ExecutionManager Contract

Minimal public interface. Internal implementation is free to vary; these methods must exist and behave as described.

```ts
interface ExecutionManager {
  /** Creates a new execution folder and registers it as in-progress. Returns the execution ID. */
  createExecution(): string;

  /** Writes metadata.json, marks the execution immutable, appends to history/index.json,
   *  and repoints `latest` if the execution reached a completed state (see Principle 3 clarification). */
  finalizeExecution(executionId: string, result: ExecutionResult): void;

  /** Returns the execution ID that `latest` currently points to. */
  getLatestId(): string;

  /** Returns true if the execution folder is finalized (and therefore immutable). */
  isFinalized(executionId: string): boolean;
}
```

### Execution ID Format

Pinned format, so ID generation is identical across every agent and session:

```text
<UTC timestamp: YYYY-MM-DD_HH-mm-ss>__<short git SHA, 7 chars>
```

Example:

```text
2026-07-13_14-20-35__a1b2c3d
```

Rationale: timestamp alone risks collisions on parallel CI runs; the short SHA disambiguates and ties the execution directly to the code state that produced it. If git context is unavailable (local ad-hoc run), fall back to `__local` as the suffix — never omit the suffix entirely, so the format stays parseable.

---

## 7.  Single Folder Ownership

Every reporting folder must have exactly one owner.

No folder may be shared between multiple agents without an explicit ownership contract.

---

# APPROVED DIRECTORY STRUCTURE

```text
reports/
│
├── latest -> history/<execution-id>/
│
├── history/
│   ├── <execution-id>/
│   │   ├── metadata.json
│   │   ├── summary/
│   │   ├── playwright/
│   │   ├── allure/
│   │   ├── evidence/
│   │   │   ├── screenshots/
│   │   │   ├── videos/
│   │   │   ├── traces/
│   │   │   ├── downloads/
│   │   │   └── attachments/
│   │   ├── ai/
│   │   │   ├── walkthrough/
│   │   │   ├── locator-discovery/
│   │   │   ├── automation/
│   │   │   ├── execution/
│   │   │   ├── failure-analysis/
│   │   │   ├── self-healing/
│   │   │   ├── traceability/
│   │   │   └── recommendations/
│   │   └── logs/
│   └── ...
│
├── trends/
│   ├── flakiness/
│   ├── duration/
│   ├── healing/
│   ├── tc-history/
│   └── environment/
│
├── release/
│   ├── release-readiness.md
│   ├── coverage-summary.md
│   └── qa-signoff.md
│
└── archives/
```

## File Naming Convention

Generated artifacts SHALL use consistent names.

Examples

```text
metadata.json

summary/

    summary.html

    summary.json

    summary.md

logs/

    framework.log

    execution.log

playwright/

    index.html

allure/

    index.html
```

Component-specific filenames should remain stable across executions to simplify tooling and automation.

---

# ARTIFACT RESPONSIBILITIES

## metadata.json

Stores execution metadata.

Examples:

* Execution ID
* Project
* Environment
* Git Branch
* Git Commit
* Framework Version
* Execution Start Time
* Execution End Time
* Duration
* Execution Result Summary

---

## history/

Contains complete execution snapshots.

Each execution directory SHALL contain every artifact produced during that execution.

Execution directories SHALL be self-contained and independently portable.

---

## latest/

Provides quick access to the most recent execution.

No component may write directly into

```text
reports/latest
```

---

## summary/

Framework-generated execution summaries.

Examples:

* HTML summary
* JSON summary
* Markdown summary
* KPI reports

This folder serves as the primary entry point for execution reporting.

---

## playwright/

Contains Playwright-generated reports.

Examples:

* HTML report
* Playwright assets
* Playwright report data

---

## allure/

Contains Allure-generated artifacts.

Examples:

* Allure report
* Allure results
* Allure history

---

## evidence/

Contains execution evidence.

### screenshots/

Failure screenshots.

### videos/

Execution recordings.

### traces/

Playwright trace files.

### downloads/

Files downloaded during execution.

### attachments/

Additional evidence.

Examples:

* HAR files
* API responses
* PDFs
* CSV exports
* JSON payloads

---

## ai/

Contains AI-generated execution artifacts.

Examples

* Walkthrough reports
* Locator discovery
* Automation analysis
* Failure analysis
* Self-healing reports
* Traceability
* Recommendations

AI reports SHALL represent execution-specific analysis only.

Long-term engineering documentation SHALL NOT be stored here.

---

## logs/

Contains execution logs.

Examples

* framework.log
* execution.log
* playwright.log
* auth.log
* healing.log

---

## HISTORY INDEX

`reports/history/index.json` is the single manifest of every execution. It exists so trend analysis, dashboards, and agents can answer cross-execution questions without scanning every `history/<execution-id>/metadata.json` on disk.

* `ExecutionManager.finalizeExecution()` is the only writer — it appends one entry per execution.
* The index is append-only. Entries for immutable executions are never edited or removed except by Archive Manager, which updates an entry's `archived: true` flag when a run is moved to `archives/` (see Retention Policy).
* Entry shape:

```json
{
  "executionId": "2026-07-13_14-20-35__a1b2c3d",
  "project": "SaibUAT",
  "branch": "main",
  "commit": "a1b2c3d",
  "startedAt": "2026-07-13T14:20:35Z",
  "durationSec": 842,
  "result": { "passed": 41, "failed": 3, "skipped": 2 },
  "archived": false
}
```

Trend Analyzer reads this index rather than the filesystem directly. At larger scale (thousands of entries) it may be rotated into per-month index files; that decision is deferred until volume warrants it.

---

# REPORT RELATIONSHIPS

Execution artifacts are independent but related.

```text
Execution
│
├── metadata.json
│
├── summary/
│
├── playwright/
│
├── allure/
│
├── evidence/
│
└── ai/
      ├── failure-analysis/
      ├── self-healing/
      └── traceability/
```

Rules

* AI reports may reference Playwright reports.
* AI reports may reference execution evidence.
* AI reports may reference execution metadata.
* AI reports SHALL NOT duplicate Playwright or Allure reports.
* Summary reports aggregate execution information without duplicating raw evidence.

---

# TRENDS

Purpose:

Cross-execution analytics and historical insights.

Structure:

```text
reports/trends/
│
├── flakiness/
│
├── duration/
│
├── healing/
│
├── environment/
│
└── tc-history/
```

Examples:

* Flaky test identification
* Execution duration trends
* Healing success rate
* Environment stability analysis
* Historical test execution tracking

Trend data may aggregate information from multiple executions, read via `reports/history/index.json`.

Trend data must never modify historical executions.


---

## release/

Purpose:

Store release-level QA deliverables.

Structure:

```text
reports/release/
```

Examples:

* QA Signoff
* Coverage Summary
* Release Readiness Assessment
* Business Value Reports

Release deliverables may reference multiple executions.

---

## archives/

Purpose:

Long-term storage of historical executions.

Structure:

```text
reports/archives/
```

Examples:

```text
2026-07/
2026-08/
```

Archive formats:

* zip
* tar.gz
* organization-approved archive formats

### Tiered Archival

Not all execution content ages the same way. When an execution is archived:

* `evidence/` (screenshots, videos, traces, downloads, attachments) — compressed aggressively as part of the archive. This is the storage-heavy content and has little value once an execution is old.
* `metadata.json` and `summary/` — remain queryable outside the archive for the full Trend Retention period (see below), since they are small and are what trend/history queries actually read. Archive Manager copies these into `reports/history/index.json` context before compressing the rest, so a query never needs to decompress an archive just to know a run's pass/fail counts.

---

# OWNERSHIP MODEL

| Component               | Owns                  |
| ----------------------- | --------------------- |
| Execution Manager       | Execution Lifecycle, `history/index.json`  |
| Framework Reporter      | `summary/`            |
| Playwright Reporter     | `playwright`          |
| Allure Reporter         | `allure`              |
| Playwright              | `evidence`            |
| AI Walkthrough Agent    | `ai/walkthrough`      |
| Locator Discovery Agent | `ai/locator-discovery`|
| Automation Agent        | `ai/automation`       |
| Execution Agent         | `ai/execution`        |
| Failure Analysis Agent  | `ai/failure-analysis` |
| Self-Healing Agent      | `ai/self-healing`     |
| Traceability Manager    | `ai/traceability`     |
| Trend Analyzer          | `trends`              |
| Release Generator       | `release`             |
| Archive Manager         | `archives`, archive flag in `history/index.json` |
| Framework Logging       | `logs`                |

No directory shall have multiple owners.

### Parent Directory Ownership

Execution Manager exclusively owns the execution directory structure.

Only Execution Manager may create:

```text
reports/history/<execution-id>/

reports/latest

reports/history/index.json
```

Child components may create and modify content only inside their assigned directories.

Example

```text
Execution Manager
    creates

history/<execution-id>/playwright/

Playwright Reporter
    writes files inside

playwright/
```

No component may create another component's directory.

---

# EXECUTION LIFECYCLE

Execution lifecycle must follow:

```text
Execution Start

↓

Execution Manager Creates Execution Folder

↓

Agents Generate Execution Artifacts (Active Writing Phase)

↓

Execution Completes

↓

metadata.json Finalized

↓

history/index.json Entry Appended

↓

latest Updated (if execution reached completed state — see Principle 3)

↓

Trend Analyzer Executes

↓

Archive Retention Check Executes
```

No component may bypass this lifecycle.

### Active Writing Phase

During execution, reporting components may freely generate and update artifacts inside their owned directories.

Once execution enters the **FINALIZING** state, all execution artifacts become read-only.

Any post-processing must generate new derived artifacts rather than modifying execution outputs.

---

# EXECUTION STATUS MODEL

Every execution SHALL transition through the following states.

```text
CREATED

↓

RUNNING

↓

FINALIZING

↓

COMPLETED

↓

ARCHIVED
```

## CREATED

The Execution Manager has generated a new execution ID and created the execution directory.

No reporting components have written artifacts yet.

---

## RUNNING

Agents generate execution artifacts.

Execution artifacts remain mutable.

Components may only modify files inside their owned directories.

---

## FINALIZING

Execution has finished.

The Execution Manager:

* Writes `metadata.json`
* Generates execution summary
* Appends to `history/index.json`
* Marks execution immutable

No additional execution artifacts may be generated after finalization begins.

---

## COMPLETED

Execution is finalized.

Historical artifacts become read-only.

Trend Analyzer and Release Generator may read the execution but SHALL NOT modify it.

---

## ARCHIVED

Execution has been moved to long-term storage.

Only Archive Manager may transition an execution into this state.

---

# RETENTION POLICY

Recommended defaults:

```text
History Retention (full, uncompressed):
30 Days

Archive Retention (evidence, compressed):
6 Months

metadata.json / summary/ Retention (post-archive, queryable):
Unlimited

Trend Retention:
Unlimited

Release Deliverables:
Unlimited
```

Organizations may override retention requirements.

---

# METADATA

Every execution SHALL include

```text
metadata.json
```

Minimum fields

* executionId
* project
* target environment
* execution start
* execution end
* duration
* git branch
* git commit
* framework version
* Playwright version
* total tests
* passed
* failed
* skipped
* healed
* report architecture version

    Example

    ```json
    {
       "reportArchitectureVersion": "1.0"
    }
    ```

     This allows future reporting architecture revisions while preserving compatibility with historical executions.

---

# IMPLEMENTATION RULES

Mandatory:

* Use REPORT_PATHS for all path resolution.
* Use ExecutionManager for execution folder management.
* Store every execution under history.
* Keep historical executions immutable.
* Update latest only after execution finalization reaches a completed state (pass or fail — see Principle 3).
* Append every finalized execution to `history/index.json`.
* Preserve traceability between reports and execution metadata.

Forbidden:

* Hardcoded report paths.
* Duplicate report locations.
* Writing execution artifacts outside execution folders.
* Modifying historical executions.
* Storing knowledge assets under reports.
* Trend Analyzer or any agent scanning `history/` directly instead of reading `history/index.json`.
* Moving artifacts between executions.
* Renaming execution directories.
* Writing directly into `reports/latest`.
* Deleting another component's artifacts.
* Regenerating historical reports in place.
* Creating top-level reporting directories outside this standard.
* Writing reports using hardcoded filesystem paths.

---

# COMPLIANCE REQUIREMENTS

Any new reporting capability introduced into the framework must:

1. Declare ownership.
2. Define storage location.
3. Follow execution lifecycle rules.
4. Use centralized path management.
5. Preserve execution traceability.

New reporting technologies (for example ReportPortal, Grafana exports, Elastic Stack, Power BI, or future AI dashboards) SHALL integrate into the existing execution structure.

New technologies SHALL NOT introduce additional top-level directories under `reports/`.

Technology-specific artifacts must remain execution-scoped.

Non-compliant reporting implementations must not be merged into the framework.

---

# APPENDIX A — LEGACY PATH MIGRATION MAP

This section exists so migration prompts produce identical categorization across sessions, rather than each Codex invocation re-deriving where an old file belongs.

| Legacy Path (flat, pre-standard) | New Canonical Location |
| --- | --- |
| `playwright-report/` | `reports/history/<execution-id>/playwright/` |
| `allure-report/`, `allure-results/` | `reports/history/<execution-id>/allure/` |
| `cubic-report/` (+ `history/run-*.html`) | `reports/history/<execution-id>/summary/` (one execution per historical run file) |
| `saib-*-failure.png`, `ib-*-failure.png`, `am-tc-*-failure.png`, `tc-portal-*-failure.png` | `reports/history/<execution-id>/evidence/screenshots/` |
| `*-trace/` (e.g. `tc-crm-003-trace/`) | `reports/history/<execution-id>/evidence/traces/` |
| `transfer/*.png`, `travel-notice-discovery/*.png`, `system-walkthrough/**` | `reports/history/<execution-id>/ai/walkthrough/` (or `docs/knowledge/walkthroughs/` if the walkthrough is reused across executions rather than tied to one run) |
| `*-locator-discovery.md`, `*-locator-evaluation.md`, `*-locator-implementation.md`, `*-locator-repository-update.md` | `docs/knowledge/locators/` |
| `ntlm-audit.md`, `ntlm-fix.md`, `crm-protocol-investigation.md` | `docs/knowledge/ntlm/` |
| `crm-validation-library.md`, `crm-validation-library-rollback.md`, `crm-workflow-validator.md` | `docs/knowledge/crm-validation-library/` |
| `self-healing-log.md`, `self-healing-candidates.md`, `healing-regression-results.md`, `*-self-healing.md` | `reports/history/<execution-id>/ai/self-healing/` if tied to one run, else `docs/knowledge/self-healing-playbook.md` if it's a reusable strategy doc |
| `*-failure-analysis.md`, `defect-summary.md`, `defect-candidates.md` | `reports/history/<execution-id>/ai/failure-analysis/` |
| `execution-summary.md`, `execution-metadata.md`, `execution-raw-results.md`, `execution-blockers.md`, `lifecycle-execution-report.md` | `reports/history/<execution-id>/summary/` |
| `qa-signoff.md`, `release-readiness.md`, `coverage-summary.md`, `business-value-extraction.md` | `reports/release/` |
| `repository-usage-report.md`, `repository-validation-report.md` | `docs/knowledge/` (framework usage docs, not execution output) |
| `crm-startup-investigation.md`, `crm-startup-timeline.md` | `docs/knowledge/crm-startup/` |
| `crm-navigation-comparison.md`, `crm-navigation-lifecycle-analysis.md` | `docs/knowledge/crm-navigation/` (unless tied to a specific failed run, then `ai/traceability/`) |

**Rule of thumb for anything not listed above:** if the file would be regenerated identically by re-running the same test suite, it belongs under `reports/history/<execution-id>/`. If it would still be true and useful with no test execution having happened at all, it belongs under `docs/knowledge/`. If it's meant to be read by someone outside the automation team to make a decision, it belongs under `reports/release/`.

