export const SITE_URL = 'https://frappe-brewery.lubus.in'

export const BADGE_PATH = '/badges/listed-on.svg'

export function appUrl(slug: string): string {
  return `${SITE_URL}/apps/${slug}`
}

export function badgeImageUrl(): string {
  return `${SITE_URL}${BADGE_PATH}`
}

export function badgeMarkdown(slug: string): string {
  return `[![Listed on Frappe Brewery](${badgeImageUrl()})](${appUrl(slug)})`
}

export function badgeHtml(slug: string): string {
  return `<a href="${appUrl(slug)}"><img src="${badgeImageUrl()}" alt="Listed on Frappe Brewery" height="28"></a>`
}
