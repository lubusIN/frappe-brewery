// Shared constants
import schema from '../../schema/app.schema.json'

export const CATEGORY_ICONS: Record<string, string> = {
  'CRM': 'users',
  'HR': 'briefcase',
  'Accounting': 'bar-chart-2',
  'Manufacturing': 'settings',
  'POS': 'shopping-bag',
  'Healthcare': 'activity',
  'Education': 'book-open',
  'Integration': 'link',
  'Payments': 'credit-card',
  'Reports': 'trending-up',
  'Developer Tools': 'code',
  'AI': 'cpu',
  'Utilities': 'zap',
}

export const CATEGORIES = Object.keys(CATEGORY_ICONS)
export const FRAPPE_VERSIONS = schema.properties.frappe_versions.items.enum as string[]
export const LICENSES = schema.properties.license.enum as string[]
