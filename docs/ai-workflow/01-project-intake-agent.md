# 01 Project Intake Agent

> Optional project initialization skill.
> Creates project-level context and metadata used by the AI QA Framework.
>
> This skill is NOT part of the requirements-to-test pipeline.
> It prepares the project structure, environments, modules, integrations, roles, and automation context that downstream skills may consume.
>
> Runs before any requirements analysis, automation generation, execution, or reporting activities.

---

# PURPOSE

Initialize a new project inside the AI QA Framework.

Collect and document:

* Project information
* Domain information
* Environment information
* Authentication strategy
* User roles
* Modules
* Integrations
* Test data ownership
* Compliance restrictions
* Automation scope

Create reusable project context files that can be consumed by:

* System Walkthrough Agent
* Playwright Generator
* Test Execution Agent
* Failure Analysis Agent
* Reporting Agents

---

# WHEN TO USE THIS SKILL

Use this skill when:

* Starting automation for a new application
* Starting a new client engagement
* Onboarding a new environment
* Creating a reusable QA project structure
* Building automation for an application not yet registered in the framework

Do not use this skill for:

* Requirement analysis
* Test design
* Test execution
* Automation generation
* Failure analysis

---

# REQUIRED INPUTS

## Project Information

* Project name
* Project description
* Business owner (optional)
* Technical owner (optional)

---

## System Information

* Application type
* System URL
* Login path (if applicable)
* Application architecture (if known)

Examples:

* Web
* Mobile Web
* Mobile App
* API
* CRM
* ERP
* Banking Portal
* Internal System

---

## Domain Information

Determine domain:

* Banking
* CRM
* ERP
* Healthcare
* E-commerce
* Government
* Insurance
* Telecom
* Generic

If uncertain:

domain = unspecified

---

## Environment Information

Collect:

* Development URL
* QA URL
* UAT URL
* Production URL (reference only)

Environment names:

* DEV
* QA
* SIT
* UAT
* PROD

Only document URLs and environment names.

Never document credentials.

---

## Authentication Information

Collect:

* Authentication method
* MFA requirements
* SSO usage
* Session timeout behavior (if known)

Examples:

* Username / Password
* SSO
* SAML
* OAuth
* MFA
* OTP

---

## User Roles

Collect:

* Business roles
* Operational roles
* Administrative roles

Examples:

* Customer
* CSR
* Supervisor
* Admin
* Operations User

Do not invent roles.

---

## Modules

Collect all known modules.

Examples:

* Dashboard
* Transfers
* Beneficiaries
* Payments
* Accounts
* Customer Profile
* Reporting

Do not invent modules.

---

## Integration Inventory

Collect known integrations.

Examples:

* CBS
* CRM
* CMS
* Middleware
* SMS Gateway
* Email Service
* Payment Gateway
* Reporting Service
* Notification Service

Do not assume integrations.

Only document confirmed integrations.

---

## Test Data Information

Collect:

* Test data owner
* Test data source
* Data refresh process
* Environment restrictions

Examples:

* Synthetic Data
* Masked Data
* Dedicated Test Accounts

---

## Compliance Information

Collect:

* Data sensitivity level
* Regulatory restrictions
* Audit requirements

Examples:

* PCI-DSS
* GDPR
* Banking Compliance
* Internal Policy

If unknown:

mark as:

Compliance Status = Unknown

---

## Automation Scope

Collect:

* UI automation required
* API automation required
* Regression automation required
* Smoke automation required

---

# REQUIRED OUTPUTS

Create:

docs/projects/<project-name>/

Containing:

* project-profile.md
* environment-notes.md
* modules.md
* system-context.md
* integration-inventory.md
* test-data-strategy.md
* run-context.md

---

# STEP-BY-STEP BEHAVIOR

## Step 1

Collect project information.

---

## Step 2

Collect system information.

---

## Step 3

Determine domain classification.

---

## Step 4

Collect environment information.

---

## Step 5

Collect authentication information.

---

## Step 6

Collect user roles.

---

## Step 7

Collect modules.

---

## Step 8

Collect integration inventory.

---

## Step 9

Collect test data strategy.

---

## Step 10

Collect compliance requirements.

---

## Step 11

Collect automation scope.

---

## Step 12

Create project folder structure.

---

## Step 13

Generate all required output files.

---

## Step 14

Recommend environment variable naming convention.

Example:

BASE_URL
QA_URL
UAT_URL

TEST_USER
ADMIN_USER

API_BASE_URL

Never store values.

Only recommend names.

---

# OUTPUT FILE DEFINITIONS

## project-profile.md

Contains:

* Project Name
* Description
* Domain
* Application Type
* Automation Scope
* High-Level Summary

---

## environment-notes.md

Contains:

* Environment Names
* URLs
* Access Notes
* Environment Restrictions

---

## modules.md

Contains:

* Module List
* Module Descriptions
* Known Business Flows

---

## system-context.md

Contains:

* Authentication Method
* User Roles
* Session Information
* Architecture Notes

---

## integration-inventory.md

Contains:

* Integration Name
* Integration Type
* Dependency Notes

---

## test-data-strategy.md

Contains:

* Data Ownership
* Data Source
* Refresh Strategy
* Restrictions

---

## run-context.md

Contains:

Project Name

Domain

Application Type

Environment List

Authentication Method

Modules

Integrations

User Roles

Data Sensitivity

Automation Scope

Known Constraints

---

# QUALITY GATES

Before completion verify:

✓ Project folder exists

✓ Required files created

✓ No credentials documented

✓ No secrets documented

✓ Domain classification assigned

✓ Modules documented

✓ Integrations documented

✓ Automation scope documented

✓ Run context created

---

# SECURITY RULES

Never store:

* Passwords
* OTP values
* API Keys
* Tokens
* Secrets
* Customer Data
* Production Account Numbers
* Production Card Numbers
* PII
* Sensitive Financial Data

If provided:

Mask and replace with:

[REDACTED]

---

# DO-NOT RULES

Do not:

* Create test cases
* Create automation code
* Generate Playwright scripts
* Perform requirements analysis
* Perform risk analysis
* Invent modules
* Invent roles
* Invent integrations
* Store credentials

---

# OUTPUT LOCATIONS

Framework Skills:

docs/ai-workflow/

Project Artifacts:

docs/projects/<project-name>/

Requirements:

docs/requirements/

Analysis:

docs/analysis/

Traceability:

docs/traceability/

Automation:

tests/

Execution Results:

reports/
test-results/

Reports:

docs/reports/

---

# EXAMPLE PROMPT

Use the project bootstrap skill to initialize a new QA automation project for "<project-name>" and generate the required project context files.
