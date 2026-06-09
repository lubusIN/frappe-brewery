// API base — reads from the same Cloudflare Pages deployment
// In dev, Vite proxies /index and /apps to the local server

const BASE = import.meta.env.VITE_REGISTRY_BASE ?? ''

export async function fetchApps() {
  const res = await fetch(`${BASE}/index/apps.json`)
  if (!res.ok) throw new Error('Failed to fetch apps index')
  return res.json()
}

export async function fetchAppsByVersion(version: string) {
  const res = await fetch(`${BASE}/index/frappe-${version}.json`)
  if (!res.ok) throw new Error(`Failed to fetch apps for Frappe ${version}`)
  return res.json()
}

export async function fetchCategories() {
  const res = await fetch(`${BASE}/index/categories.json`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/index/stats.json`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchApp(slug: string) {
  const res = await fetch(`${BASE}/apps/${slug}.json`)
  if (!res.ok) throw new Error(`App "${slug}" not found`)
  return res.json()
}
