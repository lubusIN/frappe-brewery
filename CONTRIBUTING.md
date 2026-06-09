# Contributing to Frappe App Registry

Thank you for helping grow the Frappe ecosystem! This guide explains how to submit, update, and maintain app entries in the registry.

---

## Table of Contents

- [How to Submit an App](#how-to-submit-an-app)
- [How Validation Works](#how-validation-works)
- [Required Fields](#required-fields)
- [Optional Fields](#optional-fields)
- [Categories](#categories)
- [How Updates Work](#how-updates-work)
- [Manual Overrides](#manual-overrides)

---

## How to Submit an App

1. **Fork** this repository
2. **Copy** `apps/example-app.json` to `apps/your-app-slug.json`
   - The filename must use lowercase letters, numbers, and hyphens only (e.g. `my-crm-app.json`)
3. **Fill in** all required fields (see below)
4. **Run validation locally**:
   ```bash
   npm install
   npm run validate
   ```
5. **Open a Pull Request** — the PR template will guide you through the checklist

A maintainer will review your PR. The GitHub Actions CI will run the validator automatically and report any errors directly in the PR.

---

## How Validation Works

Every PR touching `apps/**` runs `scripts/validate.ts`, which performs these checks:

### Errors (will block merge)

| Check | Description |
|-------|-------------|
| Valid JSON | File must be parseable JSON |
| Schema conformance | All required fields present and correctly typed |
| slug matches filename | `"slug": "my-app"` → file must be `apps/my-app.json` |
| Unique slug | No two files may share the same slug |
| GitHub repository URL | `repository` must match `https://github.com/owner/repo` |
| `required_apps` includes `frappe` | All apps must list `frappe` as a dependency |
| `install.app_name` present | Installation app name must be provided |
| Valid categories | Only values from the [allowed list](#categories) |

### Warnings (informational, do not block merge)

| Check | Description |
|-------|-------------|
| No screenshots | Encourages adding `media.screenshots` |
| No docs link | Encourages adding `links.docs` |

---

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `slug` | `string` | URL-friendly ID matching the filename (e.g. `my-app`) |
| `name` | `string` | Python package name in snake_case (e.g. `my_app`) |
| `title` | `string` | Human-readable display name |
| `description` | `string` | Short description (10–500 characters) |
| `repository` | `string` | Public GitHub URL (`https://github.com/owner/repo`) |
| `license` | `string` | SPDX identifier (e.g. `MIT`, `GPL-3.0`, `AGPL-3.0`) |
| `frappe_versions` | `string[]` | Supported Frappe versions: `"14"`, `"15"`, `"16"` |
| `required_apps` | `string[]` | Must include `"frappe"`; add `"erpnext"` if needed |
| `categories` | `string[]` | One or more values from the [allowed list](#categories) |
| `install.method` | `string` | `"bench"`, `"pip"`, or `"manual"` |
| `install.command` | `string` | Full install command |
| `install.app_name` | `string` | App name used in the install command |
| `meta.source` | `string` | `"manual"` for PR submissions |
| `meta.verified` | `boolean` | Leave as `false` — maintainers set this |
| `meta.status` | `string` | `"active"` for new submissions |

---

## Optional Fields

| Field | Description |
|-------|-------------|
| `tags` | Free-form tags for search and discoverability |
| `links.docs` | Documentation URL |
| `links.demo` | Live demo URL |
| `links.website` | Official website |
| `media.icon` | Square app icon URL (minimum 128×128 px) |
| `media.screenshots` | Array of screenshot URLs |
| `meta.added_at` | Date added (set automatically on merge) |
| `meta.updated_at` | Date last updated |

---

## Categories

Only the following categories are accepted. An app may belong to multiple categories.

| Category | Description |
|----------|-------------|
| `CRM` | Customer relationship management |
| `HR` | Human resources and payroll |
| `Accounting` | Finance and bookkeeping |
| `Manufacturing` | Production and supply chain |
| `POS` | Point of sale |
| `Healthcare` | Medical and clinical tools |
| `Education` | Learning management and institutions |
| `Integration` | Third-party integrations and connectors |
| `Payments` | Payment gateways and processing |
| `Reports` | Analytics, BI, and reporting |
| `Developer Tools` | Tooling for Frappe developers |
| `AI` | AI and ML-powered features |
| `Utilities` | General-purpose utilities and helpers |

---

## How Updates Work

To update an existing entry:
1. Edit the corresponding `apps/<slug>.json` file
2. Update only the fields that have changed
3. Open a PR — CI will re-validate the file

> **Manual fields are never overwritten** by automation. Only auto-synced fields (stars, forks, last release, last commit) may be updated by the registry bot in the future.

---

## Manual Overrides

If you need to correct auto-extracted data or override a field, edit the JSON directly in your PR. Manual edits in `apps/` always take precedence over any automated extraction.
