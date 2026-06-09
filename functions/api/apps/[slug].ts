/**
 * GET /api/apps/:slug
 * Returns full app details by slug from /apps/{slug}.json
 */

export const onRequestGet: PagesFunction<Record<string, unknown>, 'slug'> = async ({ request, params }) => {
  const { slug } = params
  const url = new URL(request.url)

  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400,
      headers: corsHeaders(),
    })
  }

  try {
    const assetUrl = new URL(`/apps/${slug}.json`, url.origin)
    const res = await fetch(assetUrl.toString())

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `App "${slug}" not found` }), {
        status: 404,
        headers: corsHeaders(),
      })
    }

    const app = await res.json()
    return new Response(JSON.stringify(app), { headers: corsHeaders() })
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  }
}
