<script setup lang="ts">
import { ref, onMounted, computed, markRaw } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { FeatherIcon, Button } from 'frappe-ui'
import { fetchApps as fetchAppsApi } from './api'
import AppCommandPalette from './components/AppCommandPalette.vue'
import PaletteAppItem from './components/PaletteAppItem.vue'

const route = useRoute()
const menuOpen = ref(false)

const navLinks = [
  { to: '/apps',       label: 'Browse' },
  { to: '/categories', label: 'Categories' },
  { to: '/docs',       label: 'API' },
  { to: '/submit',     label: 'Submit' },
]

const isActive = (path: string) => route.path === path || (path !== '/' && route.path.startsWith(path))

const isDark = ref(false)
const toggleDark = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
  }

  loadApps()
})

// Search logic
const showSearch = ref(false)
const searchQuery = ref('')
const apps = ref([])
const router = useRouter()

const loadApps = async () => {
  try {
    const data = await fetchAppsApi()
    apps.value = data.apps || []
  } catch (error) {
    console.error('Failed to fetch apps for search:', error)
  }
}

const searchGroups = computed(() => {
  const query = searchQuery.value.toLowerCase()
  let filtered = apps.value
  
  if (query) {
    filtered = apps.value.filter(app => 
      app.title.toLowerCase().includes(query) || 
      (app.description && app.description.toLowerCase().includes(query)) ||
      (app.categories && app.categories.some((c: string) => c.toLowerCase().includes(query))) ||
      (app.tags && app.tags.some((t: string) => t.toLowerCase().includes(query)))
    )
  }

  return [
    {
      title: 'Apps',
      hideTitle: false,
      component: markRaw(PaletteAppItem),
      items: filtered.slice(0, 10).map(app => ({
        ...app,
        name: app.slug, // required unique key for CommandPalette
      }))
    }
  ]
})

const onSearchSelect = (item: any) => {
  if (item && item.slug) {
    router.push(`/apps/${item.slug}`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface-white flex flex-col">

    <!-- ── Top Navbar ── -->
    <header class="sticky top-0 z-50 bg-surface-white border-b border-outline-gray-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex items-center h-[52px] gap-6">

          <!-- Logo -->
          <RouterLink to="/" class="flex items-center gap-2 shrink-0" aria-label="Frappe App Registry">
            <FeatherIcon name="codesandbox" class="w-5 h-5 text-ink-gray-9" />
            <span class="text-base font-semibold text-ink-gray-9 tracking-tight">Frappe Brewery</span>
          </RouterLink>

          <!-- Desktop nav links -->
          <nav class="hidden md:flex items-center gap-4" role="navigation" aria-label="Main navigation">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-sm font-medium transition-colors"
              :class="isActive(link.to) ? 'text-ink-gray-9' : 'text-ink-gray-5 hover:text-ink-gray-8'"
            >
              {{ link.label }}
            </RouterLink>
          </nav>

          <!-- Spacer -->
          <div class="flex-1" />

          <!-- Right actions -->
          <div class="flex items-center gap-1 sm:gap-2">
            
            <!-- Search / Cmd K (Desktop) -->
            <Button
              variant="subtle"
              theme="gray"
              class="hidden sm:flex items-center"
              aria-label="Search"
              @click="showSearch = true"
            >
              <template #prefix><FeatherIcon name="search" class="w-4 h-4" /></template>
              <span class="mr-2">Search</span>
              <template #suffix>
                <div class="flex items-center gap-0.5 text-[11px] font-medium text-ink-gray-5">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </template>
            </Button>

            <!-- Mobile Search Icon -->
            <Button
              class="sm:hidden"
              variant="ghost"
              theme="gray"
              icon="search"
              aria-label="Search"
              @click="showSearch = true"
            />

            <!-- Dark Mode Toggle -->
            <Button 
              variant="subtle"
              theme="gray"
              :icon="isDark ? 'sun' : 'moon'"
              @click="toggleDark"
              class="flex"
              aria-label="Toggle dark mode"
            />

            <!-- GitHub -->
            <a 
              href="https://github.com/frappe/frappe-app-registry"
              target="_blank"
              rel="noopener"
              class="flex items-center text-ink-gray-9 hover:opacity-75 transition-opacity px-1"
              aria-label="GitHub Repository"
            >
              <svg class="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path>
              </svg>
            </a>

            <!-- Mobile hamburger -->
            <Button
              class="md:hidden ml-0.5"
              variant="ghost"
              theme="gray"
              :icon="menuOpen ? 'x' : 'menu'"
              :aria-expanded="menuOpen"
              aria-controls="mobile-menu"
              @click="menuOpen = !menuOpen"
            />
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1.5"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1.5"
      >
        <div v-if="menuOpen" id="mobile-menu" class="absolute left-0 right-0 top-[53px] md:hidden border-b border-outline-gray-1 bg-surface-white px-4 pb-3 pt-2 shadow-sm">
          <nav class="flex flex-col gap-0.5">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center w-full px-3 py-2 rounded text-sm transition-colors"
              :class="isActive(link.to) ? 'bg-surface-gray-2 text-ink-gray-9 font-medium' : 'text-ink-gray-7 hover:bg-surface-gray-2'"
              @click="menuOpen = false"
            >
              {{ link.label }}
            </RouterLink>
          </nav>
        </div>
      </Transition>
    </header>

    <!-- ── Page Content ── -->
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0"
          mode="out-in"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- ── Footer ── -->
    <footer class="border-t border-outline-gray-1 bg-surface-gray-1 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:py-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-semibold text-ink-gray-7">Community-maintained Frappe app index</span>
            <span class="text-xs text-ink-gray-5">Open data · MIT License · Built for the Frappe community</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
            <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to" class="text-sm sm:text-xs font-medium text-ink-gray-6 hover:text-ink-gray-9 transition-colors">{{ link.label }}</RouterLink>
            <a href="https://github.com/frappe/frappe-app-registry" target="_blank" rel="noopener" class="text-sm sm:text-xs font-medium text-ink-gray-6 hover:text-ink-gray-9 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Global Search -->
    <AppCommandPalette
      v-model:show="showSearch"
      v-model:searchQuery="searchQuery"
      :groups="searchGroups"
      @select="onSearchSelect"
    />
  </div>
</template>
