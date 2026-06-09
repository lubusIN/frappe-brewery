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
            <Button
              v-for="link in navLinks"
              :key="link.to"
              :route="{ path: link.to }"
              :variant="isActive(link.to) ? 'subtle' : 'ghost'"
              theme="gray"
            >
              {{ link.label }}
            </Button>
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
            <Button
              v-for="link in navLinks"
              :key="link.to"
              :route="{ path: link.to }"
              :variant="isActive(link.to) ? 'subtle' : 'ghost'"
              theme="gray"
              class="w-full !justify-start"
              @click="menuOpen = false"
            >
              {{ link.label }}
            </Button>
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
