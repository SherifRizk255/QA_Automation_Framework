# Reusable UI Component Governance

The reusable component layer sits between feature page objects and Playwright locators:

```text
Tests
  ↓
Feature Page Objects
  ↓
Reusable Portal Components
  ↓
Playwright Locators / Locator Repository
```

## Dependency direction and feature facade

Tests call feature page-object methods. They must not import, instantiate, or directly consume reusable components.

Feature page objects own feature navigation, business rules, workflow orchestration, feature assertions, evidence capture, and page-state transitions. They may delegate reusable widget mechanics to cataloged components.

Short facade methods remain valid when they provide business naming, stable API compatibility, feature sequencing, or evidence capture.

## Component eligibility

A component belongs in the shared layer when:

- Its DOM structure is reusable.
- Its interactions are reusable.
- It is not tied to one feature's business rules.
- It is already reused or has strong evidence of reuse.

A component remains feature-specific when:

- It encodes one feature's business rules.
- Its selectors exist only in one flow.
- Reuse requires feature flags or many conditional branches.
- Its behavior differs significantly by feature.

Before reuse or extraction, verify equivalent DOM roots, child structure, roles and accessible names, interaction behavior, state transitions, visible and hidden behavior, and loading behavior. Screenshots alone do not prove equivalence. When evidence is insufficient, defer extraction and do not add feature flags to force reuse.

## Required workflow

Before creating a new page-object locator or interaction:

1. Search the component catalog.
2. Reuse an existing component when its DOM and behavior are equivalent.
3. Extend an existing component only when the extension remains generic.
4. Create a new component only when no existing component satisfies the need.
5. Register the component in the catalog before using it in a feature page.

## Component responsibilities

Components may own:

- Their root locator.
- Stable child locators.
- Reusable interactions.
- Normalized component values.
- Reusable component-level assertions.

Components must not own:

- Complete business workflows.
- Cross-feature business decisions.
- Test data.
- Feature navigation.
- Unrelated page locators.
- Test-specific assertions.

## Collection and item components

Collection components own:

- Opening the collection.
- Count and ordering.
- Bounded indexed item access.
- Generic collection validation.

Item components own:

- Item fields.
- Item text.
- Item actions.
- Item-level validation.

The feature page decides which item satisfies a business rule. A collection component may use `rows.nth(index)` for bounded iteration through its owned collection; positional selection must not be used to guess a business item.

Every component root and stable child locator definition must be registered in `docs/analysis/locator-repository.json`. Components own their scoped mechanics and consume those definitions by repository key; raw Playwright locator definitions are permitted only during temporary discovery and must not remain in committed component code.

## Optional and required values

Optional discovery supports candidate scanning:

```ts
findAccountNumber(): Promise<string | undefined>
```

It returns `undefined` when the field is absent, hidden, or empty so the feature page can evaluate later candidates.

Required access supports mandatory validation:

```ts
getAccountNumber(): Promise<string>
```

It fails clearly when the field is absent, hidden, or empty. Do not use `try/catch` to turn required-reader failures into ordinary candidate-selection control flow.

## Scoped roots and DOM equivalence

Components locate child elements beneath their supplied root. They must not search globally from `page` when the component root provides the correct scope.

Visually similar elements must not be assumed to share DOM. Confirmed example:

```text
Selected From-account display
  → account-selector-number
  → account-selector-meta

Picker account row
  → account-card-number
  → account-card-meta
```

The selected display remains feature-page-owned. Picker rows remain `AccountRowComponent`-owned. DOM and behavior equivalence must be proven before one component is used for both.

## Locator ownership and healing

The Locator Repository is the mandatory definition owner for every committed locator. The narrowest page or component remains the behavioral consumer and resolves the registered key within its owned scope.

A locator definition and its runtime behavior have separate owners:

- Every committed definition and fallback history → Locator Repository.
- Shared widget behavior and scope → reusable component consuming a repository key.
- Feature-specific or selected-display behavior and scope → feature page object consuming a repository key.
- Test specification → never owns a locator.

Self-healing updates the repository definition while preserving the owning behavioral consumer. It must not bypass an existing component or duplicate a locator in a feature page or specification. Optional and required reader semantics must remain unchanged.

For a locator change, self-healing updates the repository entry and preserves the consumer key. It must never insert a competing raw selector into a page object or component.

## Lifecycle

```text
experimental → active → deprecated → retired
```

- `experimental`: The component is being evaluated and its API may change.
- `active`: The component is approved for reuse.
- `deprecated`: The component remains available temporarily while callers migrate.
- `retired`: The component must no longer be used by active feature pages.

## Naming

Component files use:

```text
<ComponentName>Component.ts
```

Examples:

```text
AccountRowComponent.ts
AccountPickerComponent.ts
PortalLoadingComponent.ts
```

Avoid feature prefixes for genuinely shared components.

## Runtime safety

Instantiate live component objects per active Playwright `Page`. Do not create global singleton component instances because they can retain:

- Closed pages.
- Stale locators.
- State from another test.
- Incorrect browser contexts.

The component catalog stores metadata only. It must not store Playwright `Page` objects, locators, component instances, or dynamic factories.

## Catalog metadata

`usedBy` lists direct consumers only. A direct consumer may be another component or a feature page; transitive consumers are not listed.

`responsibilities` describes reusable mechanics rather than feature business rules.

The catalog remains metadata-only and never acts as a runtime registry or dependency-injection container.
