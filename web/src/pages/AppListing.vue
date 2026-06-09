<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchApps } from '../api'
import type { AppSummary, IndexResponse } from '../types'

const route = useRoute()
const router = useRouter()

const allApps = ref<AppSummary[]>([])
const loading = ref(true)
const error = ref('')

// Filters
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
const LICENSES = ['MIT', 'GPL-3.0', 'AGPL-3.0', 'Apache-2.0', 'LGPL-3.0', 'other']

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
  if (selectedVersion.value) {
    apps = apps.filter(a => a.frappe_versions.includes(selectedVersion.value))
  }
  if (selectedCategory.value) {
    apps = apps.filter(a => a.categories.includes(selectedCategory.value))
  }
  if (selectedLicense.value) {
    apps = apps.filter(a => a.license === selectedLicense.value)
  }
  if (showVerifiedOnly.value) {
    apps = apps.filter(a => a.verified)
  }
  return apps
})

function resetFilters() {
  searchQuery.value = ''
  selectedVersion.value = ''
  selectedCategory.value = ''
  selectedLicense.value = ''
  showVerifiedOnly.value = false
}

// Sync filters to URL
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
    // Apply URL filters
    if (route.query.category) selectedCategory.value = route.query.category as string
  } catch (e) {
    error.value = 'Failed to load apps. Please try again.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="app-listing">
    <!-- Header -->
    <section class="listing-header">
      <div class="container">
        <h1 class="section-title">Browse Apps</h1>
        <p class="listing-subtitle">{{ filteredApps.length }} of {{ allApps.length }} apps</p>
      </div>
    </section>

    <div class="container listing-layout">
      <!-- ── Sidebar Filters ── -->
      <aside class="filters-sidebar" aria-label="Filter apps">
        <div class="filter-section">
          <h2 class="filter-heading">Search</h2>
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="app-search"
              v-model="searchQuery"
              type="search"
              placeholder="Search apps…"
              class="input search-input"
              aria-label="Search apps"
            />
          </div>
        </div>

        <div class="filter-section">
          <h2 class="filter-heading">Frappe Version</h2>
          <select id="version-filter" v-model="selectedVersion" class="select" aria-label="Filter by Frappe version">
            <option value="">All versions</option>
            <option v-for="v in FRAPPE_VERSIONS" :key="v" :value="v">Frappe {{ v }}</option>
          </select>
        </div>

        <div class="filter-section">
          <h2 class="filter-heading">Category</h2>
          <select id="category-filter" v-model="selectedCategory" class="select" aria-label="Filter by category">
            <option value="">All categories</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="filter-section">
          <h2 class="filter-heading">License</h2>
          <select id="license-filter" v-model="selectedLicense" class="select" aria-label="Filter by license">
            <option value="">All licenses</option>
            <option v-for="lic in LICENSES" :key="lic" :value="lic">{{ lic }}</option>
          </select>
        </div>

        <div class="filter-section">
          <label class="checkbox-label" for="verified-filter">
            <input
              id="verified-filter"
              v-model="showVerifiedOnly"
              type="checkbox"
              class="checkbox"
            />
            <span>Verified only</span>
          </label>
        </div>

        <button
          v-if="searchQuery || selectedVersion || selectedCategory || selectedLicense || showVerifiedOnly"
          class="btn btn-ghost btn-sm reset-btn"
          @click="resetFilters"
        >
          Clear filters
        </button>
      </aside>

      <!-- ── App Grid ── -->
      <main class="apps-main" aria-label="App listing">
        <!-- Loading skeletons -->
        <div v-if="loading" class="apps-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="empty-state" role="alert">
          <p class="empty-icon">⚠️</p>
          <p class="empty-text">{{ error }}</p>
        </div>

        <!-- No results -->
        <div v-else-if="filteredApps.length === 0" class="empty-state">
          <p class="empty-icon">🔍</p>
          <p class="empty-text">No apps match your filters.</p>
          <button class="btn btn-ghost btn-sm" @click="resetFilters">Clear filters</button>
        </div>

        <!-- Results -->
        <div v-else class="apps-grid">
          <RouterLink
            v-for="app in filteredApps"
            :key="app.slug"
            :to="`/apps/${app.slug}`"
            class="app-card card"
            :aria-label="`View ${app.title}`"
          >
            <div class="app-card-top">
              <div class="app-icon">
                <img
                  v-if="app.icon"
                  :src="app.icon"
                  :alt="app.title"
                  @error="($event.target as HTMLImageElement).style.display='none'"
                />
                <span v-else class="app-icon-fallback">{{ app.title[0] }}</span>
              </div>
              <div class="app-badges">
                <span v-if="app.verified" class="badge badge-green">✓ Verified</span>
                <span v-if="app.status !== 'active'" class="badge badge-gray">{{ app.status }}</span>
              </div>
            </div>

            <h3 class="app-title">{{ app.title }}</h3>
            <p class="app-desc">{{ app.description }}</p>

            <div class="app-footer">
              <div class="app-cats">
                <span v-for="cat in app.categories.slice(0, 2)" :key="cat" class="badge badge-blue">{{ cat }}</span>
              </div>
              <span class="app-license tag">{{ app.license }}</span>
            </div>
            <div class="app-versions">
              <span v-for="v in app.frappe_versions" :key="v" class="tag">v{{ v }}</span>
            </div>
          </RouterLink>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-listing { padding-bottom: 80px; }

.listing-header {
  padding: 48px 0 32px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 40px;
}
.listing-subtitle { color: var(--text-3); margin-top: 4px; font-size: 14px; }

.listing-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  align-items: start;
}

/* Filters */
.filters-sidebar {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.filter-section { display: flex; flex-direction: column; gap: 10px; }
.filter-heading { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }

.search-wrap { position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
.search-input { padding-left: 36px; }

.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: var(--text-2); }
.checkbox {
  width: 16px; height: 16px;
  accent-color: var(--brand-500);
  cursor: pointer;
}
.reset-btn { width: 100%; justify-content: center; }

/* Grid */
.apps-main {}
.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.app-card { display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
.app-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.app-icon {
  width: 44px; height: 44px;
  border-radius: var(--r-md);
  background: var(--bg-3);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.app-icon img { width: 100%; height: 100%; object-fit: cover; }
.app-icon-fallback { font-size: 20px; font-weight: 700; color: var(--brand-400); }
.app-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.app-title { font-size: 15px; font-weight: 700; }
.app-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.app-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: auto; }
.app-cats { display: flex; gap: 6px; flex-wrap: wrap; }
.app-versions { display: flex; gap: 4px; flex-wrap: wrap; }

/* Skeleton */
.skeleton-card {
  height: 200px;
  border-radius: var(--r-lg);
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-3) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; text-align: center; }
.empty-icon { font-size: 40px; }
.empty-text { color: var(--text-2); font-size: 15px; }

@media (max-width: 900px) {
  .listing-layout { grid-template-columns: 1fr; }
  .filters-sidebar { position: static; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
}
@media (max-width: 600px) {
  .filters-sidebar { grid-template-columns: 1fr; }
}
</style>
