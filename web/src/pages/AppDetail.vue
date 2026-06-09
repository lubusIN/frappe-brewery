<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { FeatherIcon, Badge, Button } from 'frappe-ui'
import { fetchApp } from '../api'
import type { App } from '../types'

const route = useRoute()
const app = ref<App | null>(null)
const loading = ref(true)
const error = ref('')
const copied = ref(false)
const imageError = ref(false)

watch(() => app.value?.media?.icon, () => {
  imageError.value = false
})

async function loadApp(slug: string) {
  loading.value = true
  error.value = ''
  try {
    app.value = await fetchApp(slug)
  } catch {
    error.value = `App "${slug}" not found.`
  } finally {
    loading.value = false
  }
}

async function copyCommand() {
  if (!app.value) return
  await navigator.clipboard.writeText(app.value.install.command)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(() => loadApp(route.params.slug as string))
watch(() => route.params.slug, s => s && loadApp(s as string))
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse bg-surface-gray-2 h-10 w-64 rounded-lg" />
      <div class="animate-pulse bg-surface-gray-2 h-32 rounded-lg" />
      <div class="animate-pulse bg-surface-gray-2 h-48 rounded-lg" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center py-24 text-center" role="alert">
      <FeatherIcon name="alert-circle" class="w-10 h-10 text-ink-gray-3 mb-4" />
      <p class="text-ink-gray-5 font-medium">{{ error }}</p>
      <RouterLink to="/apps" class="mt-4 text-sm text-ink-blue-2 hover:underline">← Back to apps</RouterLink>
    </div>

    <!-- Content -->
    <template v-else-if="app">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-1.5 text-sm text-ink-gray-4 mb-6" aria-label="Breadcrumb">
        <RouterLink to="/apps" class="hover:text-ink-gray-7 transition-colors">Apps</RouterLink>
        <FeatherIcon name="chevron-right" class="w-3.5 h-3.5 text-ink-gray-3" />
        <span class="text-ink-gray-7 font-medium">{{ app.title }}</span>
      </nav>

      <!-- Hero bar -->
      <div class="flex flex-col sm:flex-row sm:items-start gap-5 pb-7 border-b border-outline-gray-1">
        <div class="w-16 h-16 rounded-lg bg-surface-gray-2 border border-outline-gray-1 overflow-hidden flex items-center justify-center shrink-0">
          <img v-if="app.media?.icon && !imageError" :src="app.media.icon" :alt="app.title" class="w-full h-full object-cover" @error="imageError = true" />
          <span v-else class="text-2xl font-bold text-ink-gray-4">{{ app.title[0] }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start gap-3 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <Badge v-if="app.meta?.verified" theme="green" label="Verified">
                  <template #prefix><FeatherIcon name="check-circle" class="w-3 h-3" /></template>
                </Badge>
                <Badge theme="gray" :label="app.license" />
                <Badge v-if="app.meta?.status && app.meta.status !== 'active'" theme="gray" :label="app.meta.status" />
              </div>
              <h1 class="text-2xl font-bold text-ink-gray-9 leading-tight">{{ app.title }}</h1>
              <p class="text-sm text-ink-gray-4 mt-0.5 font-mono">{{ app.name }}</p>
              <p class="text-sm text-ink-gray-6 mt-3 leading-relaxed max-w-2xl">{{ app.description }}</p>
            </div>
            <!-- Action buttons -->
            <div class="flex gap-2 shrink-0 flex-wrap">
              <Button :link="app.repository" variant="outline" icon-left="github">GitHub</Button>
              <Button v-if="app.links?.docs" :link="app.links.docs" variant="outline" icon-left="book-open">Docs</Button>
              <Button v-if="app.links?.demo" :link="app.links.demo" variant="solid" theme="gray" icon-left="external-link">Live Demo</Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Body: 2-col layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

        <!-- Left: main content -->
        <div class="lg:col-span-2 space-y-8">

          <!-- Installation -->
          <section aria-labelledby="install-heading">
            <h2 id="install-heading" class="text-base font-semibold text-ink-gray-8 mb-4 flex items-center gap-2">
              <FeatherIcon name="terminal" class="w-4 h-4 text-ink-gray-4" />
              Installation
            </h2>
            <div class="rounded-lg border border-outline-gray-2 overflow-hidden">
              <div class="flex items-center justify-between gap-3 px-4 py-3 bg-surface-gray-1 border-b border-outline-gray-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-ink-gray-4 uppercase tracking-widest">Method</span>
                  <Badge theme="gray" :label="app.install.method" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  :theme="copied ? 'green' : 'gray'"
                  :icon-left="copied ? 'check' : 'copy'"
                  @click="copyCommand"
                >
                  {{ copied ? 'Copied!' : 'Copy' }}
                </Button>
              </div>
              <div class="px-4 py-4 font-mono text-sm text-ink-gray-7 bg-surface-white overflow-x-auto">
                {{ app.install.command }}
              </div>
            </div>
          </section>

          <!-- Compatibility -->
          <section aria-labelledby="compat-heading">
            <h2 id="compat-heading" class="text-base font-semibold text-ink-gray-8 mb-4 flex items-center gap-2">
              <FeatherIcon name="layers" class="w-4 h-4 text-ink-gray-4" />
              Compatibility
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="rounded-lg border border-outline-gray-1 p-4">
                <p class="text-xs font-semibold text-ink-gray-4 uppercase tracking-widest mb-3">Frappe Versions</p>
                <div class="flex gap-2 flex-wrap">
                  <Badge v-for="v in app.frappe_versions" :key="v" theme="gray" size="md" :label="`Frappe ${v}`" />
                </div>
              </div>
              <div class="rounded-lg border border-outline-gray-1 p-4">
                <p class="text-xs font-semibold text-ink-gray-4 uppercase tracking-widest mb-3">Required Apps</p>
                <div class="flex gap-2 flex-wrap">
                  <Badge v-for="dep in app.required_apps" :key="dep" theme="gray" size="md" :label="dep" class="font-mono" />
                </div>
              </div>
            </div>
          </section>

          <!-- Tags -->
          <section v-if="app.tags?.length" aria-labelledby="tags-heading">
            <h2 id="tags-heading" class="text-base font-semibold text-ink-gray-8 mb-3 flex items-center gap-2">
              <FeatherIcon name="tag" class="w-4 h-4 text-ink-gray-4" />
              Tags
            </h2>
            <div class="flex gap-2 flex-wrap">
              <Badge v-for="tag in app.tags" :key="tag" theme="gray" :label="tag" />
            </div>
          </section>
        </div>

        <!-- Right: sidebar -->
        <aside class="space-y-5" aria-label="App metadata">
          <!-- Details card -->
          <div class="rounded-lg border border-outline-gray-2 bg-surface-white overflow-hidden">
            <div class="px-4 py-3 border-b border-outline-gray-1 bg-surface-gray-1">
              <h2 class="text-xs font-semibold text-ink-gray-4 uppercase tracking-widest">Details</h2>
            </div>
            <dl class="divide-y divide-outline-gray-1 text-sm">
              <div class="flex items-start gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0 pt-0.5">Categories</dt>
                <dd class="flex gap-1.5 flex-wrap">
                  <RouterLink v-for="cat in app.categories" :key="cat" :to="`/categories?cat=${encodeURIComponent(cat)}`">
                    <Badge theme="gray" :label="cat" />
                  </RouterLink>
                </dd>
              </div>
              <div class="flex items-center gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0">License</dt>
                <dd class="text-ink-gray-7 font-medium">{{ app.license }}</dd>
              </div>
              <div class="flex items-center gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0">App name</dt>
                <dd class="font-mono text-xs text-ink-gray-7 bg-surface-gray-1 px-2 py-1 rounded-md border border-outline-gray-1">{{ app.install.app_name }}</dd>
              </div>
              <div class="flex items-center gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0">Status</dt>
                <dd>
                  <Badge :theme="app.meta?.status === 'active' ? 'green' : 'gray'" :label="app.meta?.status || 'active'">
                    <template #prefix>
                      <span v-if="app.meta?.status === 'active'" class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    </template>
                  </Badge>
                </dd>
              </div>
              <div v-if="app.meta?.added_at" class="flex items-center gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0">Added</dt>
                <dd class="text-ink-gray-7">{{ app.meta.added_at }}</dd>
              </div>
            </dl>
          </div>

          <!-- Links card -->
          <div v-if="app.links?.website || app.links?.docs || app.links?.demo" class="rounded-lg border border-outline-gray-2 bg-surface-white overflow-hidden">
            <div class="px-4 py-3 border-b border-outline-gray-2 bg-surface-gray-1">
              <h2 class="text-xs font-semibold text-ink-gray-4 uppercase tracking-widest">Links</h2>
            </div>
              <a v-if="app.links?.website" :href="app.links.website" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 w-full hover:bg-surface-gray-2 transition-colors py-3 px-4 text-ink-gray-7 text-base font-medium">
                <FeatherIcon name="globe" class="w-4 h-4 text-ink-gray-5 shrink-0" />
                <span class="truncate">Website</span>
                <FeatherIcon name="external-link" class="w-3.5 h-3.5 text-ink-gray-3 ml-auto shrink-0" />
              </a>
              <a v-if="app.links?.docs" :href="app.links.docs" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 w-full hover:bg-surface-gray-2 transition-colors py-3 px-4 text-ink-gray-7 text-base font-medium">
                <FeatherIcon name="book" class="w-4 h-4 text-ink-gray-5 shrink-0" />
                <span class="truncate">Documentation</span>
                <FeatherIcon name="external-link" class="w-3.5 h-3.5 text-ink-gray-3 ml-auto shrink-0" />
              </a>
              <a v-if="app.links?.demo" :href="app.links.demo" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 w-full hover:bg-surface-gray-2 transition-colors py-3 px-4 text-ink-gray-7 text-base font-medium">
                <FeatherIcon name="play-circle" class="w-4 h-4 text-ink-gray-5 shrink-0" />
                <span class="truncate">Live Demo</span>
                <FeatherIcon name="external-link" class="w-3.5 h-3.5 text-ink-gray-3 ml-auto shrink-0" />
              </a>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
