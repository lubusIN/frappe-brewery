<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)

const navLinks = [
  { to: '/apps',       label: 'Browse Apps' },
  { to: '/categories', label: 'Categories' },
  { to: '/docs',       label: 'API Docs' },
  { to: '/submit',     label: 'Submit App' },
]

const isActive = (path: string) => route.path.startsWith(path)
</script>

<template>
  <div class="app-shell">
    <!-- ── Navbar ── -->
    <header class="navbar">
      <div class="container navbar-inner">
        <!-- Logo -->
        <RouterLink to="/" class="logo" aria-label="Frappe App Registry">
          <div class="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9"/>
              <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.55"/>
              <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.55"/>
              <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.25"/>
            </svg>
          </div>
          <span class="logo-text">Frappe Registry</span>
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="nav-links" role="navigation" aria-label="Main navigation">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            :class="{ active: isActive(link.to) }"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <!-- CTA -->
        <div class="nav-right">
          <a
            href="https://github.com/frappe/frappe-app-registry"
            target="_blank"
            rel="noopener"
            class="btn btn-ghost btn-sm nav-github"
            aria-label="GitHub repository"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/>
            </svg>
            GitHub
          </a>
          <RouterLink to="/submit" class="btn btn-primary btn-sm">
            Submit App
          </RouterLink>
          <!-- Mobile menu toggle -->
          <button
            class="menu-toggle"
            :aria-expanded="menuOpen"
            aria-controls="mobile-menu"
            @click="menuOpen = !menuOpen"
          >
            <span class="sr-only">Toggle menu</span>
            <svg v-if="!menuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition name="slide-down">
        <div v-if="menuOpen" id="mobile-menu" class="mobile-menu">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="mobile-link"
            :class="{ active: isActive(link.to) }"
            @click="menuOpen = false"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </Transition>
    </header>

    <!-- ── Page content ── -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- ── Footer ── -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <div class="logo-icon" style="color: var(--brand-400)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9"/>
              <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.55"/>
              <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.55"/>
              <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.25"/>
            </svg>
          </div>
          <span class="footer-tagline">Community-maintained Frappe app index</span>
        </div>
        <div class="footer-links">
          <RouterLink to="/apps" class="footer-link">Browse</RouterLink>
          <RouterLink to="/categories" class="footer-link">Categories</RouterLink>
          <RouterLink to="/submit" class="footer-link">Submit</RouterLink>
          <RouterLink to="/docs" class="footer-link">API</RouterLink>
          <a href="https://github.com/frappe/frappe-app-registry" target="_blank" rel="noopener" class="footer-link">GitHub</a>
        </div>
        <p class="footer-copy">Open data · MIT License · Built for the Frappe community</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Shell ── */
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main-content { flex: 1; }

/* ── Navbar ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: hsla(222, 47%, 6%, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.navbar-inner {
  display: flex;
  align-items: center;
  height: 60px;
  gap: 32px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.logo-icon {
  display: flex;
  align-items: center;
  color: var(--brand-400);
}
.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

/* Nav links */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.nav-link {
  padding: 6px 12px;
  border-radius: var(--r-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  transition: all var(--duration) var(--ease);
}
.nav-link:hover { color: var(--text); background: var(--bg-3); }
.nav-link.active { color: var(--brand-400); background: hsla(221,80%,55%,0.1); }

/* Nav right */
.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}
.nav-github { display: flex; }

/* Mobile toggle */
.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text-2);
  cursor: pointer;
  transition: all var(--duration) var(--ease);
}
.menu-toggle:hover { color: var(--text); border-color: var(--gray-600); }

/* Mobile menu */
.mobile-menu {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: var(--bg-2);
  padding: 8px 16px 16px;
}
.mobile-link {
  padding: 10px 12px;
  border-radius: var(--r-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  transition: all var(--duration) var(--ease);
}
.mobile-link:hover,
.mobile-link.active { color: var(--brand-400); background: hsla(221,80%,55%,0.1); }

/* Slide-down transition */
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.2s var(--ease); }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── Footer ── */
.footer {
  border-top: 1px solid var(--border);
  background: var(--bg-2);
  padding: 32px 0;
  margin-top: auto;
}
.footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-tagline { font-size: 14px; color: var(--text-3); }
.footer-links {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}
.footer-link {
  font-size: 13px;
  color: var(--text-3);
  transition: color var(--duration) var(--ease);
}
.footer-link:hover { color: var(--text-2); }
.footer-copy { font-size: 12px; color: var(--text-3); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-github { display: none; }
  .menu-toggle { display: flex; }
}
@media (max-width: 480px) {
  .logo-text { display: none; }
}
</style>
