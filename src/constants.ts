// Shared constants
import schema from '../scripts/app.schema.json'

export const CATEGORY_ICONS: Record<string, string> = {
  'Accounting & Finance': 'bar-chart-2',
  'Analytics & AI': 'trending-up',
  'Business & Operations': 'briefcase',
  'CRM & Support': 'heart',
  'Developer Tools': 'code',
  'E-Commerce & Retail': 'shopping-cart',
  'Human Resources': 'users',
  'Industry Specific': 'activity',
  'Marketing': 'speaker',
  'Mobile': 'smartphone',
  'Website & Themes': 'layout',
  'Utilities': 'zap',
}

export const CATEGORIES = schema.properties.categories.items.enum as string[]
export const FRAPPE_VERSIONS = schema.properties.frappe_versions.items.enum as string[]
export const LICENSES = schema.properties.license.enum as string[]
