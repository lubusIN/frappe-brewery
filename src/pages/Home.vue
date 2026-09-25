<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon, Badge, Button } from 'frappe-ui'
import { fetchStats, fetchApps } from '../api'
import { CATEGORY_ICONS, formatFrappeVersionBadge } from '../constants'
import AppCard from '../components/AppCard.vue'
import type { App } from '../types'

const featuredApps = ref<App[]>([])
const loading = ref(true)

const categories = [
  'Accounting & Finance', 'Human Resources', 'E-Commerce & Retail', 'Business & Operations',
  'Industry Specific', 'Developer Tools', 'CRM & Support', 'Analytics & AI',
].map(name => ({ name, icon: CATEGORY_ICONS[name] || 'lucide-box' }))

const apiEndpoints = [
  { path: '/index/apps.json' },
  { path: '/index/frappe-15.json' },
  { path: '/apps/erpnext.json' },
  { path: '/api/apps?category=CRM' },
  { path: '/api/apps/:slug' },
]

onMounted(async () => {
  try {
    const [, a] = await Promise.all([fetchStats(), fetchApps()])
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
          <h1 class="text-4xl-bold sm:text-5xl text-ink-gray-9 tracking-tight leading-tight">
            Frappe Brewery
          </h1>
          <p class="mt-3 text-base text-ink-gray-5 leading-relaxed max-w-xl">
            Discover, share, and install apps from a community brewery with open data, GitHub-based submissions, and APIs for Frappe Local, Bench, and beyond.
          </p>
          <div class="flex flex-wrap justify-center gap-3 mt-6">
            <Button
              :route="{ path: '/submit' }"
              size="md"
              variant="outline"
              theme="gray"
            >
              Submit
            </Button>
            <Button
              :route="{ path: '/apps' }"
              size="md"
              variant="solid"
              theme="gray"
              icon-right="lucide-arrow-right"
            >
              Browse
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Featured Apps ── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="text-xs-semibold uppercase tracking-widest text-ink-gray-4 mb-1">Brewery</p>
          <h2 class="text-2xl-semibold text-ink-gray-9">Featured Apps</h2>
        </div>
        <Button :route="{ path: '/apps' }" variant="ghost" theme="gray" icon-right="lucide-arrow-right">
          View all
        </Button>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="animate-pulse bg-surface-gray-2 h-44 rounded-6" />
      </div>

      <!-- Cards -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppCard v-for="app in featuredApps" :key="app.slug" :app="app">
          <template #footer>
            <Badge v-for="cat in app.categories.slice(0, 1)" :key="cat" theme="gray" :label="cat" />
            <span class="text-xs text-ink-gray-3 font-mono ml-auto">{{ app.frappe_versions.map(formatFrappeVersionBadge).join(', ') }}</span>
          </template>
        </AppCard>
      </div>
    </section>

    <!-- ── Divider ── -->
    <div class="border-t border-outline-gray-1" />

    <!-- ── Categories ── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div class="mb-6 flex items-end justify-between">
        <div>
          <p class="text-xs-semibold uppercase tracking-widest text-ink-gray-4 mb-1">Brewery</p>
          <h2 class="text-2xl-semibold text-ink-gray-9">Featured Categories</h2>
        </div>
        <Button :route="{ path: '/categories' }" variant="ghost" theme="gray" icon-right="lucide-arrow-right">
          View all
        </Button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <RouterLink
          v-for="cat in categories"
          :key="cat.name"
          :to="`/categories?cat=${encodeURIComponent(cat.name)}`"
          class="flex flex-col items-center gap-2.5 py-5 px-3 rounded-6 border border-outline-gray-1 bg-surface-base hover:border-outline-gray-4 transition-colors duration-200 text-center group"
        >
          <Icon :icon="cat.icon" class="w-6 h-6 text-ink-gray-8 mb-1" />
          <span class="text-xs-medium text-ink-gray-6 leading-tight">{{ cat.name }}</span>
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
            <p class="text-xs-semibold uppercase tracking-widest text-ink-gray-4 mb-1">Static JSON API</p>
            <h2 class="text-3xl-bold text-ink-gray-9 leading-snug">Ready for your tools</h2>
            <p class="mt-3 text-ink-gray-5 leading-relaxed">
              Frappe Local, hosting platforms, and community tools can consume the brewery directly. No auth, no rate limits, no database.
            </p>
            <Button :route="{ path: '/docs' }" variant="outline" theme="gray" class="mt-6" icon-left="lucide-book">
              API Docs
            </Button>
          </div>
          <div class="rounded-6 border border-outline-gray-2 bg-surface-base overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-outline-gray-1 bg-surface-gray-1">
              <span class="w-3 h-3 rounded-full bg-red-300"></span>
              <span class="w-3 h-3 rounded-full bg-yellow-300"></span>
              <span class="w-3 h-3 rounded-full bg-green-300"></span>
              <span class="text-xs text-ink-gray-3 ml-2 font-mono">API endpoints</span>
            </div>
            <div class="p-5 font-mono text-xs space-y-3">
              <div v-for="ep in apiEndpoints" :key="ep.path" class="flex items-center gap-3">
                <span class="shrink-0 text-ink-blue-4 font-semibold">GET</span>
                <span class="text-ink-gray-6">{{ ep.path }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
