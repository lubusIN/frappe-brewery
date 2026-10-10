<p align="center"><img width="180" src=".github/assets/logo.svg"></p>

<img src=".github/assets/banner.png" />

# Frappe Brewery

An open app registry for the Frappe Apps.

> [!WARNING]
> The checks, automated validations, and app extraction workflows are currently under active development. They may occasionally be fragile or produce false positives. If your app fails validation unexpectedly, please let us know!


- **Open data** all app entries are plain JSON, versioned in Git
- **GitHub-based submissions** submit apps via Pull Request
- **Static JSON API** no database, consumed directly by tools
- **Built for** Frappe Local, hosting platforms, and community tooling

## Using the API

The registry exposes a static JSON API via Cloudflare Pages:

```bash
# All apps
GET https://frappe-brewery.lubus.in/index/apps.json

# Apps compatible with Frappe 15
GET https://frappe-brewery.lubus.in/index/frappe-15.json

# App by slug
GET https://frappe-brewery.lubus.in/apps/erpnext.json

# Categories
GET https://frappe-brewery.lubus.in/index/categories.json

# Stats
GET https://frappe-brewery.lubus.in/index/stats.json
```

Dynamic API endpoints (via Cloudflare Pages Functions):

```bash
GET /api/apps
GET /api/apps?frappe_version=15
GET /api/apps?category=CRM
GET /api/apps/:slug
GET /api/categories
```

## Submitting an App

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

You can submit an app using either GitHub Issues (recommended) or a manual Pull Request.

**Method 1: Via GitHub Issues (Recommended)**
1. Open a new [App Submission Issue](https://github.com/lubusIN/frappe-brewery/issues/new?template=submit-app.yml)
2. Provide your repository URL, select categories, and add tags
3. The registry bot will automatically extract metadata and create a Pull Request once accepted.

**Method 2: Via Pull Request**
1. Fork this repository
2. Copy `apps/_example-app.json` → `apps/your-app-slug.json`
3. Fill in required fields and run `npm run brewery:validate` locally
4. Open a Pull Request

## Repository Structure

```
frappe-brewery/
├── apps/               # Individual app JSON files (one per app)
├── index/              # Generated index files (auto-committed by CI)
├── scripts/            # TypeScript scripts and JSON schema
├── src/                # Vue 3 SPA frontend code
├── functions/          # Cloudflare Pages Functions (API endpoints)
└── .github/            # Workflows and Issue templates
```

## Local Development

```bash
# Install dependencies
npm install

# Validate all app files
npm run brewery:validate

# Format all app files
npm run brewery:format

# Generate index files
npm run brewery:build

# Extract app metadata from a GitHub repo URL
npm run brewery:extract https://github.com/your-org/your-app

# Sync allowed categories to GitHub issue template
npm run brewery:sync

# Start the website locally
npm run dev
```

## More Frappe Tools

Explore more open-source tools we're building for the Frappe ecosystem.

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://github.com/lubusIN/frappe-local">
        <img src="https://raw.githubusercontent.com/lubusIN/frappe-local/main/.github/assets/logo.svg" alt="Frappe Local" height="60">
      </a>
      <br>
      Create and manage local Frappe benches and sites visually.
    </td>
    <td width="50%" valign="top">
      <a href="https://github.com/lubusIN/frappe-playground">
        <img src="https://raw.githubusercontent.com/lubusIN/frappe-playground/main/.github/logo.svg" alt="Frappe Playground" height="60">
      </a>
      <br>
      Run Frappe entirely in your browser.
    </td>
  </tr>

  <tr>
    <td width="50%" valign="top">
      <a href="https://github.com/lubusIN/frappe-vault">
        <img src="https://raw.githubusercontent.com/lubusIN/frappe-vault/main/.github/assets/logo.svg" alt="Frappe Vault" height="60">
      </a>
      <br>
      Manage secrets and passwords with Frappe.
    </td>
    <td width="50%" valign="top">
      <a href="https://github.com/lubusIN/wp-frappe-data-store">
        <img src="https://raw.githubusercontent.com/lubusIN/wp-frappe-data-store/main/.github/assets/logo.svg" alt="WP Frappe Data Store" height="60">
      </a>
      <br>
      Connect WordPress and Frappe with a React data store.
    </td>
  </tr>
</table>

[Explore all LUBUS projects →](https://github.com/lubusIN)

## Meet Your Artisans

[LUBUS](https://lubus.in/?utm_source=github&utm_medium=open-source&utm_campaign=frappe-brewery) is a web design agency based in Mumbai.

<a href="https://cal.com/lubus">
<img src="https://raw.githubusercontent.com/lubusIN/.github/refs/heads/main/profile/banner.png" />
</a>

## License

Frappe Brewery is open-sourced licensed under the [MIT License](LICENSE).
