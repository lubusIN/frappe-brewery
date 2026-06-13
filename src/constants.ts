// Shared constants
import schema from '../scripts/app.schema.json'

export const CATEGORY_ICONS: Record<string, string> = {
  'Accounting': 'bar-chart-2',
  'AI': 'cpu',
  'Analytics': 'trending-up',
  'Automation': 'command',
  'Business': 'briefcase',
  'Collaboration': 'users',
  'Communication': 'message-circle',
  'Compliance': 'shield',
  'CRM Integration': 'link',
  'Customer Relations': 'heart',
  'Developer': 'code',
  'E-Commerce': 'shopping-cart',
  'Extension': 'plus-square',
  'Featured': 'star',
  'Files': 'file-text',
  'Free': 'gift',
  'Healthcare': 'activity',
  'Human Resources': 'users',
  'Integrations': 'link',
  'Localization': 'globe',
  'Marketing': 'speaker',
  'Mobile': 'smartphone',
  'Non-Profit': 'heart',
  'Payments': 'credit-card',
  'Productivity': 'check-square',
  'Retail': 'shopping-bag',
  'Storage': 'hard-drive',
  'Support': 'life-buoy',
  'Themes': 'layout',
  'Utilities': 'zap',
  'Utility': 'zap',
  'Website': 'globe',
}

export const CATEGORIES = schema.properties.categories.items.enum as string[]
export const FRAPPE_VERSIONS = schema.properties.frappe_versions.items.enum as string[]
export const LICENSES = schema.properties.license.enum as string[]
