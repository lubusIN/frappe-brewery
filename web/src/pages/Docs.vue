<script setup lang="ts">
const endpoints = [
  {
    method: 'GET',
    path: '/index/apps.json',
    desc: 'All apps — full list with summaries',
    example: `{
  "generated_at": "2026-06-09T09:00:00Z",
  "count": 5,
  "apps": [
    {
      "slug": "erpnext",
      "title": "ERPNext",
      "description": "...",
      "frappe_versions": ["14", "15", "16"],
      "categories": ["Accounting"],
      "verified": true,
      "status": "active"
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/index/frappe-15.json',
    desc: 'Apps compatible with Frappe 15 (also: frappe-14.json, frappe-16.json)',
    example: null,
  },
  {
    method: 'GET',
    path: '/apps/:slug.json',
    desc: 'Full app details by slug',
    example: `{
  "slug": "erpnext",
  "name": "erpnext",
  "title": "ERPNext",
  "install": {
    "method": "bench",
    "command": "bench get-app erpnext",
    "app_name": "erpnext"
  },
  ...
}`,
  },
  {
    method: 'GET',
    path: '/index/categories.json',
    desc: 'All categories with their apps',
    example: null,
  },
  {
    method: 'GET',
    path: '/index/stats.json',
    desc: 'Registry stats — totals by version and category',
    example: `{
  "total_apps": 5,
  "total_categories": 6,
  "by_frappe_version": { "14": 5, "15": 5, "16": 5 },
  "by_category": { "Accounting": 1, "HR": 2 }
}`,
  },
  {
    method: 'GET',
    path: '/api/apps',
    desc: 'Filtered apps — supports ?frappe_version=15, ?category=CRM',
    example: null,
  },
  {
    method: 'GET',
    path: '/api/apps/:slug',
    desc: 'App detail via Pages Function',
    example: null,
  },
  {
    method: 'GET',
    path: '/api/categories',
    desc: 'Categories via Pages Function',
    example: null,
  },
]

const copied = ref<string | null>(null)
import { ref } from 'vue'

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = text
  setTimeout(() => { copied.value = null }, 2000)
}
</script>

<template>
  <div class="docs-page">
    <section class="page-header">
      <div class="container">
        <p class="section-eyebrow">Developer Documentation</p>
        <h1 class="section-title">API Reference</h1>
        <p class="page-subtitle">
          The registry exposes a static JSON API served via Cloudflare Pages.
          No auth, no rate limits, no database — just JSON files.
        </p>
      </div>
    </section>

    <div class="container docs-body">
      <!-- Overview -->
      <section class="docs-section" aria-labelledby="overview-heading">
        <h2 id="overview-heading" class="docs-h2">Overview</h2>
        <div class="overview-grid">
          <div class="overview-card">
            <div class="overview-icon">⚡</div>
            <h3>Static files</h3>
            <p>All endpoints return pre-generated JSON files. No server-side processing.</p>
          </div>
          <div class="overview-card">
            <div class="overview-icon">🔓</div>
            <h3>No auth required</h3>
            <p>Read-only, publicly accessible. No API keys or authentication.</p>
          </div>
          <div class="overview-card">
            <div class="overview-icon">🔄</div>
            <h3>Auto-updated</h3>
            <p>Index files are regenerated on every merge to main via GitHub Actions.</p>
          </div>
        </div>
      </section>

      <!-- Base URL -->
      <section class="docs-section" aria-labelledby="base-url-heading">
        <h2 id="base-url-heading" class="docs-h2">Base URL</h2>
        <div class="base-url-row">
          <div class="code-block base-url">https://registry.frappe.io</div>
          <button class="copy-btn" @click="copy('https://registry.frappe.io')" :aria-label="copied === 'https://registry.frappe.io' ? 'Copied!' : 'Copy base URL'">
            {{ copied === 'https://registry.frappe.io' ? '✓ Copied' : 'Copy' }}
          </button>
        </div>
      </section>

      <!-- Endpoints -->
      <section class="docs-section" aria-labelledby="endpoints-heading">
        <h2 id="endpoints-heading" class="docs-h2">Endpoints</h2>
        <div class="endpoints-list">
          <article
            v-for="ep in endpoints"
            :key="ep.path"
            class="endpoint-card"
            :aria-label="`${ep.method} ${ep.path}`"
          >
            <div class="endpoint-header">
              <span class="endpoint-method" :class="`method-${ep.method.toLowerCase()}`">{{ ep.method }}</span>
              <code class="endpoint-path">{{ ep.path }}</code>
            </div>
            <p class="endpoint-desc">{{ ep.desc }}</p>
            <div v-if="ep.example" class="endpoint-example">
              <div class="example-header">
                <span class="example-label">Example response</span>
                <button class="copy-btn copy-btn-sm" @click="copy(ep.example!)" :aria-label="`Copy example for ${ep.path}`">
                  {{ copied === ep.example ? '✓' : 'Copy' }}
                </button>
              </div>
              <pre class="code-block example-code">{{ ep.example }}</pre>
            </div>
          </article>
        </div>
      </section>

      <!-- Usage examples -->
      <section class="docs-section" aria-labelledby="usage-heading">
        <h2 id="usage-heading" class="docs-h2">Usage examples</h2>

        <div class="usage-examples">
          <div class="usage-example">
            <h3 class="usage-title">Frappe Local integration</h3>
            <div class="code-block">fetch("https://registry.frappe.io/index/frappe-15.json")
  .then(r => r.json())
  .then(data => console.log(data.apps))</div>
          </div>

          <div class="usage-example">
            <h3 class="usage-title">Install a specific app</h3>
            <div class="code-block"><span style="color: var(--text-3)"># Fetch install command from registry</span>
curl https://registry.frappe.io/apps/erpnext.json | jq '.install.command'</div>
          </div>

          <div class="usage-example">
            <h3 class="usage-title">Filter CRM apps via Pages Function</h3>
            <div class="code-block">fetch("https://registry.frappe.io/api/apps?category=CRM&frappe_version=15")</div>
          </div>
        </div>
      </section>

      <!-- Self-hosting -->
      <section class="docs-section" aria-labelledby="selfhost-heading">
        <h2 id="selfhost-heading" class="docs-h2">Self-hosting</h2>
        <p class="docs-p">
          The registry is fully open source. You can fork it, add your own apps, and deploy your own instance to Cloudflare Pages.
        </p>
        <ol class="selfhost-steps">
          <li>Fork <code class="inline-code">frappe/frappe-app-registry</code> on GitHub</li>
          <li>Connect your fork to Cloudflare Pages (build command: <code class="inline-code">npm run --prefix web build</code>, output: <code class="inline-code">web/dist</code>)</li>
          <li>Add your apps to <code class="inline-code">apps/</code> and merge to main — CI regenerates the index automatically</li>
        </ol>
      </section>
    </div>
  </div>
</template>

<style scoped>
.docs-page { padding-bottom: 80px; }
.page-header { padding: 48px 0 40px; border-bottom: 1px solid var(--border); }
.page-subtitle { color: var(--text-2); font-size: 16px; margin-top: 8px; max-width: 600px; line-height: 1.7; }
.docs-body { display: flex; flex-direction: column; gap: 60px; padding-top: 56px; max-width: 860px; }

.docs-section { display: flex; flex-direction: column; gap: 24px; }
.docs-h2 { font-size: 20px; font-weight: 700; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.docs-p { font-size: 15px; color: var(--text-2); line-height: 1.7; }

/* Overview */
.overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.overview-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.overview-icon { font-size: 24px; }
.overview-card h3 { font-size: 14px; font-weight: 700; }
.overview-card p { font-size: 13px; color: var(--text-2); line-height: 1.6; }

/* Base URL */
.base-url-row { display: flex; align-items: center; gap: 12px; }
.base-url { flex: 1; color: var(--accent-400); }

/* Endpoints */
.endpoints-list { display: flex; flex-direction: column; gap: 16px; }
.endpoint-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.endpoint-header { display: flex; align-items: center; gap: 12px; }
.endpoint-method {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--r-sm);
  background: hsla(221,80%,55%,0.15);
  color: var(--brand-400);
  border: 1px solid hsla(221,80%,55%,0.2);
}
.endpoint-path { font-family: var(--font-mono); font-size: 14px; color: var(--text); }
.endpoint-desc { font-size: 13px; color: var(--text-2); }

.endpoint-example { display: flex; flex-direction: column; gap: 8px; }
.example-header { display: flex; align-items: center; justify-content: space-between; }
.example-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.example-code { font-size: 12px; line-height: 1.7; white-space: pre; overflow-x: auto; color: var(--text-2); }

/* Copy button */
.copy-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text-2);
  font-size: 12px; font-weight: 600;
  cursor: pointer;
  transition: all var(--duration) var(--ease);
  white-space: nowrap;
  flex-shrink: 0;
}
.copy-btn:hover { border-color: var(--brand-500); color: var(--text); }
.copy-btn-sm { padding: 4px 10px; font-size: 11px; }

/* Usage */
.usage-examples { display: flex; flex-direction: column; gap: 24px; }
.usage-example { display: flex; flex-direction: column; gap: 10px; }
.usage-title { font-size: 15px; font-weight: 600; }

/* Self-host */
.selfhost-steps { display: flex; flex-direction: column; gap: 10px; padding-left: 20px; color: var(--text-2); font-size: 14px; line-height: 1.7; }

.inline-code { font-family: var(--font-mono); font-size: 12px; color: var(--accent-400); background: var(--bg-2); padding: 2px 6px; border-radius: 4px; }

@media (max-width: 600px) {
  .overview-grid { grid-template-columns: 1fr; }
  .base-url-row { flex-direction: column; align-items: stretch; }
}
</style>
