<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from 'frappe-ui'
import { appUrl, badgeHtml, badgeImageUrl, badgeMarkdown } from '../site'

const props = defineProps<{
  slug: string
}>()

const copied = ref<string | null>(null)

const snippets = computed(() => [
  { id: 'markdown', label: 'Markdown', code: badgeMarkdown(props.slug) },
  { id: 'html', label: 'HTML', code: badgeHtml(props.slug) },
])

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = text
  setTimeout(() => { copied.value = null }, 2000)
}
</script>

<template>
  <div class="rounded-lg border border-outline-gray-2 bg-surface-white overflow-hidden">
    <div class="px-4 py-3 border-b border-outline-gray-1 bg-surface-gray-1">
      <h2 class="text-xs font-semibold text-ink-gray-4 uppercase tracking-widest">README Badge</h2>
    </div>
    <div class="px-4 py-4 space-y-4">
      <p class="text-sm text-ink-gray-5 leading-relaxed">
        Show that your app is listed on Frappe Brewery. Add this badge to your README or project website.
      </p>
      <a
        :href="appUrl(slug)"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-ink-gray-3"
      >
        <img :src="badgeImageUrl()" alt="Listed on Frappe Brewery" height="28" width="240" />
      </a>
      <div v-for="snippet in snippets" :key="snippet.id" class="rounded-lg border border-outline-gray-1 overflow-hidden">
        <div class="flex items-center justify-between px-3 py-2 bg-surface-gray-1 border-b border-outline-gray-1">
          <span class="text-xs font-semibold text-ink-gray-5 uppercase tracking-wider">{{ snippet.label }}</span>
          <Button
            variant="ghost"
            :theme="copied === snippet.code ? 'green' : 'gray'"
            :icon-left="copied === snippet.code ? 'check' : 'copy'"
            @click="copy(snippet.code)"
          >
            {{ copied === snippet.code ? 'Copied' : 'Copy' }}
          </Button>
        </div>
        <pre class="px-3 py-2.5 font-mono text-xs text-ink-gray-6 overflow-x-auto bg-surface-white leading-relaxed">{{ snippet.code }}</pre>
      </div>
    </div>
  </div>
</template>
