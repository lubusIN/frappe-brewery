# Frappe App Registry

A community-maintained app index for the Frappe ecosystem.

- **Open data** — all app entries are plain JSON, versioned in Git
- **GitHub-based submissions** — submit apps via Pull Request
- **Static JSON API** — no database, consumed directly by tools
- **Built for** Frappe Local, hosting platforms, and community tooling

---

## Using the API

The registry exposes a static JSON API via Cloudflare Pages:

```bash
# All apps
GET https://registry.frappe.io/index/apps.json

# Apps compatible with Frappe 15
GET https://registry.frappe.io/index/frappe-15.json

# App by slug
GET https://registry.frappe.io/apps/erpnext.json

# Categories
GET https://registry.frappe.io/index/categories.json

# Stats
GET https://registry.frappe.io/index/stats.json
```

Dynamic API endpoints (via Cloudflare Pages Functions):

```bash
GET /api/apps
GET /api/apps?frappe_version=15
GET /api/apps?category=CRM
GET /api/apps/:slug
GET /api/categories
```

---

## Submitting an App

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

**Quick steps:**

1. Fork this repository
2. Copy `example-app.json` → `apps/your-app-slug.json`
3. Fill in all required fields
4. Run `pnpm validate` locally
5. Open a Pull Request

---

## Repository Structure

```
frappe-app-registry/
├── apps/               # Individual app JSON files (one per app)
├── index/              # Generated index files (auto-committed by CI)
├── schema/             # JSON Schema for app entries
├── scripts/            # TypeScript build/validate scripts
├── web/                # Vue 3 SPA (Cloudflare Pages)
├── functions/          # Cloudflare Pages Functions (API endpoints)
└── .github/            # Workflows and PR template
```

---

## Local Development

```bash
# Install dependencies
npm install

# Validate all app files
npm run validate

# Generate index files
npm run generate:index

# Extract app metadata from a GitHub repo URL
npm run extract https://github.com/your-org/your-app

# Start the website locally
npm run --prefix web dev
```

---

## License

MIT
