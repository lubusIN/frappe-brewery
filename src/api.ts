// API base, reads from the same Cloudflare Pages deployment
// In dev, Vite proxies /index and /apps to the local server

import type { App, IndexResponse, CategoriesResponse, StatsResponse } from './types'

const BASE = import.meta.env.VITE_BREWERY_BASE ?? ''

export async function fetchApps(): Promise<IndexResponse> {
  const res = await fetch(`${BASE}/index/apps.json`)
  if (!res.ok) throw new Error('Failed to fetch apps index')
  return res.json()
}



export async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch(`${BASE}/index/categories.json`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${BASE}/index/stats.json`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchApp(slug: string): Promise<App> {
  const res = await fetch(`${BASE}/apps/${slug}.json`)
  if (!res.ok) throw new Error(`App "${slug}" not found`)
  return res.json()
}
