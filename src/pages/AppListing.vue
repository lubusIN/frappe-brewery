<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FeatherIcon, FormControl, Button, Badge, Switch } from 'frappe-ui'
import { fetchApps } from '../api'
import AppCard from '../components/AppCard.vue'
import { CATEGORIES, FRAPPE_VERSIONS, LICENSES, formatFrappeVersion } from '../constants'
import type { App, IndexResponse } from '../types'

const route = useRoute()
const router = useRouter()

const allApps = ref<App[]>([])
const loading = ref(true)
const error = ref('')

const searchQuery = ref((route.query.q as string) || '')
const selectedVersion = ref((route.query.version as string) || '')
const selectedCategory = ref((route.query.category as string) || '')

const selectedLicense = ref((route.query.license as string) || '')
const showVerifiedOnly = ref(route.query.verified === 'true')


const versionOptions = [
  { label: 'All versions', value: '' },
  ...FRAPPE_VERSIONS.map(v => ({ label: `Frappe ${formatFrappeVersion(v)}`, value: v }))
]

const categoryOptions = computed(() => {
  const categoryCounts = new Map<string, number>()
  for (const app of allApps.value) {
    if (app.categories) {
      for (const cat of app.categories) {
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
      }
    }
  }
  const sortedActive = CATEGORIES.filter(c => categoryCounts.has(c))
  return [
    { label: 'All categories', value: '', description: String(allApps.value.length) },
    ...sortedActive.map(c => ({ label: c, value: c, description: String(categoryCounts.get(c)) }))
  ]
})

const categoryModel = computed({
  get: () => categoryOptions.value?.find(o => o.value === selectedCategory.value) || categoryOptions.value?.[0],
  set: (val: any) => {
    selectedCategory.value = val?.value || ''
  }
})

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
  if (showVerifiedOnly.value) apps = apps.filter(a => a.meta?.verified)
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
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-ink-gray-9">Apps</h1>
      <p class="text-base text-ink-gray-5 mt-2">
        Extend the functionality of your Frappe sites by integrating apps that suit your needs. Seamlessly install in just a few steps.
      </p>
    </div>

    <!-- Filters Topbar -->
    <div class="flex flex-col md:flex-row gap-3 mb-4 w-full">
      <div class="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto shrink-0">
        <FormControl
          type="autocomplete"
          :options="categoryOptions"
          v-model="categoryModel"
          placeholder="All categories"
          class="w-full md:w-auto [&_button]:w-full [&_select]:w-full"
        />
        <FormControl
          type="select"
          :options="versionOptions"
          v-model="selectedVersion"
          class="w-full md:w-auto [&_button]:w-full [&_select]:w-full"
        />
        <FormControl
          type="select"
          :options="licenseOptions"
          v-model="selectedLicense"
          class="w-full md:w-auto [&_button]:w-full [&_select]:w-full"
        />
        <div class="flex items-center gap-2 px-2 shrink-0">
          <Switch v-model="showVerifiedOnly" />
          <span class="text-sm text-ink-gray-7">Verified</span>
        </div>
      </div>
      <FormControl
        type="text"
        v-model="searchQuery"
        placeholder="Search for an app"
        class="w-full md:flex-1"
      >
        <template #prefix>
          <FeatherIcon name="search" class="w-4 h-4 text-ink-gray-4" />
        </template>
      </FormControl>
    </div>

    <!-- Showing apps count -->
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-ink-gray-5">
        Showing {{ filteredApps.length }} apps
      </p>
      <Button
        v-if="hasFilters"
        variant="ghost"
        size="sm"
        theme="gray"
        @click="resetFilters"
      >
        Clear filters
      </Button>
    </div>

    <!-- Grid -->
    <main aria-label="App listing">
      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="i in 8" :key="i" class="animate-pulse bg-surface-gray-2 h-44 rounded-lg" />
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
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AppCard v-for="app in filteredApps" :key="app.slug" :app="app">
          <template #badges>
            <Badge v-if="app.meta?.status !== 'active'" theme="gray" :label="app.meta?.status || 'active'" />
          </template>
          <template #footer>
            <Badge v-for="cat in app.categories.slice(0, 2)" :key="cat" theme="gray" :label="cat" />
            <span class="text-xs text-ink-gray-3 ml-auto font-mono">{{ app.license }}</span>
          </template>
        </AppCard>
      </div>
    </main>
  </div>
</template>
