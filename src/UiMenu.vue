<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { useUiOverlayTarget } from '@uninterface/uninterface/backend'
  const overlayTarget = useUiOverlayTarget()
  import { uiFocusPresentation } from './focus'
  import { computed, ref, onActivated, onDeactivated } from 'vue'
  import { DropdownMenuRoot, DropdownMenuPortal } from 'reka-ui'
  import {
    useUiMenuView,
    type UiMenuViewBinding,
  } from '@uninterface/uninterface/backend'
  import EntryBranch from './EntryBranch.vue'
  import EntrySurface from './EntrySurface.vue'
  import { useNativeDirection } from './nativeDirection'
  const props = defineProps<{ binding: UiMenuViewBinding }>()
  const emit = defineEmits<{
    open: []
    close: []
    activate: [key: string]
    expand: [key: string, open: boolean]
    retry: [key?: string]
  }>()
  const { host, id, anchor, point, hostBindings, activated, close } =
    useUiMenuView(() => props.binding, emit, {
      contextTriggerClass: uiFocusPresentation.class,
      nativeInteraction: (event) => !event || event.key !== 'Tab',
    })
  const direction = useNativeDirection(() => anchor.value ?? host.value)
  const active = ref(true)
  onDeactivated(() => {
    active.value = false
  })
  onActivated(() => {
    active.value = true
  })
  const inline = computed(() => props.binding.mode === 'inline')
</script>
<template>
  <div
    ref="host"
    :class="{ 'nuxt-menu-inline': inline }"
  >
    <slot
      v-if="!inline"
      name="host"
      v-bind="hostBindings"
    />
    <DropdownMenuRoot
      v-if="active"
      :open="binding.open"
      :modal="false"
      :dir="direction"
      @update:open="
        (open) => {
          if (!open && !inline) close(false)
        }
      "
    >
      <DropdownMenuPortal
        :disabled="inline"
        :to="overlayTarget"
      >
        <EntrySurface
          v-if="binding.open"
          :id="id"
          :label="binding.label"
          :pending="binding.status.pending"
          :anchor="anchor"
          :point="point"
          :inline="inline"
          @close="!inline && close()"
        >
          <EntryBranch
            :entries="binding.entries"
            :status="binding.status"
            :label="binding.label"
            :direction="direction"
            @activate="activated"
            @expand="(key, open) => emit('expand', key, open)"
            @retry="emit('retry', $event)"
          >
            <template #entry="scope">
              <slot
                name="entry"
                v-bind="scope"
              />
            </template>
            <template #icon="scope">
              <slot
                name="icon"
                v-bind="scope"
              />
            </template>
          </EntryBranch>
        </EntrySurface>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
