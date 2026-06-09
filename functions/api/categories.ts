/**
 * GET /api/categories
 * Returns all categories with their app lists from /index/categories.json
 */

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)

  try {
    const assetUrl = new URL('/index/categories.json', url.origin)
    const res = await fetch(assetUrl.toString())

    if (!res.ok) throw new Error('Not found')

    const data = await res.json()
    return new Response(JSON.stringify(data), { headers: corsHeaders() })
  } catch {
    return new Response(JSON.stringify({ error: 'Categories unavailable' }), {
      status: 503,
      headers: corsHeaders(),
    })
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  }
}
