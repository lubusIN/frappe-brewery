<template>
  <RouterLink
    :to="`/apps/${app.slug}`"
    class="group flex flex-col gap-3 p-5 rounded-lg border border-outline-gray-1 bg-surface-white hover:border-outline-gray-4 transition-colors duration-200"
    :aria-label="`View ${app.title}`"
  >
    <div class="flex items-start justify-between gap-3">
      <Avatar shape="square" size="2xl" :image="app.media?.icon" :label="app.title" />
      <div class="flex gap-1.5 flex-wrap">
        <Badge v-if="app.meta?.verified" theme="green" label="Verified">
          <template #prefix><FeatherIcon name="check" class="w-3 h-3" /></template>
        </Badge>
        <slot name="badges" />
      </div>
    </div>
    <div class="flex-1">
      <h3 class="text-base font-semibold text-ink-gray-9">{{ app.title }}</h3>
      <p class="text-sm text-ink-gray-5 mt-1.5 leading-relaxed line-clamp-2">{{ app.description }}</p>
    </div>
    <div class="flex items-center gap-1.5 flex-wrap mt-auto pt-3 border-t border-outline-gray-1">
      <slot name="footer">
        <Badge v-for="cat in app.categories?.slice(0, 1)" :key="cat" theme="gray" :label="cat" />
        <span class="text-xs text-ink-gray-3 font-mono ml-auto">{{ app.license }}</span>
      </slot>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { FeatherIcon, Avatar, Badge } from 'frappe-ui'
import type { App } from '../types'

defineProps<{ app: App }>()
</script>
