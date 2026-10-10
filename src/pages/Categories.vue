<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon, Badge, Dropdown } from 'frappe-ui'
import { fetchCategories } from '../api'
import { CATEGORY_ICONS, formatFrappeVersionBadge } from '../constants'
import AppCard from '../components/AppCard.vue'
import type { CategoriesResponse, CategoryEntry } from '../types'

const route = useRoute()
const data = ref<CategoriesResponse | null>(null)
const loading = ref(true)
const selected = ref((route.query.cat as string) || '')

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

function categoryIcon(name: string): string {
  if (name === 'All') return 'lucide-layers'
  return CATEGORY_ICONS[name] ?? 'lucide-box'
}

const categoryOptions = computed(() => displayCategories.value.map(c => ({
  label: c.name,
  value: c.name,
  count: c.count,
  onClick: () => selected.value = c.name,
})))

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
      <h1 class="text-3xl-bold text-ink-gray-9">Categories</h1>
      <p class="text-sm text-ink-gray-4 mt-1">Browse apps by category</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      <aside class="lg:col-span-1 lg:sticky lg:top-[68px]" aria-label="Category list">
        <div v-if="loading" class="flex flex-col gap-2">
          <!-- Mobile loading -->
          <div class="lg:hidden animate-pulse bg-surface-gray-2 h-9 w-full rounded-5 mb-4" />
          <!-- Desktop loading -->
          <div class="hidden lg:flex flex-col gap-2">
            <div v-for="i in 8" :key="i" class="animate-pulse bg-surface-gray-2 h-10 w-full rounded-6" />
          </div>
        </div>
        <div v-else>
          <!-- Mobile Dropdown -->
          <div class="lg:hidden pb-6">
            <Dropdown
              :options="categoryOptions"
              class="w-full"
            >
              <template #default>
                <button
                  class="w-full flex items-center justify-between px-3 py-[7px] text-base sm:text-sm rounded-5 border border-outline-gray-2 bg-surface-base text-ink-gray-8 hover:bg-surface-gray-1 focus:outline-none focus:ring-2 focus:ring-outline-gray-3 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <Icon :icon="categoryIcon(selected || 'All')" class="w-4 h-4 text-ink-gray-5" />
                    <span>{{ selected || 'All' }}</span>
                  </div>
                  <Icon icon="lucide-chevron-down" class="w-4 h-4 text-ink-gray-4" />
                </button>
              </template>
              
              <template #item-prefix="{ item }">
                <Icon :icon="categoryIcon(item.value)" class="w-4 h-4 text-ink-gray-5" />
              </template>
              
              <template #item-suffix="{ item }">
                <span class="text-xs text-ink-gray-4 ml-6">{{ item.count }}</span>
              </template>
            </Dropdown>
          </div>

          <!-- Desktop Sidebar -->
          <nav class="hidden lg:flex flex-col space-y-0.5" role="navigation" aria-label="App categories">
            <button
              v-for="cat in displayCategories"
              :key="cat.name"
              @click="selected = cat.name"
              class="w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-5 transition-colors duration-200"
              :class="selected === cat.name ? 'bg-surface-gray-2 text-ink-gray-9 font-medium' : 'text-ink-gray-6 hover:bg-surface-gray-2'"
            >
              <div class="flex items-center gap-2.5">
                <Icon :icon="categoryIcon(cat.name)" class="w-4 h-4" :class="selected === cat.name ? 'text-ink-gray-9' : 'text-ink-gray-5'" />
                <span>{{ cat.name }}</span>
              </div>
              <span class="text-xs" :class="selected === cat.name ? 'text-ink-gray-9 font-medium' : 'text-ink-gray-4'">{{ cat.count }}</span>
            </button>
          </nav>
        </div>
      </aside>

      <!-- Apps area -->
      <main class="lg:col-span-3" aria-label="Apps in category">
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-surface-gray-2 h-40 rounded-6" />
        </div>

        <template v-else-if="activeCategory">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2">
              <Icon :icon="categoryIcon(activeCategory.name)" class="w-6 h-6 text-ink-gray-8" />
              <h2 class="text-lg-semibold text-ink-gray-9">{{ activeCategory.name }}</h2>
            </div>
            <Badge size="lg" theme="gray" :label="`${activeCategory.count} app${activeCategory.count !== 1 ? 's' : ''}`" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AppCard v-for="app in activeCategory.apps" :key="app.slug" :app="app">
              <template #footer>
                <Badge v-for="v in app.frappe_versions" :key="v" theme="gray" :label="formatFrappeVersionBadge(v)" class="font-mono" />
                <span class="ml-auto text-xs text-ink-gray-3">{{ app.license }}</span>
              </template>
            </AppCard>
          </div>
        </template>

        <div v-else class="flex flex-col items-center py-20 text-center text-ink-gray-4">
          <Icon icon="lucide-grid" class="w-8 h-8 text-ink-gray-3 mb-3" />
          <p>Select a category to browse apps</p>
        </div>
      </main>
    </div>
  </div>
</template>
