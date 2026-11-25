<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import type { UiLinkViewProps } from '@uninterface/uninterface/backend'
  defineProps<UiLinkViewProps>()
  import ULink from '@nuxt/ui/components/Link.vue'
</script>
<template>
  <ULink
    :href="href"
    :aria-current="current ? 'page' : undefined"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? 0 : undefined"
    :disabled="disabled"
    :class="
      color
        ? `text-${color === 'danger' ? 'error' : color === 'info' ? 'info' : color}`
        : undefined
    "
  >
    <slot name="icon" />
    <slot />
  </ULink>
</template>
