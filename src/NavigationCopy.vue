<script setup lang="ts">
  import UIcon from '@nuxt/ui/components/Icon.vue'
  import { useAppConfig } from '#imports'
  import type { UiEntryViewNode } from '@uninterface/uninterface/backend'
  type Entry = Exclude<UiEntryViewNode['entry'], { kind: 'separator' }>
  defineSlots<{
    entry?: (props: { entry: Entry }) => unknown
    icon?: (props: {
      entry: Entry
      icon: NonNullable<Entry['icon']>
    }) => unknown
  }>()
  defineProps<{
    node: UiEntryViewNode
    ui: Record<string, (options?: any) => string>
    rail?: boolean
    iconColumn?: boolean
    tree?: boolean
  }>()
  const config = useAppConfig()
</script>
<template>
  <template v-if="node.entry.kind !== 'separator'">
    <span
      v-if="node.entry.icon || iconColumn"
      class="nuxt-navigation-icon"
      :class="ui.linkLeadingIcon()"
      aria-hidden="true"
    >
      <slot
        v-if="node.entry.icon"
        name="icon"
        :entry="node.entry"
        :icon="node.entry.icon"
      />
    </span>
    <span :class="rail ? 'sr-only' : ui.linkLabel()">
      <slot
        name="entry"
        :entry="node.entry"
      >
        {{ node.entry.label }}
      </slot>
    </span>
    <span
      v-if="node.entry.kind === 'submenu' && !rail"
      :class="ui.linkTrailing()"
      aria-hidden="true"
    >
      <UIcon
        :name="
          tree ? config.ui?.icons.chevronDown : config.ui?.icons.chevronRight
        "
        :class="ui.linkTrailingIcon()"
      />
    </span>
  </template>
</template>
