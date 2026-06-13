// Shared types matching app.schema.json


export interface AppLinks {
  docs?: string
  demo?: string
  website?: string
}

export interface AppMedia {
  icon?: string
  screenshots?: string[]
}

export interface AppMeta {
  source?: 'manual' | 'extracted'
  verified?: boolean
  status?: 'active' | 'deprecated' | 'archived' | 'unmaintained'
  added_at?: string
  updated_at?: string
}

export interface App {
  slug: string
  name: string
  title: string
  description: string
  repository: string
  license: string
  frappe_versions: string[]
  min_frappe_version: string
  install_branches: Record<string, string>
  required_apps: string[]
  categories: string[]
  tags?: string[]
  install_commands: string[]
  links?: AppLinks
  media?: AppMedia
  meta?: AppMeta
}

export interface IndexResponse {
  generated_at: string
  count: number
  apps: App[]
}

export interface CategoryEntry {
  name: string
  count: number
  apps: App[]
}

export interface CategoriesResponse {
  generated_at: string
  categories: CategoryEntry[]
}

export interface StatsResponse {
  generated_at: string
  total_apps: number
  total_categories: number
  by_frappe_version: Record<string, number>
  by_category: Record<string, number>
}
