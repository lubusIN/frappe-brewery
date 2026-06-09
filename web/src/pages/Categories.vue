<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { fetchCategories } from '../api'
import type { CategoriesResponse, CategoryEntry } from '../types'

const route = useRoute()
const data = ref<CategoriesResponse | null>(null)
const loading = ref(true)
const selected = ref((route.query.cat as string) || '')

const CATEGORY_ICONS: Record<string, string> = {
  'CRM': '🤝',
  'HR': '👥',
  'Accounting': '📊',
  'Manufacturing': '🏭',
  'POS': '🏪',
  'Healthcare': '🏥',
  'Education': '🎓',
  'Integration': '🔗',
  'Payments': '💳',
  'Reports': '📈',
  'Developer Tools': '🛠️',
  'AI': '🤖',
  'Utilities': '⚡',
}

const allCategories = computed(() => data.value?.categories ?? [])
const activeCategory = computed<CategoryEntry | undefined>(() =>
  selected.value ? allCategories.value.find(c => c.name === selected.value) : undefined
)

onMounted(async () => {
  try {
    data.value = await fetchCategories()
    if (!selected.value && allCategories.value.length) {
      selected.value = allCategories.value[0].name
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="categories-page">
    <section class="page-header">
      <div class="container">
        <h1 class="section-title">Categories</h1>
        <p class="page-subtitle">Browse apps by category</p>
      </div>
    </section>

    <div class="container categories-layout">
      <!-- Category list -->
      <aside class="cat-list" aria-label="Category list">
        <div v-if="loading">
          <div v-for="i in 8" :key="i" class="cat-skeleton"></div>
        </div>
        <nav v-else role="navigation" aria-label="App categories">
          <button
            v-for="cat in allCategories"
            :key="cat.name"
            class="cat-btn"
            :class="{ active: selected === cat.name }"
            :aria-pressed="selected === cat.name"
            @click="selected = cat.name"
          >
            <span class="cat-icon">{{ CATEGORY_ICONS[cat.name] ?? '📦' }}</span>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count">{{ cat.count }}</span>
          </button>
        </nav>
      </aside>

      <!-- Apps in selected category -->
      <main class="cat-apps" aria-label="Apps in category">
        <div v-if="loading" class="apps-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card"></div>
        </div>

        <template v-else-if="activeCategory">
          <div class="cat-apps-header">
            <h2 class="cat-apps-title">
              <span>{{ CATEGORY_ICONS[activeCategory.name] ?? '📦' }}</span>
              {{ activeCategory.name }}
            </h2>
            <span class="cat-apps-count">{{ activeCategory.count }} app{{ activeCategory.count !== 1 ? 's' : '' }}</span>
          </div>

          <div class="apps-grid">
            <RouterLink
              v-for="app in activeCategory.apps"
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
                <span v-if="app.verified" class="badge badge-green">✓</span>
              </div>
              <h3 class="app-title">{{ app.title }}</h3>
              <p class="app-desc">{{ app.description }}</p>
              <div class="app-versions">
                <span v-for="v in app.frappe_versions" :key="v" class="tag">v{{ v }}</span>
                <span class="tag">{{ app.license }}</span>
              </div>
            </RouterLink>
          </div>
        </template>

        <div v-else class="empty-state">
          <p>Select a category to browse apps</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.categories-page { padding-bottom: 80px; }
.page-header { padding: 48px 0 32px; border-bottom: 1px solid var(--border); margin-bottom: 40px; }
.page-subtitle { color: var(--text-3); margin-top: 4px; font-size: 14px; }

.categories-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 40px;
  align-items: start;
}

/* Category list */
.cat-list { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 4px; }
.cat-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--r-md);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-2);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration) var(--ease);
  text-align: left;
}
.cat-btn:hover { background: var(--bg-3); color: var(--text); }
.cat-btn.active { background: hsla(221,80%,55%,0.1); border-color: hsla(221,80%,55%,0.2); color: var(--brand-400); }
.cat-icon { font-size: 16px; }
.cat-name { flex: 1; font-weight: 500; }
.cat-count { font-size: 12px; color: var(--text-3); background: var(--bg-2); padding: 2px 7px; border-radius: var(--r-full); }
.cat-btn.active .cat-count { background: hsla(221,80%,55%,0.15); color: var(--brand-400); }

.cat-skeleton { height: 42px; border-radius: var(--r-md); background: var(--bg-card); margin-bottom: 4px; animation: shimmer 1.5s infinite; }

/* Apps */
.cat-apps-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.cat-apps-title { font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
.cat-apps-count { font-size: 13px; color: var(--text-3); background: var(--bg-3); padding: 4px 12px; border-radius: var(--r-full); border: 1px solid var(--border); }

.apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }
.app-card { display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
.app-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
.app-icon {
  width: 44px; height: 44px;
  border-radius: var(--r-md);
  background: var(--bg-3);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.app-icon img { width: 100%; height: 100%; object-fit: cover; }
.app-icon-fallback { font-size: 20px; font-weight: 700; color: var(--brand-400); }
.app-title { font-size: 15px; font-weight: 700; }
.app-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.app-versions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto; }

.skeleton-card { height: 180px; border-radius: var(--r-lg); background: var(--bg-card); animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

.empty-state { color: var(--text-3); padding: 60px 0; text-align: center; }

@media (max-width: 768px) {
  .categories-layout { grid-template-columns: 1fr; }
  .cat-list { position: static; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
}
</style>
