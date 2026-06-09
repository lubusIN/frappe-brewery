<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { FeatherIcon } from 'frappe-ui'
import { fetchApps } from '../api'
import type { AppSummary, IndexResponse } from '../types'

const route = useRoute()
const router = useRouter()

const allApps = ref<AppSummary[]>([])
const loading = ref(true)
const error = ref('')

const searchQuery = ref((route.query.q as string) || '')
const selectedVersion = ref((route.query.version as string) || '')
const selectedCategory = ref((route.query.category as string) || '')
const selectedLicense = ref((route.query.license as string) || '')
const showVerifiedOnly = ref(route.query.verified === 'true')

const FRAPPE_VERSIONS = ['14', '15', '16']
const CATEGORIES = [
  'CRM', 'HR', 'Accounting', 'Manufacturing', 'POS',
  'Healthcare', 'Education', 'Integration', 'Payments',
  'Reports', 'Developer Tools', 'AI', 'Utilities',
]
const LICENSES = ['MIT', 'GPL-3.0', 'AGPL-3.0', 'Apache-2.0', 'LGPL-3.0']

const hasFilters = computed(() =>
  searchQuery.value || selectedVersion.value || selectedCategory.value ||
  selectedLicense.value || showVerifiedOnly.value
)

const filteredApps = computed(() => {
  let apps = allApps.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    apps = apps.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags?.some(t => t.toLowerCase().includes(q))
    )
  }
  if (selectedVersion.value) apps = apps.filter(a => a.frappe_versions.includes(selectedVersion.value))
  if (selectedCategory.value) apps = apps.filter(a => a.categories.includes(selectedCategory.value))
  if (selectedLicense.value) apps = apps.filter(a => a.license === selectedLicense.value)
  if (showVerifiedOnly.value) apps = apps.filter(a => a.verified)
  return apps
})

function resetFilters() {
  searchQuery.value = ''
  selectedVersion.value = ''
  selectedCategory.value = ''
  selectedLicense.value = ''
  showVerifiedOnly.value = false
}

watch([searchQuery, selectedVersion, selectedCategory, selectedLicense, showVerifiedOnly], () => {
  router.replace({
    query: {
      ...(searchQuery.value && { q: searchQuery.value }),
      ...(selectedVersion.value && { version: selectedVersion.value }),
      ...(selectedCategory.value && { category: selectedCategory.value }),
      ...(selectedLicense.value && { license: selectedLicense.value }),
      ...(showVerifiedOnly.value && { verified: 'true' }),
    }
  })
})

onMounted(async () => {
  try {
    const data: IndexResponse = await fetchApps()
    allApps.value = data.apps
    if (route.query.category) selectedCategory.value = route.query.category as string
  } catch {
    error.value = 'Failed to load apps.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-ink-gray-9">Apps</h1>
      <p class="text-sm text-ink-gray-4 mt-1">
        {{ filteredApps.length }} of {{ allApps.length }} apps
      </p>
    </div>

    <div class="flex gap-8 items-start">
      <!-- ── Sidebar ── -->
      <aside class="w-56 shrink-0 sticky top-[68px]" aria-label="Filter apps">
        <div class="space-y-5">

          <!-- Search -->
          <div>
            <label for="app-search" class="block text-xs font-semibold text-ink-gray-4 uppercase tracking-widest mb-2">Search</label>
            <div class="relative">
              <FeatherIcon name="search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-gray-3 pointer-events-none" />
              <input
                id="app-search"
                v-model="searchQuery"
                type="search"
                placeholder="Search apps…"
                class="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-outline-gray-2 bg-surface-white text-ink-gray-8 placeholder-ink-gray-3 focus:outline-none focus:ring-1 focus:ring-outline-gray-3 focus:border-outline-gray-3 transition-colors"
                aria-label="Search apps"
              />
            </div>
          </div>

          <!-- Frappe Version -->
          <div>
            <label for="version-filter" class="block text-xs font-semibold text-ink-gray-4 uppercase tracking-widest mb-2">Frappe Version</label>
            <select id="version-filter" v-model="selectedVersion" class="w-full text-sm rounded-lg border border-outline-gray-2 bg-surface-white text-ink-gray-7 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-outline-gray-3 transition-colors appearance-none">
              <option value="">All versions</option>
              <option v-for="v in FRAPPE_VERSIONS" :key="v" :value="v">Frappe {{ v }}</option>
            </select>
          </div>

          <!-- Category -->
          <div>
            <label for="category-filter" class="block text-xs font-semibold text-ink-gray-4 uppercase tracking-widest mb-2">Category</label>
            <select id="category-filter" v-model="selectedCategory" class="w-full text-sm rounded-lg border border-outline-gray-2 bg-surface-white text-ink-gray-7 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-outline-gray-3 transition-colors appearance-none">
              <option value="">All categories</option>
              <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <!-- License -->
          <div>
            <label for="license-filter" class="block text-xs font-semibold text-ink-gray-4 uppercase tracking-widest mb-2">License</label>
            <select id="license-filter" v-model="selectedLicense" class="w-full text-sm rounded-lg border border-outline-gray-2 bg-surface-white text-ink-gray-7 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-outline-gray-3 transition-colors appearance-none">
              <option value="">All licenses</option>
              <option v-for="lic in LICENSES" :key="lic" :value="lic">{{ lic }}</option>
            </select>
          </div>

          <!-- Verified -->
          <div class="flex items-center gap-2">
            <input
              id="verified-filter"
              v-model="showVerifiedOnly"
              type="checkbox"
              class="rounded border-outline-gray-2 text-ink-blue-2 focus:ring-outline-gray-3 w-4 h-4 cursor-pointer"
            />
            <label for="verified-filter" class="text-sm text-ink-gray-6 cursor-pointer select-none">Verified only</label>
          </div>

          <!-- Clear -->
          <button
            v-if="hasFilters"
            class="w-full text-sm text-ink-gray-4 hover:text-ink-gray-7 py-1.5 border border-outline-gray-2 rounded-lg hover:bg-surface-gray-1 transition-colors"
            @click="resetFilters"
          >
            Clear filters
          </button>
        </div>
      </aside>

      <!-- ── Grid ── -->
      <main class="flex-1 min-w-0" aria-label="App listing">

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="skeleton h-44 rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center py-20 text-center" role="alert">
          <FeatherIcon name="alert-circle" class="w-8 h-8 text-ink-gray-3 mb-3" />
          <p class="text-ink-gray-5">{{ error }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredApps.length === 0" class="flex flex-col items-center py-20 text-center">
          <FeatherIcon name="search" class="w-8 h-8 text-ink-gray-3 mb-3" />
          <p class="text-ink-gray-5 font-medium">No apps match your filters</p>
          <button class="mt-4 text-sm text-ink-gray-4 hover:text-ink-gray-7 underline" @click="resetFilters">Clear filters</button>
        </div>

        <!-- Apps -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <RouterLink
            v-for="app in filteredApps"
            :key="app.slug"
            :to="`/apps/${app.slug}`"
            class="group flex flex-col gap-3 p-5 rounded-xl border border-outline-gray-1 bg-surface-white hover:border-outline-gray-3 hover:shadow-sm transition-all duration-150"
            :aria-label="`View ${app.title}`"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="w-10 h-10 rounded-lg bg-surface-gray-2 border border-outline-gray-1 overflow-hidden flex items-center justify-center shrink-0">
                <img v-if="app.icon" :src="app.icon" :alt="app.title" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
                <span v-else class="text-lg font-bold text-ink-gray-4">{{ app.title[0] }}</span>
              </div>
              <div class="flex gap-1.5 flex-wrap">
                <span v-if="app.verified" class="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                  <FeatherIcon name="check" class="w-3 h-3" />Verified
                </span>
                <span v-if="app.status !== 'active'" class="text-xs font-medium text-ink-gray-4 bg-surface-gray-2 border border-outline-gray-1 px-1.5 py-0.5 rounded-full">{{ app.status }}</span>
              </div>
            </div>

            <div class="flex-1">
              <h3 class="text-sm font-semibold text-ink-gray-9 group-hover:text-ink-blue-3 transition-colors">{{ app.title }}</h3>
              <p class="text-xs text-ink-gray-4 mt-1 leading-relaxed line-clamp-3">{{ app.description }}</p>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap mt-auto pt-1 border-t border-outline-gray-1">
              <span v-for="cat in app.categories.slice(0, 2)" :key="cat" class="text-xs font-medium text-ink-blue-2 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{{ cat }}</span>
              <span class="text-xs text-ink-gray-3 ml-auto font-mono">{{ app.license }}</span>
            </div>
          </RouterLink>
        </div>
      </main>
    </div>
  </div>
</template>
