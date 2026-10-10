<template>
  <Dialog
    v-model="show"
    size="lg"
    position="top"
    bare
    @after-leave="searchQuery = ''"
  >
    <template #default>
      <div class="flex flex-col">
      <ul class="max-h-96 overflow-y-auto p-2">
        <TextInput
          class="mb-2"
          v-model="searchQuery"
          size="md"
          placeholder="Type a command…"
          autofocus
          @keydown="handleKeydown"
        >
          <template #prefix>
            <Icon icon="lucide-search" class="h-4 w-4 text-ink-gray-5" />
          </template>
        </TextInput>

        <li
          v-if="!flattenedItems.length"
          class="px-3 py-8 text-center text-p-sm text-ink-gray-5"
        >
          No results found.
        </li>

        <template v-for="group in groups" :key="group.title">
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
        class="flex items-center gap-4 border-t border-outline-elevation-2 px-4 py-2 text-p-xs text-ink-gray-5"
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

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { KeyboardShortcut, TextInput } from 'frappe-ui'

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update:searchQuery', value: string): void
  (e: 'select', item: any): void
}>()

const props = defineProps<{
  show?: boolean
  searchQuery?: string
  groups?: any[]
}>()

const show = computed({
  get: () => props.show ?? false,
  set: (value) => emit('update:show', value),
})

const searchQuery = computed({
  get: () => props.searchQuery ?? '',
  set: (value) => emit('update:searchQuery', value || ''),
})

const activeIndex = ref(0)

const flattenedItems = computed(() => {
  return props.groups?.flatMap(group => group.items) ?? []
})

watch([searchQuery, show], () => {
  activeIndex.value = 0
})

function run(item: any) {
  emit('select', item)
  show.value = false
}

function move(delta: number) {
  if (!flattenedItems.value.length) return
  activeIndex.value = (activeIndex.value + delta + flattenedItems.value.length) % flattenedItems.value.length
}

function onEnter() {
  const item = flattenedItems.value[activeIndex.value]
  if (item) run(item)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    onEnter()
  }
}

function keydownWatcher(e: KeyboardEvent) {
  if (e.key === 'Escape' && show.value) {
    show.value = false
    e.preventDefault()
  }

  if (
    e.key === 'k' &&
    (e.ctrlKey || e.metaKey) &&
    !(e.target as HTMLElement)?.classList?.contains('ProseMirror')
  ) {
    show.value = true
    e.preventDefault()
  }
}

onMounted(() => window.addEventListener('keydown', keydownWatcher))
onBeforeUnmount(() => window.removeEventListener('keydown', keydownWatcher))
</script>
