<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { FeatherIcon, FormControl, Button, Badge, Avatar } from 'frappe-ui'
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

const versionOptions = [
  { label: 'All versions', value: '' },
  ...FRAPPE_VERSIONS.map(v => ({ label: `Frappe ${v}`, value: v }))
]

const categoryOptions = [
  { label: 'All categories', value: '' },
  ...CATEGORIES.map(c => ({ label: c, value: c }))
]

const licenseOptions = [
  { label: 'All licenses', value: '' },
  ...LICENSES.map(l => ({ label: l, value: l }))
]

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
          <FormControl
            type="text"
            label="Search"
            v-model="searchQuery"
            placeholder="Search apps…"
          >
            <template #prefix>
              <FeatherIcon name="search" class="w-3.5 h-3.5 text-ink-gray-4" />
            </template>
          </FormControl>

          <!-- Frappe Version -->
          <FormControl
            type="select"
            label="Frappe Version"
            :options="versionOptions"
            v-model="selectedVersion"
          />

          <!-- Category -->
          <FormControl
            type="select"
            label="Category"
            :options="categoryOptions"
            v-model="selectedCategory"
          />

          <!-- License -->
          <FormControl
            type="select"
            label="License"
            :options="licenseOptions"
            v-model="selectedLicense"
          />

          <!-- Verified -->
          <FormControl
            type="checkbox"
            label="Verified only"
            v-model="showVerifiedOnly"
          />

          <!-- Clear -->
          <Button
            v-if="hasFilters"
            class="w-full mt-2"
            variant="outline"
            @click="resetFilters"
          >
            Clear filters
          </Button>
        </div>
      </aside>

      <!-- ── Grid ── -->
      <main class="flex-1 min-w-0" aria-label="App listing">

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-surface-gray-2 h-44 rounded-xl" />
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
          <Button variant="ghost" class="mt-4" @click="resetFilters">Clear filters</Button>
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
              <Avatar shape="square" size="2xl" :image="app.icon" :label="app.title" />
              <div class="flex gap-1.5 flex-wrap">
                <Badge v-if="app.verified" theme="green" label="Verified">
                  <template #prefix><FeatherIcon name="check" class="w-3 h-3" /></template>
                </Badge>
                <Badge v-if="app.status !== 'active'" theme="gray" :label="app.status" />
              </div>
            </div>

            <div class="flex-1">
              <h3 class="text-sm font-semibold text-ink-gray-9 group-hover:text-ink-blue-3 transition-colors">{{ app.title }}</h3>
              <p class="text-xs text-ink-gray-4 mt-1 leading-relaxed line-clamp-3">{{ app.description }}</p>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap mt-auto pt-1 border-t border-outline-gray-1">
              <Badge v-for="cat in app.categories.slice(0, 2)" :key="cat" theme="blue" :label="cat" />
              <span class="text-xs text-ink-gray-3 ml-auto font-mono">{{ app.license }}</span>
            </div>
          </RouterLink>
        </div>
      </main>
    </div>
  </div>
</template>
