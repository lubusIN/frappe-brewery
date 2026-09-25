// Shared constants
import schema from '../scripts/app.schema.json'

export const CATEGORY_ICONS: Record<string, string> = {
  'Accounting & Finance': 'lucide-bar-chart-2',
  'Analytics & AI': 'lucide-trending-up',
  'Business & Operations': 'lucide-briefcase',
  'CRM & Support': 'lucide-heart',
  'Developer Tools': 'lucide-code',
  'E-Commerce & Retail': 'lucide-shopping-cart',
  'Human Resources': 'lucide-users',
  'Industry Specific': 'lucide-activity',
  'Marketing': 'lucide-speaker',
  'Mobile': 'lucide-smartphone',
  'Website & Themes': 'lucide-layout',
  'Utilities': 'lucide-zap',
}

export const CATEGORIES = schema.properties.categories.items.enum as string[]
export const FRAPPE_VERSIONS = schema.properties.frappe_versions.items.enum as string[]
export const LICENSES = schema.properties.license.enum as string[]

export function formatFrappeVersion(version: string): string {
  return version === 'develop' ? 'Develop' : version
}

export function formatFrappeVersionBadge(version: string): string {
  return version === 'develop' ? 'Develop' : `v${version}`
}
