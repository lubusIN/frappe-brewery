<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { FeatherIcon, Button } from 'frappe-ui'

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
          <div class="flex items-center gap-2">
            <Button
              link="https://github.com/frappe/frappe-app-registry"
              variant="ghost"
              theme="gray"
              icon-left="github"
              class="hidden sm:inline-flex"
            >
              <span class="hidden lg:inline">GitHub</span>
            </Button>
            <Button :route="{ path: '/submit' }" variant="solid" theme="gray" class="hidden sm:inline-flex" icon-left="plus">
              Submit App
            </Button>
            <!-- Mobile hamburger -->
            <Button
              class="md:hidden"
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
        <div v-if="menuOpen" id="mobile-menu" class="md:hidden border-t border-outline-gray-1 bg-surface-white px-4 pb-3 pt-2">
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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ink-gray-5">Community-maintained Frappe app index</span>
            <span class="text-xs text-ink-gray-4">Open data · MIT License · Built for the Frappe community</span>
          </div>
          <div class="flex flex-wrap items-center gap-5 mt-4 sm:mt-0">
            <RouterLink v-for="link in [...navLinks, { to: '/submit', label: 'Submit' }]" :key="link.to" :to="link.to" class="text-xs font-medium text-ink-gray-4 hover:text-ink-gray-7 transition-colors">{{ link.label }}</RouterLink>
            <a href="https://github.com/frappe/frappe-app-registry" target="_blank" rel="noopener" class="text-xs font-medium text-ink-gray-4 hover:text-ink-gray-7 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>
