<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { FeatherIcon } from 'frappe-ui'

const route = useRoute()
const menuOpen = ref(false)

const navLinks = [
  { to: '/apps',       label: 'Browse Apps' },
  { to: '/categories', label: 'Categories' },
  { to: '/docs',       label: 'API' },
]

const isActive = (path: string) => route.path === path || (path !== '/' && route.path.startsWith(path))
</script>

<template>
  <div class="min-h-screen bg-surface-white flex flex-col">

    <!-- ── Top Navbar ── -->
    <header class="sticky top-0 z-50 bg-surface-white border-b border-outline-gray-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex items-center h-[52px] gap-6">

          <!-- Logo -->
          <RouterLink to="/" class="flex items-center gap-2 shrink-0" aria-label="Frappe App Registry">
            <div class="w-6 h-6 rounded bg-ink-gray-9 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.25"/>
              </svg>
            </div>
            <span class="text-base font-semibold text-ink-gray-9 tracking-tight">Frappe Registry</span>
          </RouterLink>

          <!-- Desktop nav links -->
          <nav class="hidden md:flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
              :class="isActive(link.to)
                ? 'bg-surface-gray-2 text-ink-gray-9'
                : 'text-ink-gray-5 hover:text-ink-gray-8 hover:bg-surface-gray-1'"
            >
              {{ link.label }}
            </RouterLink>
          </nav>

          <!-- Spacer -->
          <div class="flex-1" />

          <!-- Right actions -->
          <div class="flex items-center gap-2">
            <a
              href="https://github.com/frappe/frappe-app-registry"
              target="_blank"
              rel="noopener"
              class="hidden sm:flex items-center gap-1.5 text-sm text-ink-gray-5 hover:text-ink-gray-8 transition-colors px-2 py-1"
              aria-label="GitHub"
            >
              <FeatherIcon name="github" class="w-4 h-4" />
              <span class="hidden lg:block">GitHub</span>
            </a>
            <RouterLink
              to="/submit"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ink-gray-9 text-white text-sm font-medium hover:bg-ink-gray-7 transition-colors"
            >
              <FeatherIcon name="plus" class="w-3.5 h-3.5" />
              Submit App
            </RouterLink>
            <!-- Mobile hamburger -->
            <button
              class="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-ink-gray-5 hover:bg-surface-gray-2 transition-colors"
              :aria-expanded="menuOpen"
              aria-controls="mobile-menu"
              @click="menuOpen = !menuOpen"
            >
              <FeatherIcon :name="menuOpen ? 'x' : 'menu'" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition name="slide-down">
        <div v-if="menuOpen" id="mobile-menu" class="md:hidden border-t border-outline-gray-1 bg-surface-white px-4 pb-3 pt-2">
          <nav class="flex flex-col gap-0.5">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="isActive(link.to)
                ? 'bg-surface-gray-2 text-ink-gray-9'
                : 'text-ink-gray-5 hover:text-ink-gray-8 hover:bg-surface-gray-1'"
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
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- ── Footer ── -->
    <footer class="border-t border-outline-gray-1 bg-surface-gray-1 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 rounded bg-ink-gray-9 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.25"/>
              </svg>
            </div>
            <span class="text-sm text-ink-gray-5">Community-maintained Frappe app index</span>
          </div>
          <div class="flex items-center gap-5">
            <RouterLink v-for="link in [...navLinks, { to: '/submit', label: 'Submit' }]" :key="link.to" :to="link.to" class="text-xs text-ink-gray-4 hover:text-ink-gray-7 transition-colors">{{ link.label }}</RouterLink>
            <a href="https://github.com/frappe/frappe-app-registry" target="_blank" rel="noopener" class="text-xs text-ink-gray-4 hover:text-ink-gray-7 transition-colors">GitHub</a>
          </div>
        </div>
        <p class="mt-4 text-xs text-ink-gray-3">Open data · MIT License · Built for the Frappe community</p>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
