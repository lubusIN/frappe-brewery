<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { FeatherIcon } from 'frappe-ui'
import { fetchStats, fetchApps } from '../api'
import type { StatsResponse, AppSummary } from '../types'

const stats = ref<StatsResponse | null>(null)
const featuredApps = ref<AppSummary[]>([])
const loading = ref(true)

const categories = [
  { name: 'CRM',            icon: 'users' },
  { name: 'HR',             icon: 'briefcase' },
  { name: 'Accounting',     icon: 'bar-chart-2' },
  { name: 'Manufacturing',  icon: 'settings' },
  { name: 'Reports',        icon: 'trending-up' },
  { name: 'AI',             icon: 'cpu' },
  { name: 'Integration',    icon: 'link' },
  { name: 'Developer Tools',icon: 'code' },
]

onMounted(async () => {
  try {
    const [s, a] = await Promise.all([fetchStats(), fetchApps()])
    stats.value = s
    featuredApps.value = a.apps.slice(0, 4)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- ── Hero ── -->
    <section class="border-b border-outline-gray-1 bg-surface-gray-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div class="max-w-2xl">
          <div class="flex items-center gap-2 mb-4">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-outline-gray-2 text-xs font-medium text-ink-gray-5">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Open Source · Community Maintained
            </span>
          </div>
          <h1 class="text-4xl sm:text-5xl font-bold text-ink-gray-9 tracking-tight leading-tight">
            Frappe App Registry
          </h1>
          <p class="mt-4 text-lg text-ink-gray-5 leading-relaxed max-w-xl">
            Discover, install, and share Frappe apps. Open data, GitHub-based submissions, static JSON API — ready for Frappe Local and beyond.
          </p>
          <div class="flex flex-wrap gap-3 mt-8">
            <RouterLink to="/apps" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-gray-9 text-white text-sm font-medium hover:bg-ink-gray-7 transition-colors">
              <FeatherIcon name="search" class="w-4 h-4" />
              Browse Apps
            </RouterLink>
            <RouterLink to="/submit" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-gray-2 text-ink-gray-7 text-sm font-medium hover:bg-surface-gray-2 transition-colors">
              Submit Your App
              <FeatherIcon name="arrow-right" class="w-4 h-4" />
            </RouterLink>
          </div>
        </div>

        <!-- Stats pills -->
        <div v-if="stats" class="flex flex-wrap gap-3 mt-10">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-white border border-outline-gray-2">
            <span class="text-xl font-bold text-ink-gray-9">{{ stats.total_apps }}</span>
            <span class="text-sm text-ink-gray-4">Apps</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-white border border-outline-gray-2">
            <span class="text-xl font-bold text-ink-gray-9">{{ stats.total_categories }}</span>
            <span class="text-sm text-ink-gray-4">Categories</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-white border border-outline-gray-2">
            <span class="text-xl font-bold text-ink-gray-9">3</span>
            <span class="text-sm text-ink-gray-4">Frappe Versions</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Featured Apps ── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-ink-gray-3 mb-1">Registry</p>
          <h2 class="text-xl font-semibold text-ink-gray-9">Featured Apps</h2>
        </div>
        <RouterLink to="/apps" class="text-sm text-ink-gray-5 hover:text-ink-gray-8 flex items-center gap-1 transition-colors">
          View all <FeatherIcon name="arrow-right" class="w-3.5 h-3.5" />
        </RouterLink>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="skeleton h-44 rounded-xl" />
      </div>

      <!-- Cards -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="app in featuredApps"
          :key="app.slug"
          :to="`/apps/${app.slug}`"
          class="group flex flex-col gap-3 p-5 rounded-xl border border-outline-gray-1 bg-surface-white hover:border-outline-gray-3 hover:shadow-sm transition-all duration-150"
          :aria-label="`View ${app.title}`"
        >
          <div class="flex items-start justify-between">
            <!-- Icon -->
            <div class="w-10 h-10 rounded-lg bg-surface-gray-2 border border-outline-gray-1 overflow-hidden flex items-center justify-center shrink-0">
              <img v-if="app.icon" :src="app.icon" :alt="app.title" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
              <span v-else class="text-lg font-bold text-ink-gray-4">{{ app.title[0] }}</span>
            </div>
            <span v-if="app.verified" class="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
              <FeatherIcon name="check" class="w-3 h-3" />
              Verified
            </span>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-ink-gray-9 group-hover:text-ink-blue-3 transition-colors">{{ app.title }}</h3>
            <p class="text-xs text-ink-gray-4 mt-1 leading-relaxed line-clamp-2">{{ app.description }}</p>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap mt-auto">
            <span v-for="cat in app.categories.slice(0, 1)" :key="cat" class="text-xs font-medium text-ink-blue-2 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{{ cat }}</span>
            <span class="text-xs text-ink-gray-3 font-mono ml-auto">v{{ app.frappe_versions.join(', ') }}</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- ── Divider ── -->
    <div class="border-t border-outline-gray-1" />

    <!-- ── Categories ── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div class="mb-6">
        <p class="text-xs font-semibold uppercase tracking-widest text-ink-gray-3 mb-1">Browse by</p>
        <h2 class="text-xl font-semibold text-ink-gray-9">Categories</h2>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <RouterLink
          v-for="cat in categories"
          :key="cat.name"
          :to="`/categories?cat=${encodeURIComponent(cat.name)}`"
          class="flex flex-col items-center gap-2.5 py-5 px-3 rounded-xl border border-outline-gray-1 bg-surface-white hover:border-outline-gray-3 hover:bg-surface-gray-1 transition-all duration-150 text-center group"
        >
          <div class="w-9 h-9 rounded-lg bg-surface-gray-2 flex items-center justify-center group-hover:bg-surface-gray-3 transition-colors">
            <FeatherIcon :name="cat.icon" class="w-4 h-4 text-ink-gray-6" />
          </div>
          <span class="text-xs font-medium text-ink-gray-6 leading-tight">{{ cat.name }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- ── Divider ── -->
    <div class="border-t border-outline-gray-1" />

    <!-- ── API section ── -->
    <section class="bg-surface-gray-1 border-t border-outline-gray-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-ink-gray-3 mb-1">Static JSON API</p>
            <h2 class="text-2xl font-bold text-ink-gray-9 leading-snug">Ready for your tools</h2>
            <p class="mt-3 text-ink-gray-5 leading-relaxed">
              Frappe Local, hosting platforms, and community tools can consume the registry directly. No auth, no rate limits, no database.
            </p>
            <RouterLink to="/docs" class="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg border border-outline-gray-2 bg-surface-white text-ink-gray-7 text-sm font-medium hover:bg-surface-gray-2 transition-colors">
              <FeatherIcon name="book" class="w-4 h-4" />
              View API Docs
            </RouterLink>
          </div>
          <div class="rounded-xl border border-outline-gray-2 bg-surface-white overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-outline-gray-1 bg-surface-gray-1">
              <span class="w-3 h-3 rounded-full bg-red-300"></span>
              <span class="w-3 h-3 rounded-full bg-yellow-300"></span>
              <span class="w-3 h-3 rounded-full bg-green-300"></span>
              <span class="text-xs text-ink-gray-3 ml-2 font-mono">API endpoints</span>
            </div>
            <div class="p-5 font-mono text-xs space-y-3">
              <div v-for="ep in apiEndpoints" :key="ep.path" class="flex items-center gap-3">
                <span class="shrink-0 text-ink-blue-2 font-semibold">GET</span>
                <span class="text-ink-gray-6">{{ ep.path }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      apiEndpoints: [
        { path: '/index/apps.json' },
        { path: '/index/frappe-15.json' },
        { path: '/apps/erpnext.json' },
        { path: '/api/apps?category=CRM' },
        { path: '/api/apps/:slug' },
      ],
    }
  },
}
</script>
