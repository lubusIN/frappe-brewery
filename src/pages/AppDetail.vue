<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { FeatherIcon, Badge, Button, FormControl } from 'frappe-ui'
import { fetchApp } from '../api'
import type { App } from '../types'

const route = useRoute()
const app = ref<App | null>(null)
const loading = ref(true)
const error = ref('')
const copied = ref(false)
const imageError = ref(false)
const showLightbox = ref(false)
const selectedScreenshot = ref('')
const selectedVersion = ref('')

function openScreenshot(url: string) {
  selectedScreenshot.value = url
  showLightbox.value = true
}

watch(() => app.value?.media?.icon, () => {
  imageError.value = false
})

watch(() => app.value, () => {
  if (app.value?.frappe_versions?.length) {
    if (!selectedVersion.value || !app.value.frappe_versions.includes(selectedVersion.value)) {
      selectedVersion.value = app.value.frappe_versions[app.value.frappe_versions.length - 1]
    }
  } else {
    selectedVersion.value = ''
  }
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

const versionOptions = computed(() => {
  if (!app.value?.frappe_versions) return []
  return app.value.frappe_versions.map(v => ({ label: `Frappe v${v}`, value: v }))
})

const displayCommands = computed(() => {
  if (!app.value?.install_commands) return []
  return app.value.install_commands.map(cmd => {
    let finalCmd = cmd
    const match = cmd.match(/^bench get-app https:\/\/github\.com\/frappe\/([^/]+?)(?:\.git)?\/?$/)
    if (match) {
      finalCmd = `bench get-app ${match[1]}`
    }
    
    if (finalCmd.startsWith('bench get-app ') && selectedVersion.value && app.value?.install_branches) {
      const branch = app.value.install_branches[selectedVersion.value]
      if (branch && !finalCmd.includes('--branch')) {
        finalCmd = `${finalCmd} --branch ${branch}`
      }
    }
    return finalCmd
  })
})

async function copyCommand() {
  if (!displayCommands.value.length) return
  await navigator.clipboard.writeText(displayCommands.value.join('\n'))
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
          <div class="flex flex-col md:flex-row md:items-start gap-5 md:gap-3">
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

          <!-- Screenshots -->
          <section v-if="app.media?.screenshots?.length" aria-labelledby="screenshots-heading">
            <h2 id="screenshots-heading" class="text-base font-semibold text-ink-gray-8 mb-4 flex items-center gap-2">
              <FeatherIcon name="image" class="w-4 h-4 text-ink-gray-4" />
              Screenshots
            </h2>
            <div class="grid grid-cols-1 gap-4" :class="{ 'sm:grid-cols-2': app.media.screenshots.length > 1 }">
              <button 
                v-for="(screenshot, idx) in app.media.screenshots" 
                :key="idx" 
                @click="openScreenshot(screenshot)"
                class="rounded-lg border border-outline-gray-2 overflow-hidden bg-surface-gray-2 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ink-gray-9 aspect-video relative flex items-center justify-center"
              >
                <FeatherIcon name="image" class="w-8 h-8 text-ink-gray-3 absolute" />
                <img :src="screenshot" :alt="`${app.title} screenshot ${idx + 1}`" class="w-full h-full object-contain relative" loading="lazy" />
              </button>
            </div>
          </section>

          <!-- Installation -->
          <section aria-labelledby="install-heading">
            <div class="flex items-center justify-between mb-4">
              <h2 id="install-heading" class="text-base font-semibold text-ink-gray-8 flex items-center gap-2">
                <FeatherIcon name="terminal" class="w-4 h-4 text-ink-gray-4" />
                Installation
              </h2>
              <div v-if="versionOptions.length > 0">
                <FormControl
                  type="select"
                  :options="versionOptions"
                  v-model="selectedVersion"
                />
              </div>
            </div>
            <div class="rounded-lg overflow-hidden bg-surface-white border border-outline-gray-2 shadow-sm">
              <div class="flex items-center justify-between px-4 py-2 bg-surface-gray-1 border-b border-outline-gray-1">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                  <span class="ml-2 text-xs font-mono text-ink-gray-4 tracking-wide">bash</span>
                </div>
                <button
                  class="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ink-gray-3"
                  :class="copied ? 'text-green-600 bg-green-50' : 'text-ink-gray-5 hover:text-ink-gray-7 hover:bg-surface-gray-2'"
                  @click="copyCommand"
                >
                  <FeatherIcon :name="copied ? 'check' : 'copy'" class="w-3.5 h-3.5" />
                  {{ copied ? 'Copied' : 'Copy' }}
                </button>
              </div>
              <div class="px-5 py-4 font-mono text-sm overflow-x-auto space-y-1">
                <div v-for="(cmd, i) in displayCommands" :key="i" class="flex items-start">
                  <span class="text-ink-gray-4 select-none mr-3 font-semibold opacity-80">$</span>
                  <span class="text-ink-gray-8 whitespace-nowrap">{{ cmd }}</span>
                </div>
              </div>
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
                <dd class="flex gap-x-1.5 gap-y-1 flex-wrap pt-0.5">
                  <RouterLink v-for="(cat, index) in app.categories" :key="cat" :to="`/categories?cat=${encodeURIComponent(cat)}`" class="text-ink-gray-7 hover:text-ink-gray-9 hover:underline transition-colors">
                    {{ cat }}<span v-if="index !== app.categories.length - 1" class="text-ink-gray-4 no-underline">,</span>
                  </RouterLink>
                </dd>
              </div>
              <div v-if="app.tags?.length" class="flex items-start gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0 pt-0.5">Tags</dt>
                <dd class="flex gap-x-1.5 gap-y-1 flex-wrap pt-0.5">
                  <span v-for="(tag, index) in app.tags" :key="tag" class="text-ink-gray-7">
                    {{ tag }}<span v-if="index !== app.tags.length - 1" class="text-ink-gray-4">,</span>
                  </span>
                </dd>
              </div>
              <div class="flex items-center gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0">License</dt>
                <dd class="text-ink-gray-7 font-medium">{{ app.license }}</dd>
              </div>
              <div v-if="app.min_frappe_version" class="flex items-center gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0">Min version</dt>
                <dd class="font-mono text-ink-gray-8 pt-0.5">{{ app.min_frappe_version }}</dd>
              </div>
              <div v-if="app.frappe_versions?.length" class="flex items-start gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0 pt-0.5">Frappe</dt>
                <dd class="flex gap-x-1.5 gap-y-1 flex-wrap pt-0.5">
                  <span v-for="(v, index) in app.frappe_versions" :key="v" class="text-ink-gray-7">
                    v{{ v }}<span v-if="index !== app.frappe_versions.length - 1" class="text-ink-gray-4">,</span>
                  </span>
                </dd>
              </div>
              <div v-if="app.install_branches && Object.keys(app.install_branches).length" class="flex items-start gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0 pt-0.5">Install Branches</dt>
                <dd class="flex flex-col w-full gap-2 pt-0.5">
                  <div v-for="(branch, version) in app.install_branches" :key="version" class="flex items-center justify-between pb-2 border-b border-outline-gray-1 last:border-0 last:pb-0">
                    <span class="text-ink-gray-7 font-medium">v{{ version }}</span>
                    <span class="text-ink-gray-8 font-mono text-sm">{{ branch }}</span>
                  </div>
                </dd>
              </div>
              <div v-if="app.required_apps?.length" class="flex items-start gap-3 px-4 py-3">
                <dt class="text-ink-gray-4 w-24 shrink-0 pt-0.5">Requires</dt>
                <dd class="flex gap-x-1.5 gap-y-1 flex-wrap pt-0.5">
                  <span v-for="(dep, index) in app.required_apps" :key="dep" class="text-ink-gray-7 font-mono">
                    {{ dep }}<span v-if="index !== app.required_apps.length - 1" class="text-ink-gray-4 font-sans">,</span>
                  </span>
                </dd>
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

    <!-- Screenshot Lightbox -->
    <Dialog
      v-model="showLightbox"
      :options="{ size: '4xl' }"
      bare
      @after-leave="selectedScreenshot = ''"
    >
      <template #body>
        <div class="relative flex justify-center items-center w-full h-full p-2" v-if="selectedScreenshot">
          <img :src="selectedScreenshot" class="max-w-full max-h-[90vh] object-contain" />
          <Button
            icon="x"
            variant="solid"
            theme="gray"
            class="fixed top-4 right-4 z-50"
            @click="showLightbox = false"
            aria-label="Close"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
