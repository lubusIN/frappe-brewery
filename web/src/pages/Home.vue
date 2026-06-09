<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { FeatherIcon, Badge, Button, Avatar } from 'frappe-ui'
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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div class="max-w-3xl mx-auto flex flex-col items-center text-center">
          <h1 class="text-3xl sm:text-4xl font-bold text-ink-gray-9 tracking-tight leading-tight">
            Frappe Brewery
          </h1>
          <p class="mt-3 text-base text-ink-gray-5 leading-relaxed max-w-xl">
            Discover, share, and install apps from a community-maintained registry with open data, GitHub-based submissions, and APIs for Frappe Local, Bench, and beyond.
          </p>
          <div class="flex flex-wrap justify-center gap-3 mt-6">
            <Button
              :route="{ path: '/submit' }"
              size="md"
              variant="outline"
              theme="gray"
            >
              Submit Your App
            </Button>
            <Button
              :route="{ path: '/apps' }"
              size="md"
              variant="solid"
              theme="gray"
              icon-right="arrow-right"
            >
              Browse Apps
            </Button>
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
        <Button :route="{ path: '/apps' }" variant="ghost" theme="gray" icon-right="arrow-right">
          View all
        </Button>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="animate-pulse bg-surface-gray-2 h-44 rounded-xl" />
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
            <Avatar shape="square" size="2xl" :image="app.icon" :label="app.title" />
            <Badge v-if="app.verified" theme="green" label="Verified">
              <template #prefix><FeatherIcon name="check" class="w-3 h-3" /></template>
            </Badge>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-ink-gray-9 group-hover:text-ink-blue-3 transition-colors">{{ app.title }}</h3>
            <p class="text-xs text-ink-gray-4 mt-1 leading-relaxed line-clamp-2">{{ app.description }}</p>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap mt-auto">
            <Badge v-for="cat in app.categories.slice(0, 1)" :key="cat" theme="blue" :label="cat" />
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
          <Avatar shape="square" size="xl">
            <FeatherIcon :name="cat.icon" class="w-4 h-4 text-ink-gray-6" />
          </Avatar>
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
            <Button :route="{ path: '/docs' }" variant="outline" theme="gray" class="mt-6" icon-left="book">
              View API Docs
            </Button>
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
