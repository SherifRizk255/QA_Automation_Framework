# Intent Unit Schema — The Core Contract

> Every skill in this system reads from and writes to Intent Units.
> This file defines the canonical structure. Never deviate from it.

---

## What is an Intent Unit?

An Intent Unit (IU) is the smallest independently testable behavior extracted from any input artifact.

It is the universal intermediate representation that decouples input format from test generation.
The normalizer produces IUs. Every downstream skill consumes IUs.

---

## Intent Unit Structure

```
IU-[ID]
──────────────────────────────────────────
actor        : who performs the action (user role, system, API, scheduler)
action       : what the actor does
condition    : under what circumstances (optional but preferred)
outcome      : what the system should do or return
source       : [section/line/column reference in the original artifact]
source_type  : BRD | FRD | CR | UserStory | FeatureList | SDD | SmokeSheet | FreeText | Visual
domain_rules : [extracted constraints — limits, validations, eligibility rules, states]
risk         : P1 | P2 | P3 | P4
automate     : Yes | No | Partial
notes        : [ambiguities, assumptions, what cannot be determined]
──────────────────────────────────────────
```

---

## Risk Classification Rules

Apply the highest applicable level:

| Level | Apply when |
|---|---|
| P1 Critical | Authentication · authorization · payments · data loss · compliance · security · SLA-bound |
| P2 High | Core user journeys · key validations · primary integrations · state transitions |
| P3 Medium | Secondary flows · edge cases · admin/config functions · reporting |
| P4 Low | Cosmetic · informational · rarely-used paths · help content |

---

## Automate Flag Rules

| Value | Meaning |
|---|---|
| Yes | Stable, repeatable, deterministic — automate first |
| No | Exploratory, judgment-dependent, one-time, or requires visual human verification |
| Partial | Core assertion automatable; some steps require manual verification |

---

## Examples

```
IU-001
actor        : authenticated user with transfer permission
action       : submits a fund transfer within the daily limit
condition    : account has sufficient balance, beneficiary is pre-registered
outcome      : transaction is processed, reference number returned, balance updated
source       : BRD Section 4.2 — Fund Transfer, AC-3
source_type  : BRD
domain_rules : daily limit = [value from BRD]; STP eligibility applies; posting restricted 10pm–6am
risk         : P1
automate     : Yes
notes        : limit value not specified in BRD — flagged as ❓ AMBIGUOUS

IU-002
actor        : unauthenticated user
action       : attempts to access the transfers page directly via URL
condition    : no active session
outcome      : system redirects to login page, no data exposed
source       : BRD Section 3.1 — Auth Policy
source_type  : BRD
domain_rules : session must be validated before any protected route is served
risk         : P1
automate     : Yes
notes        : none

IU-003
actor        : system
action       : processes a change request to add a new validation rule to the payment form
condition    : CR-042 delta — new rule: amount must be a multiple of 100
outcome      : form rejects non-multiples, shows inline validation message
source       : CR-042, Section 2 — Changed Behavior
source_type  : CR
domain_rules : existing IU-018 (amount field) is now outdated — retire TC-031, TC-032
risk         : P2
automate     : Yes
notes        : regression scope includes IU-018, IU-019 (related payment flow)
```

---

## IU List Output Format

When producing the IU list in any skill, always output as:

```
📋 INTENT UNIT MAP
──────────────────────────────────────────────────────
IU-001 | [actor] [action] [condition] | Risk: P1 | Source: [ref]
IU-002 | [actor] [action] [condition] | Risk: P2 | Source: [ref]
...
──────────────────────────────────────────────────────
Total IUs : [N]
P1        : [N]
P2        : [N]
P3        : [N]
P4        : [N]
Flagged   : [N] ambiguous · [N] untestable · [N] missing info
```
