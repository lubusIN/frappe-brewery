<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchStats, fetchApps } from '../api'
import type { StatsResponse, AppSummary } from '../types'

const stats = ref<StatsResponse | null>(null)
const featuredApps = ref<AppSummary[]>([])
const loading = ref(true)

const categories = [
  { name: 'CRM',            icon: '🤝' },
  { name: 'HR',             icon: '👥' },
  { name: 'Accounting',     icon: '📊' },
  { name: 'Manufacturing',  icon: '🏭' },
  { name: 'Reports',        icon: '📈' },
  { name: 'AI',             icon: '🤖' },
  { name: 'Integration',    icon: '🔗' },
  { name: 'Developer Tools',icon: '🛠️' },
]

onMounted(async () => {
  try {
    const [statsData, appsData] = await Promise.all([fetchStats(), fetchApps()])
    stats.value = statsData
    featuredApps.value = appsData.apps.slice(0, 4)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <!-- ── Hero ── -->
    <section class="hero">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="container hero-content">
        <div class="hero-badge animate-fade-up">
          <span class="badge badge-blue">Open Source · Community-Maintained</span>
        </div>
        <h1 class="hero-title animate-fade-up animate-delay-1">
          The Frappe<br />
          <span class="gradient-text">App Registry</span>
        </h1>
        <p class="hero-subtitle animate-fade-up animate-delay-2">
          Discover, install, and share Frappe apps.<br />
          Open data, GitHub-based submissions, static JSON API.
        </p>
        <div class="hero-actions animate-fade-up animate-delay-3">
          <RouterLink to="/apps" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Browse Apps
          </RouterLink>
          <RouterLink to="/submit" class="btn btn-ghost">
            Submit Your App →
          </RouterLink>
        </div>

        <!-- Stats row -->
        <div v-if="stats" class="hero-stats animate-fade-up">
          <div class="stat-pill">
            <span class="stat-num">{{ stats.total_apps }}</span>
            <span class="stat-label">Apps</span>
          </div>
          <div class="stat-divider" aria-hidden="true"></div>
          <div class="stat-pill">
            <span class="stat-num">{{ stats.total_categories }}</span>
            <span class="stat-label">Categories</span>
          </div>
          <div class="stat-divider" aria-hidden="true"></div>
          <div class="stat-pill">
            <span class="stat-num">14·15·16</span>
            <span class="stat-label">Frappe Versions</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Featured Apps ── -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <p class="section-eyebrow">Registry</p>
          <h2 class="section-title">Featured Apps</h2>
          <p class="section-desc">Official and community-built apps for the Frappe ecosystem.</p>
        </div>

        <div v-if="loading" class="loading-row">
          <div v-for="i in 4" :key="i" class="skeleton-card"></div>
        </div>

        <div v-else class="apps-grid">
          <RouterLink
            v-for="app in featuredApps"
            :key="app.slug"
            :to="`/apps/${app.slug}`"
            class="app-card card"
            :aria-label="`View ${app.title}`"
          >
            <div class="app-card-top">
              <div class="app-icon">
                <img v-if="app.icon" :src="app.icon" :alt="app.title" @error="($event.target as HTMLImageElement).style.display='none'" />
                <span v-else class="app-icon-fallback">{{ app.title[0] }}</span>
              </div>
              <div v-if="app.verified" class="badge badge-green">Verified</div>
            </div>
            <h3 class="app-title">{{ app.title }}</h3>
            <p class="app-desc">{{ app.description }}</p>
            <div class="app-meta">
              <div class="app-tags">
                <span v-for="cat in app.categories" :key="cat" class="badge badge-blue">{{ cat }}</span>
              </div>
              <span class="app-versions">v{{ app.frappe_versions.join(', ') }}</span>
            </div>
          </RouterLink>
        </div>

        <div class="section-cta">
          <RouterLink to="/apps" class="btn btn-ghost">View all apps →</RouterLink>
        </div>
      </div>
    </section>

    <!-- ── Categories ── -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <p class="section-eyebrow">Browse by</p>
          <h2 class="section-title">Categories</h2>
        </div>
        <div class="cat-grid">
          <RouterLink
            v-for="cat in categories"
            :key="cat.name"
            :to="`/categories?cat=${encodeURIComponent(cat.name)}`"
            class="cat-card"
          >
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ── API CTA ── -->
    <section class="section">
      <div class="container">
        <div class="api-card">
          <div class="api-card-left">
            <p class="section-eyebrow">Static JSON API</p>
            <h2 class="api-title">Ready for your tools</h2>
            <p class="api-desc">
              Frappe Local, custom hosting platforms, and community tools can consume the registry directly.
              No auth, no rate limits — just static JSON.
            </p>
            <RouterLink to="/docs" class="btn btn-primary">View API Docs →</RouterLink>
          </div>
          <div class="api-card-right">
            <div class="code-block">
              <div class="code-line"><span class="code-verb">GET</span> /index/apps.json</div>
              <div class="code-line"><span class="code-verb">GET</span> /index/frappe-15.json</div>
              <div class="code-line"><span class="code-verb">GET</span> /apps/erpnext.json</div>
              <div class="code-line"><span class="code-verb">GET</span> /api/apps?category=CRM</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Hero ── */
.hero {
  position: relative;
  overflow: hidden;
  padding: 100px 0 80px;
  text-align: center;
}
.hero-glow {
  position: absolute;
  inset: -50%;
  background: radial-gradient(ellipse 60% 50% at 50% 0%, hsla(221,80%,55%,0.15) 0%, transparent 70%);
  pointer-events: none;
}
.hero-content { position: relative; display: flex; flex-direction: column; align-items: center; gap: 24px; }
.hero-badge {}
.hero-title {
  font-size: clamp(40px, 7vw, 72px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  max-width: 700px;
}
.gradient-text {
  background: linear-gradient(135deg, var(--brand-400) 0%, var(--accent-400) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  font-size: 18px;
  color: var(--text-2);
  max-width: 480px;
  line-height: 1.7;
}
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.hero-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 16px 28px;
  margin-top: 8px;
}
.stat-pill { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-num { font-size: 22px; font-weight: 700; color: var(--text); }
.stat-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; }
.stat-divider { width: 1px; height: 36px; background: var(--border); }

/* ── Sections ── */
.section { padding: 80px 0; }
.section-alt { background: var(--bg-2); }
.section-header { text-align: center; margin-bottom: 48px; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.section-desc { color: var(--text-2); font-size: 16px; max-width: 480px; }
.section-cta { text-align: center; margin-top: 36px; }

/* ── Apps Grid ── */
.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.app-card { display: flex; flex-direction: column; gap: 12px; cursor: pointer; }
.app-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
.app-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  background: var(--bg-3);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-icon img { width: 100%; height: 100%; object-fit: cover; }
.app-icon-fallback { font-size: 20px; font-weight: 700; color: var(--brand-400); }
.app-title { font-size: 16px; font-weight: 700; color: var(--text); }
.app-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; flex: 1; }
.app-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: auto; }
.app-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.app-versions { font-size: 11px; color: var(--text-3); font-family: var(--font-mono); white-space: nowrap; }

/* Skeleton */
.loading-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.skeleton-card {
  height: 180px;
  border-radius: var(--r-lg);
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-3) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Categories ── */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}
.cat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  border-radius: var(--r-lg);
  background: var(--bg-card);
  border: 1px solid var(--border);
  transition: all var(--duration) var(--ease);
  cursor: pointer;
}
.cat-card:hover {
  border-color: var(--brand-500);
  background: var(--bg-3);
  transform: translateY(-2px);
}
.cat-icon { font-size: 28px; }
.cat-name { font-size: 13px; font-weight: 600; color: var(--text-2); text-align: center; }

/* ── API Card ── */
.api-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 56px;
}
.api-title { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin: 8px 0; }
.api-desc { font-size: 15px; color: var(--text-2); line-height: 1.7; margin-bottom: 24px; }
.code-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-2);
}
.code-line + .code-line { border-top: 1px solid var(--border); }
.code-verb { color: var(--accent-400); font-weight: 700; min-width: 36px; }

@media (max-width: 768px) {
  .hero { padding: 60px 0 48px; }
  .api-card { grid-template-columns: 1fr; padding: 32px 24px; gap: 28px; }
  .hero-stats { gap: 16px; padding: 14px 20px; flex-wrap: wrap; justify-content: center; }
}
</style>
