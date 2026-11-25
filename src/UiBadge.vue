<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import type { UiBadgeViewProps } from '@uninterface/uninterface/backend'
  defineProps<UiBadgeViewProps>()
  import UBadge from '@nuxt/ui/components/Badge.vue'
</script>
<template>
  <UBadge
    class="nuxt-badge"
    :color="color === 'danger' ? 'error' : color"
  >
    <slot />
  </UBadge>
</template>
