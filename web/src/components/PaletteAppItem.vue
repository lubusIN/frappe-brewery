<template>
  <div
    class="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-colors"
    :class="active ? 'bg-surface-gray-2' : ''"
  >
    <div v-if="item.icon && !imageError" class="w-8 h-8 rounded shrink-0 overflow-hidden bg-surface-gray-1 border border-outline-gray-1 flex items-center justify-center">
      <img :src="item.icon" class="w-full h-full object-cover" @error="imageError = true" />
    </div>
    <div v-else class="w-8 h-8 rounded shrink-0 bg-surface-gray-2 border border-outline-gray-2 flex items-center justify-center">
      <FeatherIcon name="box" class="w-4 h-4 text-ink-gray-5" />
    </div>
    <div class="flex flex-col min-w-0">
      <div class="text-sm font-medium text-ink-gray-9 truncate">
        {{ item.title }}
      </div>
      <div class="text-xs text-ink-gray-5 truncate">
        {{ item.description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FeatherIcon } from 'frappe-ui'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const imageError = ref(false)

// Reset error state if the icon URL changes
watch(() => props.item.icon, () => {
  imageError.value = false
})
</script>
