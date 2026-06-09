<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { fetchApp } from '../api'
import type { App } from '../types'

const route = useRoute()
const app = ref<App | null>(null)
const loading = ref(true)
const error = ref('')
const copied = ref(false)

async function loadApp(slug: string) {
  loading.value = true
  error.value = ''
  try {
    app.value = await fetchApp(slug)
  } catch (e) {
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
watch(() => route.params.slug, (slug) => slug && loadApp(slug as string))
</script>

<template>
  <div class="app-detail">
    <!-- Loading -->
    <div v-if="loading" class="container detail-skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-body"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="container error-state" role="alert">
      <p class="error-icon">😕</p>
      <p class="error-msg">{{ error }}</p>
      <RouterLink to="/apps" class="btn btn-ghost">← Back to apps</RouterLink>
    </div>

    <!-- Content -->
    <template v-else-if="app">
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <div class="container breadcrumb">
          <RouterLink to="/apps" class="breadcrumb-link">Apps</RouterLink>
          <span class="breadcrumb-sep" aria-hidden="true">/</span>
          <span class="breadcrumb-current">{{ app.title }}</span>
        </div>
      </div>

      <!-- Hero -->
      <section class="detail-hero">
        <div class="container detail-hero-inner">
          <div class="detail-app-info">
            <div class="detail-icon">
              <img
                v-if="app.media?.icon"
                :src="app.media.icon"
                :alt="app.title"
                @error="($event.target as HTMLImageElement).style.display='none'"
              />
              <span v-else class="detail-icon-fallback">{{ app.title[0] }}</span>
            </div>
            <div class="detail-meta">
              <div class="detail-meta-badges">
                <span v-if="app.meta?.verified" class="badge badge-green">✓ Verified</span>
                <span class="badge badge-gray">{{ app.license }}</span>
                <span v-if="app.meta?.status && app.meta.status !== 'active'" class="badge badge-gray">{{ app.meta.status }}</span>
              </div>
              <h1 class="detail-title">{{ app.title }}</h1>
              <p class="detail-name">
                <code>{{ app.name }}</code>
              </p>
              <p class="detail-desc">{{ app.description }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <a
              :href="app.repository"
              target="_blank"
              rel="noopener"
              class="btn btn-ghost"
              :aria-label="`View ${app.title} on GitHub`"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/>
              </svg>
              GitHub
            </a>
            <a v-if="app.links?.docs" :href="app.links.docs" target="_blank" rel="noopener" class="btn btn-ghost">
              Docs ↗
            </a>
            <a v-if="app.links?.demo" :href="app.links.demo" target="_blank" rel="noopener" class="btn btn-ghost">
              Live Demo ↗
            </a>
          </div>
        </div>
      </section>

      <!-- Body -->
      <div class="container detail-body">
        <div class="detail-content">
          <!-- Install -->
          <section class="detail-section" aria-labelledby="install-heading">
            <h2 id="install-heading" class="detail-section-title">Installation</h2>
            <div class="install-card">
              <div class="install-method">
                <span class="badge badge-teal">{{ app.install.method }}</span>
              </div>
              <div class="install-cmd-wrap">
                <div class="code-block install-cmd">{{ app.install.command }}</div>
                <button
                  class="copy-btn"
                  :class="{ copied }"
                  :aria-label="copied ? 'Copied!' : 'Copy install command'"
                  @click="copyCommand"
                >
                  <span v-if="copied">✓ Copied</span>
                  <span v-else>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy
                  </span>
                </button>
              </div>
            </div>
          </section>

          <!-- Compatibility -->
          <section class="detail-section" aria-labelledby="compat-heading">
            <h2 id="compat-heading" class="detail-section-title">Compatibility</h2>
            <div class="compat-grid">
              <div class="compat-block">
                <p class="compat-label">Frappe Versions</p>
                <div class="compat-tags">
                  <span v-for="v in app.frappe_versions" :key="v" class="badge badge-blue">Frappe {{ v }}</span>
                </div>
              </div>
              <div class="compat-block">
                <p class="compat-label">Required Apps</p>
                <div class="compat-tags">
                  <span v-for="dep in app.required_apps" :key="dep" class="tag">{{ dep }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Tags -->
          <section v-if="app.tags?.length" class="detail-section" aria-labelledby="tags-heading">
            <h2 id="tags-heading" class="detail-section-title">Tags</h2>
            <div class="tags-list">
              <span v-for="tag in app.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="detail-sidebar" aria-label="App metadata">
          <div class="sidebar-card card">
            <h2 class="sidebar-heading">Details</h2>
            <dl class="detail-dl">
              <dt>Categories</dt>
              <dd>
                <div class="cats-list">
                  <RouterLink
                    v-for="cat in app.categories"
                    :key="cat"
                    :to="`/categories?cat=${encodeURIComponent(cat)}`"
                    class="badge badge-blue"
                  >{{ cat }}</RouterLink>
                </div>
              </dd>
              <dt>License</dt>
              <dd>{{ app.license }}</dd>
              <dt>App name</dt>
              <dd><code class="inline-code">{{ app.install.app_name }}</code></dd>
              <dt>Status</dt>
              <dd>
                <span
                  class="badge"
                  :class="app.meta?.status === 'active' ? 'badge-green' : 'badge-gray'"
                >{{ app.meta?.status || 'active' }}</span>
              </dd>
              <template v-if="app.meta?.added_at">
                <dt>Added</dt>
                <dd>{{ app.meta.added_at }}</dd>
              </template>
            </dl>
          </div>

          <div v-if="app.links?.website || app.links?.docs || app.links?.demo" class="sidebar-card card">
            <h2 class="sidebar-heading">Links</h2>
            <div class="links-list">
              <a v-if="app.links?.website" :href="app.links.website" target="_blank" rel="noopener" class="sidebar-link">
                🌐 Website ↗
              </a>
              <a v-if="app.links?.docs" :href="app.links.docs" target="_blank" rel="noopener" class="sidebar-link">
                📚 Documentation ↗
              </a>
              <a v-if="app.links?.demo" :href="app.links.demo" target="_blank" rel="noopener" class="sidebar-link">
                🎯 Live Demo ↗
              </a>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app-detail { padding-bottom: 80px; }

/* Breadcrumb */
.breadcrumb-bar { border-bottom: 1px solid var(--border); padding: 12px 0; }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.breadcrumb-link { color: var(--text-3); transition: color var(--duration); }
.breadcrumb-link:hover { color: var(--text-2); }
.breadcrumb-sep { color: var(--text-3); }
.breadcrumb-current { color: var(--text-2); }

/* Hero */
.detail-hero {
  background: linear-gradient(180deg, hsla(221,80%,55%,0.06) 0%, transparent 100%);
  border-bottom: 1px solid var(--border);
  padding: 48px 0;
}
.detail-hero-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  flex-wrap: wrap;
}
.detail-app-info { display: flex; gap: 24px; align-items: flex-start; flex: 1; }
.detail-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--r-lg);
  background: var(--bg-3);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.detail-icon img { width: 100%; height: 100%; object-fit: cover; }
.detail-icon-fallback { font-size: 32px; font-weight: 800; color: var(--brand-400); }
.detail-meta { display: flex; flex-direction: column; gap: 8px; }
.detail-meta-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.detail-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
.detail-name { font-size: 13px; color: var(--text-3); }
.detail-desc { font-size: 15px; color: var(--text-2); line-height: 1.7; max-width: 520px; }
.detail-actions { display: flex; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }

/* Body */
.detail-body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 40px;
  padding-top: 48px;
  align-items: start;
}
.detail-content { display: flex; flex-direction: column; gap: 40px; }
.detail-section { display: flex; flex-direction: column; gap: 16px; }
.detail-section-title { font-size: 16px; font-weight: 700; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 10px; }

/* Install */
.install-card { display: flex; flex-direction: column; gap: 12px; }
.install-method {}
.install-cmd-wrap { display: flex; align-items: center; gap: 12px; }
.install-cmd { flex: 1; font-size: 13px; overflow-x: auto; white-space: nowrap; }
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--duration) var(--ease);
  flex-shrink: 0;
}
.copy-btn:hover { border-color: var(--brand-500); color: var(--text); }
.copy-btn.copied { background: hsla(142,70%,45%,0.12); border-color: hsl(142,60%,55%); color: hsl(142,60%,55%); }

/* Compat */
.compat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.compat-block { display: flex; flex-direction: column; gap: 10px; }
.compat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.compat-tags { display: flex; gap: 6px; flex-wrap: wrap; }

/* Tags */
.tags-list { display: flex; gap: 8px; flex-wrap: wrap; }

/* Sidebar */
.detail-sidebar { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 80px; }
.sidebar-card { display: flex; flex-direction: column; gap: 16px; }
.sidebar-heading { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.detail-dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 16px; align-items: start; font-size: 13px; }
.detail-dl dt { color: var(--text-3); white-space: nowrap; }
.detail-dl dd { color: var(--text-2); }
.cats-list { display: flex; gap: 6px; flex-wrap: wrap; }
.inline-code { font-family: var(--font-mono); font-size: 12px; color: var(--accent-400); background: var(--bg-2); padding: 2px 6px; border-radius: 4px; }
.links-list { display: flex; flex-direction: column; gap: 10px; }
.sidebar-link { font-size: 13px; color: var(--text-2); transition: color var(--duration); }
.sidebar-link:hover { color: var(--brand-400); }

/* Skeletons */
.detail-skeleton { display: flex; flex-direction: column; gap: 24px; padding: 48px 0; }
.skeleton-header { height: 120px; border-radius: var(--r-lg); background: var(--bg-card); animation: shimmer 1.5s infinite; }
.skeleton-body { height: 300px; border-radius: var(--r-lg); background: var(--bg-card); animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* Error */
.error-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 100px 0; text-align: center; }
.error-icon { font-size: 48px; }
.error-msg { font-size: 16px; color: var(--text-2); }

@media (max-width: 900px) {
  .detail-body { grid-template-columns: 1fr; }
  .detail-sidebar { position: static; }
  .compat-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .detail-app-info { flex-direction: column; }
  .install-cmd-wrap { flex-direction: column; align-items: stretch; }
}
</style>
