<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { FeatherIcon, Badge, Button, Avatar, SidebarItem } from 'frappe-ui'
import { fetchCategories } from '../api'
import type { CategoriesResponse, CategoryEntry } from '../types'

const route = useRoute()
const data = ref<CategoriesResponse | null>(null)
const loading = ref(true)
const selected = ref((route.query.cat as string) || '')

const CATEGORY_ICONS: Record<string, string> = {
  'CRM': 'users', 'HR': 'briefcase', 'Accounting': 'bar-chart-2',
  'Manufacturing': 'settings', 'POS': 'shopping-bag', 'Healthcare': 'activity',
  'Education': 'book-open', 'Integration': 'link', 'Payments': 'credit-card',
  'Reports': 'trending-up', 'Developer Tools': 'code', 'AI': 'cpu', 'Utilities': 'zap',
}

const allCategories = computed(() => data.value?.categories ?? [])

const allAppsCategory = computed<CategoryEntry>(() => {
  const allApps = new Map<string, any>()
  for (const cat of allCategories.value) {
    for (const app of cat.apps) {
      allApps.set(app.slug, app)
    }
  }
  return {
    name: 'All',
    count: allApps.size,
    apps: Array.from(allApps.values())
  }
})

const displayCategories = computed<CategoryEntry[]>(() => [
  allAppsCategory.value,
  ...allCategories.value
])

const activeCategory = computed<CategoryEntry | undefined>(() =>
  selected.value ? displayCategories.value.find(c => c.name === selected.value) : undefined
)

onMounted(async () => {
  try {
    data.value = await fetchCategories()
    if (!selected.value) {
      selected.value = 'All'
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-ink-gray-9">Categories</h1>
      <p class="text-sm text-ink-gray-4 mt-1">Browse apps by category</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      <!-- Category list sidebar -->
      <aside class="lg:col-span-1 sticky top-[68px]" aria-label="Category list">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 8" :key="i" class="animate-pulse bg-surface-gray-2 h-10 rounded-lg" />
        </div>
        <nav v-else class="space-y-0.5" role="navigation" aria-label="App categories">
          <button
            v-for="cat in displayCategories"
            :key="cat.name"
            @click="selected = cat.name"
            class="w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-md transition-colors duration-200"
            :class="selected === cat.name ? 'bg-surface-gray-2 text-ink-gray-9 font-medium' : 'text-ink-gray-6 hover:bg-surface-gray-2'"
          >
            <div class="flex items-center gap-2.5">
              <FeatherIcon :name="cat.name === 'All' ? 'layers' : CATEGORY_ICONS[cat.name] ?? 'box'" class="w-4 h-4" :class="selected === cat.name ? 'text-ink-gray-9' : 'text-ink-gray-5'" />
              <span>{{ cat.name }}</span>
            </div>
            <span class="text-xs" :class="selected === cat.name ? 'text-ink-gray-9 font-medium' : 'text-ink-gray-4'">{{ cat.count }}</span>
          </button>
        </nav>
      </aside>

      <!-- Apps area -->
      <main class="lg:col-span-3" aria-label="Apps in category">
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-surface-gray-2 h-40 rounded-lg" />
        </div>

        <template v-else-if="activeCategory">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2">
              <FeatherIcon :name="activeCategory.name === 'All' ? 'layers' : CATEGORY_ICONS[activeCategory.name] ?? 'box'" class="w-6 h-6 text-ink-gray-8" />
              <h2 class="text-lg font-semibold text-ink-gray-9">{{ activeCategory.name }}</h2>
            </div>
            <Badge size="lg" theme="gray" :label="`${activeCategory.count} app${activeCategory.count !== 1 ? 's' : ''}`" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <RouterLink
              v-for="app in activeCategory.apps"
              :key="app.slug"
              :to="`/apps/${app.slug}`"
              class="group flex flex-col gap-3 p-5 rounded-lg border border-outline-gray-1 bg-surface-white hover:border-outline-gray-4 transition-colors duration-200"
              :aria-label="`View ${app.title}`"
            >
              <div class="flex items-start justify-between">
                <Avatar shape="square" size="2xl" :image="app.icon" :label="app.title" />
                <Badge v-if="app.verified" theme="green" label="Verified">
                  <template #prefix><FeatherIcon name="check" class="w-3 h-3" /></template>
                </Badge>
              </div>
              <div class="flex-1">
                <h3 class="text-base font-semibold text-ink-gray-9">{{ app.title }}</h3>
                <p class="text-sm text-ink-gray-5 mt-1.5 leading-relaxed line-clamp-2">{{ app.description }}</p>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap pt-3 border-t border-outline-gray-1 mt-auto">
                <Badge v-for="v in app.frappe_versions" :key="v" theme="gray" :label="`v${v}`" class="font-mono" />
                <span class="ml-auto text-xs text-ink-gray-3">{{ app.license }}</span>
              </div>
            </RouterLink>
          </div>
        </template>

        <div v-else class="flex flex-col items-center py-20 text-center text-ink-gray-4">
          <FeatherIcon name="grid" class="w-8 h-8 text-ink-gray-3 mb-3" />
          <p>Select a category to browse apps</p>
        </div>
      </main>
    </div>
  </div>
</template>
