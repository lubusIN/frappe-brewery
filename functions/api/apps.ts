/**
 * GET /api/apps
 * Query params:
 *   frappe_version  — filter by Frappe version (14, 15, 16)
 *   category        — filter by category name
 *   requires_erpnext — "true" to only return apps requiring ERPNext
 *   verified        — "true" to only return verified apps
 *   q               — search query (title, description, tags)
 */

import type { IndexResponse } from '../../src/types'
export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)

  // Read the static index file
  let indexData: IndexResponse
  try {
    // On Cloudflare Pages, assets are served from the same deployment
    const assetUrl = new URL('/index/apps.json', url.origin)
    const res = await fetch(assetUrl.toString())
    if (!res.ok) throw new Error('Index not found')
    indexData = await res.json() as IndexResponse
  } catch {
    return new Response(JSON.stringify({ error: 'Registry index unavailable' }), {
      status: 503,
      headers: corsHeaders(),
    })
  }

  let apps = indexData.apps

  // Filters
  const frappeVersion = url.searchParams.get('frappe_version')
  const category = url.searchParams.get('category')
  const requiresErpnext = url.searchParams.get('requires_erpnext')
  const verifiedOnly = url.searchParams.get('verified')
  const query = url.searchParams.get('q')

  if (frappeVersion) {
    apps = apps.filter(a => a.frappe_versions.includes(frappeVersion))
  }
  if (category) {
    apps = apps.filter(a => a.categories.includes(category))
  }
  if (requiresErpnext === 'true') {
    apps = apps.filter(a => a.required_apps.includes('erpnext'))
  }
  if (verifiedOnly === 'true') {
    apps = apps.filter(a => a.meta?.verified)
  }
  if (query) {
    const q = query.toLowerCase()
    apps = apps.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
    )
  }

  return new Response(
    JSON.stringify({
      generated_at: indexData.generated_at,
      count: apps.length,
      apps,
    }),
    { headers: corsHeaders() }
  )
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  }
}
