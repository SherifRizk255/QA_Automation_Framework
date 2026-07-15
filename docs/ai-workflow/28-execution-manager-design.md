# EXECUTION STATE MACHINE

Every execution managed by the framework SHALL transition through a predefined lifecycle.

The Execution Manager is the only component permitted to change execution state.

```text
                +---------+
                | CREATED |
                +---------+
                     │
                     ▼
               +-----------+
               | RUNNING   |
               +-----------+
                     │
                     ▼
             +---------------+
             | FINALIZING    |
             +---------------+
                     │
         ┌───────────┴────────────┐
         ▼                        ▼
 +---------------+         +---------------+
 | COMPLETED     |         | ABORTED       |
 +---------------+         +---------------+
         │
         ▼
 +---------------+
 | ARCHIVED      |
 +---------------+
```

---

## CREATED

The execution has been initialized.

Execution Manager responsibilities:

* Generate execution ID.
* Create execution directory structure.
* Create initial execution context.
* Initialize execution metadata.

No reporting component has written artifacts.

---

## RUNNING

Execution is in progress.

Reporting components may:

* Generate reports.
* Write evidence.
* Update execution artifacts.
* Append execution logs.

Components may modify only their owned directories.

---

## FINALIZING

Execution has completed.

Execution Manager performs finalization.

Responsibilities:

* Finalize metadata.json.
* Generate execution summary.
* Register execution inside history/index.json.
* Update latest pointer.
* Mark execution immutable.

No additional execution artifacts may be generated once finalization begins.

---

## COMPLETED

Execution has been successfully finalized.

Execution artifacts become read-only.

Components may read artifacts but SHALL NOT modify them.

Trend Analyzer and Release Generator operate on completed executions.

---

## ABORTED

Execution terminated unexpectedly.

Examples:

* Framework crash
* CI cancellation
* Manual interruption
* Unhandled exception

The Execution Manager records the aborted execution.

The latest pointer SHALL NOT reference an aborted execution.

---

## ARCHIVED

Execution has been moved to long-term storage.

Only Archive Manager may archive executions.

Archived executions remain immutable.

---

# EXECUTION CONTEXT

Execution Context is the runtime object shared by every framework component.

Rather than passing individual variables such as execution ID, report paths,
project name, or environment, components receive one immutable execution
context.

This guarantees every component operates on identical execution information.

---

## Responsibilities

Execution Context provides:

* execution identity;
* execution status;
* project information;
* environment information;
* report locations;
* execution timestamps.

Execution Context SHALL be created only once during execution initialization.

---

## Contract

```ts
interface ExecutionContext {

    executionId: string;

    status:
        | "CREATED"
        | "RUNNING"
        | "FINALIZING"
        | "COMPLETED"
        | "ABORTED"
        | "ARCHIVED";

    project: string;

    targetEnvironment: string;

    startedAt: Date;

    reportRoot: string;

    paths: ExecutionPaths;

}
```

Execution Context SHALL be treated as the authoritative execution object
throughout the framework.

No component may construct its own execution context.

---

# EXECUTION PATHS

Execution Paths provide every canonical location used during execution.

Components SHALL obtain paths from the Execution Manager.

Filesystem paths SHALL NEVER be manually constructed.

---

## Responsibilities

Execution Paths define:

* execution root;
* summary location;
* Playwright report location;
* Allure report location;
* evidence locations;
* AI report locations;
* log locations.

---

## Contract

```ts
interface ExecutionPaths {

    root: string;

    metadata: string;

    summary: string;

    playwright: string;

    allure: string;

    logs: string;

    evidence: {

        root: string;

        screenshots: string;

        videos: string;

        traces: string;

        downloads: string;

        attachments: string;

    };

    ai: {

        root: string;

        walkthrough: string;

        locatorDiscovery: string;

        automation: string;

        execution: string;

        failureAnalysis: string;

        selfHealing: string;

        traceability: string;

        recommendations: string;

    };

}
```

Every path returned by Execution Paths SHALL reside inside the current execution
directory.

---

## Example

```text
reports/
└── history/
    └── 2026-07-13_14-20-35__a1b2c3d/
        ├── metadata.json
        ├── summary/
        ├── playwright/
        ├── allure/
        ├── evidence/
        ├── ai/
        └── logs/
```

Components reference these locations through Execution Context rather than
building filesystem paths manually.

---

# PUBLIC API CONTRACT

Execution Manager exposes a single public interface used by every reporting
component.

No component may bypass this interface.

---

## Public Methods

```ts
interface ExecutionManager {

    /**
     * Creates a new execution.
     * Generates execution ID.
     * Creates execution directory.
     * Initializes metadata.
     * Returns execution context.
     */
    createExecution(): ExecutionContext;

    /**
     * Returns the active execution.
     */
    getCurrentExecution(): ExecutionContext;

    /**
     * Returns execution paths.
     */
    getExecutionPaths(): ExecutionPaths;

    /**
     * Finalizes execution.
     */
    finalizeExecution(result: ExecutionResult): void;

    /**
     * Marks execution as aborted.
     */
    abortExecution(reason: string): void;

    /**
     * Returns whether execution has been finalized.
     */
    isFinalized(): boolean;

    /**
     * Returns latest completed execution.
     */
    getLatestExecution(): string;

}
```

---

# API BEHAVIOR

## createExecution()

Creates a completely new execution.

Responsibilities:

* Generate execution ID.
* Create execution directory tree.
* Create Execution Context.
* Initialize metadata.
* Return Execution Context.

---

## getCurrentExecution()

Returns the active execution context.

No new objects are created.

---

## getExecutionPaths()

Returns the canonical execution paths.

This method SHALL always return paths belonging to the active execution.

---

## finalizeExecution()

Finalizes the execution.

Responsibilities:

* Update execution status.
* Finalize metadata.
* Generate summary.
* Update history/index.json.
* Update latest pointer.
* Lock execution.

---

## abortExecution()

Terminates execution.

Responsibilities:

* Update execution status.
* Persist failure reason.
* Preserve generated artifacts.
* Prevent latest pointer update.

---

## isFinalized()

Returns whether the execution has entered a terminal state.

Terminal states:

* COMPLETED
* ABORTED
* ARCHIVED

---

## getLatestExecution()

Returns the execution ID currently referenced by reports/latest.

This method is intended for dashboards, trend analysis, and release reporting.

---

# COMPONENT INTERACTION

Every reporting component follows the same interaction pattern.

```text
Framework Starts
        │
        ▼
ExecutionManager.createExecution()
        │
        ▼
ExecutionContext
        │
        ├───────────────┐
        │               │
        ▼               ▼
Playwright         Allure
        │               │
        ├───────────────┤
        ▼               ▼
AI Agents      Framework Reporter
        │
        ▼
ExecutionManager.finalizeExecution()
        │
        ▼
Execution Snapshot Stored
```

The Execution Manager acts as the single coordination layer for execution reporting.

Reporting components never communicate with each other to determine report locations or execution state. They communicate only through the Execution Manager.
