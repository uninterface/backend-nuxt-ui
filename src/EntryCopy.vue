<script setup lang="ts">
  import UIcon from '@nuxt/ui/components/Icon.vue'
  import UKbd from '@nuxt/ui/components/Kbd.vue'
  import { useAppConfig } from '#imports'
  import { useMenuTheme } from './menuTheme'
  import type { UiEntryViewNode } from '@uninterface/uninterface/backend'
  defineProps<{
    node: UiEntryViewNode
    iconColumn?: boolean
    direction?: 'ltr' | 'rtl'
    descriptionId?: string
  }>()
  defineSlots<{
    entry(props: { entry: any }): any
    icon(props: { entry: any; icon?: unknown }): any
  }>()
  const ui = useMenuTheme()
  const config = useAppConfig()
</script>
<template>
  <span
    v-if="iconColumn || ('icon' in node.entry && node.entry.icon)"
    class="nuxt-entry-icon"
    :class="ui.itemLeadingIcon()"
    aria-hidden="true"
  >
    <slot
      v-if="'icon' in node.entry && node.entry.icon"
      name="icon"
      :entry="node.entry"
      :icon="'icon' in node.entry ? node.entry.icon : undefined"
    />
  </span>
  <span :class="ui.itemWrapper()">
    <span :class="ui.itemLabel()">
      <slot
        name="entry"
        :entry="node.entry"
      >
        {{ 'label' in node.entry ? node.entry.label : '' }}
      </slot>
    </span>
    <span
      v-if="'description' in node.entry && node.entry.description"
      :id="descriptionId"
      :class="ui.itemDescription()"
    >
      {{ node.entry.description }}
    </span>
  </span>
  <span
    v-if="
      node.entry.kind === 'submenu' ||
      (node.selectionMode && node.selected) ||
      ('shortcut' in node.entry && node.entry.shortcut)
    "
    :class="ui.itemTrailing()"
    aria-hidden="true"
  >
    <UIcon
      v-if="node.entry.kind === 'submenu'"
      :name="
        direction === 'rtl'
          ? config.ui?.icons.chevronLeft
          : config.ui?.icons.chevronRight
      "
      :class="ui.itemTrailingIcon()"
    />
    <UIcon
      v-else-if="node.selectionMode && node.selected"
      :name="config.ui?.icons.check"
      :class="ui.itemTrailingIcon()"
    />
    <span
      v-if="'shortcut' in node.entry && node.entry.shortcut"
      :class="ui.itemTrailingKbds()"
    >
      <UKbd>{{ node.entry.shortcut }}</UKbd>
    </span>
  </span>
</template>
