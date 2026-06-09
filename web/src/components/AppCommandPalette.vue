<template>
  <Dialog
    v-model="show"
    :options="{ size: 'lg', position: 'top' }"
    bare
    @after-leave="searchQuery = ''"
  >
    <template #body>
      <div class="flex flex-col">
      <ul class="max-h-96 overflow-y-auto p-2">
        <TextInput
          class="mb-2"
          v-model="searchQuery"
          size="md"
          placeholder="Type a command…"
          autofocus
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="onEnter"
        >
          <template #prefix>
            <FeatherIcon name="search" class="h-4 w-4 text-ink-gray-5" />
          </template>
        </TextInput>

        <li
          v-if="!flattenedItems.length"
          class="px-3 py-8 text-center text-p-sm text-ink-gray-5"
        >
          No results found.
        </li>

        <template v-for="(group, groupIndex) in groups" :key="group.title">
          <div
            class="mb-2.5 px-4.5 mt-4.5 first:mt-3 text-base text-ink-gray-5"
            v-if="!group.hideTitle && group.items.length > 0"
          >
            {{ group.title }}
          </div>
          <li
            v-for="item in group.items"
            :key="item.name"
            class="outline-none"
            @mouseenter="activeIndex = flattenedItems.findIndex(i => i.name === item.name)"
            @click="run(item)"
          >
            <component
              :is="group.component"
              :item="item"
              :active="activeIndex === flattenedItems.findIndex(i => i.name === item.name)"
            />
          </li>
        </template>
      </ul>

      <div
        class="flex items-center gap-4 border-t border-outline-gray-modals px-4 py-2 text-p-xs text-ink-gray-5"
      >
        <span class="flex items-center gap-1.5">
          <KeyboardShortcut combo="ArrowUp" bg />
          <KeyboardShortcut combo="ArrowDown" bg />
          Navigate
        </span>
        <span class="flex items-center gap-1.5">
          <KeyboardShortcut combo="Enter" bg />
          Select
        </span>
        <span class="ml-auto flex items-center gap-1.5">
          <KeyboardShortcut combo="Escape" bg />
          Close
        </span>
      </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { KeyboardShortcut, TextInput } from 'frappe-ui'

const emit = defineEmits(['update:show', 'update:searchQuery', 'select'])
const props = defineProps({
  show: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  groups: { type: Array, default: () => [] },
})

const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value),
})

const activeIndex = ref(0)

const flattenedItems = computed(() => {
  return props.groups.flatMap(group => group.items)
})

watch([searchQuery, show], () => {
  activeIndex.value = 0
})

function run(item) {
  emit('select', item)
  show.value = false
}

function move(delta) {
  if (!flattenedItems.value.length) return
  activeIndex.value = (activeIndex.value + delta + flattenedItems.value.length) % flattenedItems.value.length
}

function onEnter() {
  const item = flattenedItems.value[activeIndex.value]
  if (item) run(item)
}

function keydownWatcher(e) {
  if (e.key === 'Escape' && show.value) {
    show.value = false
    e.preventDefault()
  }

  if (
    e.key === 'k' &&
    (e.ctrlKey || e.metaKey) &&
    !e.target.classList.contains('ProseMirror')
  ) {
    show.value = true
    e.preventDefault()
  }
}

onMounted(() => window.addEventListener('keydown', keydownWatcher))
onBeforeUnmount(() => window.removeEventListener('keydown', keydownWatcher))
</script>
