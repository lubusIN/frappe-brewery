<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { FeatherIcon } from 'frappe-ui'
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
const activeCategory = computed<CategoryEntry | undefined>(() =>
  selected.value ? allCategories.value.find(c => c.name === selected.value) : undefined
)

onMounted(async () => {
  try {
    data.value = await fetchCategories()
    if (!selected.value && allCategories.value.length) {
      selected.value = allCategories.value[0].name
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
          <div v-for="i in 8" :key="i" class="skeleton h-10 rounded-lg" />
        </div>
        <nav v-else class="space-y-0.5" role="navigation" aria-label="App categories">
          <button
            v-for="cat in allCategories"
            :key="cat.name"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left"
            :class="selected === cat.name
              ? 'bg-surface-gray-3 text-ink-gray-9'
              : 'text-ink-gray-5 hover:text-ink-gray-8 hover:bg-surface-gray-1'"
            :aria-pressed="selected === cat.name"
            @click="selected = cat.name"
          >
            <div class="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              :class="selected === cat.name ? 'bg-surface-white border border-outline-gray-2' : 'bg-surface-gray-2'">
              <FeatherIcon :name="CATEGORY_ICONS[cat.name] ?? 'box'" class="w-3.5 h-3.5" :class="selected === cat.name ? 'text-ink-gray-7' : 'text-ink-gray-4'" />
            </div>
            <span class="flex-1 truncate">{{ cat.name }}</span>
            <span class="text-xs text-ink-gray-3 tabular-nums">{{ cat.count }}</span>
          </button>
        </nav>
      </aside>

      <!-- Apps area -->
      <main class="lg:col-span-3" aria-label="Apps in category">
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="skeleton h-40 rounded-xl" />
        </div>

        <template v-else-if="activeCategory">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-surface-gray-2 flex items-center justify-center">
                <FeatherIcon :name="CATEGORY_ICONS[activeCategory.name] ?? 'box'" class="w-4 h-4 text-ink-gray-6" />
              </div>
              <h2 class="text-lg font-semibold text-ink-gray-9">{{ activeCategory.name }}</h2>
            </div>
            <span class="text-sm text-ink-gray-4 bg-surface-gray-2 border border-outline-gray-1 px-3 py-1 rounded-full">
              {{ activeCategory.count }} app{{ activeCategory.count !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <RouterLink
              v-for="app in activeCategory.apps"
              :key="app.slug"
              :to="`/apps/${app.slug}`"
              class="group flex flex-col gap-3 p-5 rounded-xl border border-outline-gray-1 bg-surface-white hover:border-outline-gray-3 hover:shadow-sm transition-all duration-150"
              :aria-label="`View ${app.title}`"
            >
              <div class="flex items-start justify-between">
                <div class="w-10 h-10 rounded-lg bg-surface-gray-2 border border-outline-gray-1 overflow-hidden flex items-center justify-center">
                  <img v-if="app.icon" :src="app.icon" :alt="app.title" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
                  <span v-else class="text-lg font-bold text-ink-gray-4">{{ app.title[0] }}</span>
                </div>
                <span v-if="app.verified" class="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                  <FeatherIcon name="check" class="w-3 h-3" />
                </span>
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-ink-gray-9 group-hover:text-ink-blue-3 transition-colors">{{ app.title }}</h3>
                <p class="text-xs text-ink-gray-4 mt-1 leading-relaxed line-clamp-2">{{ app.description }}</p>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-outline-gray-1 mt-auto">
                <span v-for="v in app.frappe_versions" :key="v" class="text-xs text-ink-gray-3 bg-surface-gray-1 border border-outline-gray-1 px-2 py-0.5 rounded-full font-mono">v{{ v }}</span>
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
