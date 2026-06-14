# Frappe Brewery

A community app registry for the Frappe ecosystem.

<img src=".github/assets/banner.png" />

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

## Meet Your Artisans

[LUBUS](https://lubus.in/?utm_source=github&utm_medium=open-source&utm_campaign=frappe-brewery) is a web design agency based in Mumbai.

<a href="https://cal.com/lubus">
<img src="https://raw.githubusercontent.com/lubusIN/.github/refs/heads/main/profile/banner.png" />
</a>

## License

Frappe Brewery is open-sourced licensed under the [MIT License](LICENSE).