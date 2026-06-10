<script setup lang="ts">
import { ref } from 'vue'
import { FeatherIcon, Button } from 'frappe-ui'

const copied = ref<string | null>(null)
async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = text
  setTimeout(() => { copied.value = null }, 2000)
}

const overviewCards = [
  { icon: 'zap', title: 'Static files', desc: 'All endpoints return pre-generated JSON. No server-side processing.' },
  { icon: 'unlock', title: 'No auth required', desc: 'Read-only, publicly accessible. No API keys needed.' },
  { icon: 'refresh-cw', title: 'Auto-updated', desc: 'Index regenerated on every merge to main via GitHub Actions.' },
]

const usageExamples = [
  {
    title: 'Fetch all apps (JavaScript)',
    code: `fetch('https://brewery.frappe.io/index/apps.json')
  .then(r => r.json())
  .then(data => console.log(data.apps))`,
  },
  {
    title: 'Get install commands (curl + jq)',
    code: `curl https://brewery.frappe.io/apps/erpnext.json | jq '.install_commands'`,
  },
  {
    title: 'Filter CRM apps via Pages Function',
    code: `fetch('https://brewery.frappe.io/api/apps?category=CRM&frappe_version=15')`,
  },
]

const endpoints = [
  {
    method: 'GET', path: '/index/apps.json',
    desc: 'Full list of all apps with summaries',
    example: `{
  "generated_at": "2026-06-09T09:00:00Z",
  "count": 5,
  "apps": [{ "slug": "erpnext", "title": "ERPNext", ... }]
}`,
  },
  {
    method: 'GET', path: '/index/frappe-15.json',
    desc: 'Apps compatible with Frappe 15 (also: frappe-14.json, frappe-16.json)',
    example: null,
  },
  {
    method: 'GET', path: '/apps/:slug.json',
    desc: 'Full app details by slug (all fields)',
    example: null,
  },
  {
    method: 'GET', path: '/index/categories.json',
    desc: 'All categories grouped with their apps',
    example: null,
  },
  {
    method: 'GET', path: '/index/stats.json',
    desc: 'Brewery stats, totals by version and category',
    example: `{
  "total_apps": 5,
  "total_categories": 6,
  "by_frappe_version": { "14": 5, "15": 5, "16": 5 },
  "by_category": { "Accounting": 1, "HR": 2 }
}`,
  },
  {
    method: 'GET', path: '/api/apps',
    desc: 'Filtered via Pages Function, supports ?frappe_version, ?category, ?q',
    example: null,
  },
  {
    method: 'GET', path: '/api/apps/:slug',
    desc: 'Single app via Pages Function',
    example: null,
  },
  {
    method: 'GET', path: '/api/categories',
    desc: 'Categories via Pages Function',
    example: null,
  },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
    <!-- Header -->
    <div class="mb-10 pb-8 border-b border-outline-gray-1">
      <p class="text-xs font-semibold uppercase tracking-widest text-ink-gray-4 mb-2">Developer Docs</p>
      <h1 class="text-3xl font-bold text-ink-gray-9">API Reference</h1>
      <p class="mt-3 text-base text-ink-gray-5 max-w-xl leading-relaxed">
        The brewery exposes a static JSON API via Cloudflare Pages. No auth, no rate limits, no database.
      </p>
    </div>

    <!-- Overview cards -->
    <section class="mb-12" aria-labelledby="overview-heading">
      <h2 id="overview-heading" class="text-lg font-semibold text-ink-gray-8 mb-4">Overview</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="card in overviewCards" :key="card.title" class="rounded-lg border border-outline-gray-1 p-5 bg-surface-white">
          <FeatherIcon :name="card.icon" class="w-6 h-6 text-ink-gray-8 mb-3" />
          <h3 class="text-sm font-semibold text-ink-gray-8 mb-1">{{ card.title }}</h3>
          <p class="text-xs text-ink-gray-4 leading-relaxed">{{ card.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Base URL -->
    <section class="mb-12" aria-labelledby="base-url-heading">
      <h2 id="base-url-heading" class="text-lg font-semibold text-ink-gray-8 mb-3">Base URL</h2>
      <div class="flex items-center gap-3 p-4 rounded-lg border border-outline-gray-2 bg-surface-gray-1">
        <code class="flex-1 font-mono text-sm text-ink-gray-7">https://brewery.frappe.io</code>
        <Button
          :variant="copied === 'https://brewery.frappe.io' ? 'subtle' : 'outline'"
          :theme="copied === 'https://brewery.frappe.io' ? 'green' : 'gray'"
          @click="copy('https://brewery.frappe.io')"
          aria-label="Copy base URL"
          :icon-left="copied === 'https://brewery.frappe.io' ? 'check' : 'copy'"
        >
          {{ copied === 'https://brewery.frappe.io' ? 'Copied' : 'Copy' }}
        </Button>
      </div>
    </section>

    <!-- Endpoints -->
    <section class="mb-12" aria-labelledby="endpoints-heading">
      <h2 id="endpoints-heading" class="text-lg font-semibold text-ink-gray-8 mb-4">Endpoints</h2>
      <div class="rounded-lg border border-outline-gray-1 overflow-hidden divide-y divide-outline-gray-1">
        <div v-for="ep in endpoints" :key="ep.path" class="bg-surface-white">
          <div class="flex items-center gap-3 px-5 py-4">
            <span class="shrink-0 text-xs font-bold font-mono text-ink-blue-2 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{{ ep.method }}</span>
            <code class="flex-1 font-mono text-sm text-ink-gray-7">{{ ep.path }}</code>
          </div>
          <div v-if="ep.desc || ep.example" class="px-5 pb-4 space-y-3">
            <p v-if="ep.desc" class="text-xs text-ink-gray-4">{{ ep.desc }}</p>
            <div v-if="ep.example">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs text-ink-gray-3 uppercase tracking-wider font-semibold">Example response</span>
                <Button
                  variant="ghost"
                  :theme="copied === ep.example ? 'green' : 'gray'"
                  @click="copy(ep.example!)"
                  aria-label="Copy example"
                  :icon-left="copied === ep.example ? 'check' : 'copy'"
                >
                  {{ copied === ep.example ? 'Copied' : 'Copy' }}
                </Button>
              </div>
              <pre class="font-mono text-xs text-ink-gray-5 bg-surface-gray-1 border border-outline-gray-1 rounded-lg p-4 overflow-x-auto leading-relaxed">{{ ep.example }}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Usage -->
    <section class="mb-12" aria-labelledby="usage-heading">
      <h2 id="usage-heading" class="text-lg font-semibold text-ink-gray-8 mb-4">Usage examples</h2>
      <div class="space-y-4">
        <div v-for="ex in usageExamples" :key="ex.title" class="rounded-lg border border-outline-gray-1 overflow-hidden">
          <div class="px-4 py-3 bg-surface-gray-1 border-b border-outline-gray-1">
            <h3 class="text-sm font-semibold text-ink-gray-7">{{ ex.title }}</h3>
          </div>
          <pre class="p-4 font-mono text-xs text-ink-gray-6 overflow-x-auto bg-surface-white leading-relaxed">{{ ex.code }}</pre>
        </div>
      </div>
    </section>

    <!-- Self-hosting -->
    <section aria-labelledby="selfhost-heading">
      <h2 id="selfhost-heading" class="text-lg font-semibold text-ink-gray-8 mb-3">Self-hosting</h2>
      <div class="rounded-lg border border-outline-gray-1 p-6 bg-surface-white">
        <p class="text-sm text-ink-gray-5 leading-relaxed mb-4">The brewery is fully open source. Fork it, add your own apps, and deploy your instance to Cloudflare Pages.</p>
        <ol class="space-y-2 text-sm text-ink-gray-6">
          <li class="flex gap-3 items-start">
            <span class="shrink-0 w-5 h-5 rounded-full bg-surface-gray-2 flex items-center justify-center text-xs font-bold text-ink-gray-5 mt-0.5">1</span>
            <div class="leading-relaxed">
              Fork <code class="font-mono text-xs bg-surface-gray-2 px-1.5 py-0.5 rounded border border-outline-gray-1">frappe/frappe-brewery</code> on GitHub
            </div>
          </li>
          <li class="flex gap-3 items-start">
            <span class="shrink-0 w-5 h-5 rounded-full bg-surface-gray-2 flex items-center justify-center text-xs font-bold text-ink-gray-5 mt-0.5">2</span>
            <div class="leading-relaxed">
              Connect to Cloudflare Pages and configure the project settings:
              <ul class="mt-1.5 space-y-1">
                <li class="flex items-center gap-2">
                  <span class="text-ink-gray-5">Build command:</span>
                  <code class="font-mono text-xs bg-surface-gray-2 px-1.5 py-0.5 rounded border border-outline-gray-1 flex-1 overflow-x-auto whitespace-nowrap">npm run build</code>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-ink-gray-5">Output directory:</span>
                  <code class="font-mono text-xs bg-surface-gray-2 px-1.5 py-0.5 rounded border border-outline-gray-1">dist</code>
                </li>
              </ul>
            </div>
          </li>
          <li class="flex gap-3 items-start">
            <span class="shrink-0 w-5 h-5 rounded-full bg-surface-gray-2 flex items-center justify-center text-xs font-bold text-ink-gray-5 mt-0.5">3</span>
            <div class="leading-relaxed">
              Add apps to <code class="font-mono text-xs bg-surface-gray-2 px-1.5 py-0.5 rounded border border-outline-gray-1">apps/</code>, CI regenerates the index automatically on merge
            </div>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>
