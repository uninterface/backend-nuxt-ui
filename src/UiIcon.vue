<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import type { UiIconViewProps } from '@uninterface/uninterface/backend'
  const colors = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    danger: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  }
  defineProps<UiIconViewProps>()
</script>
<template>
  <span
    class="icon-frame"
    :class="tone ? colors[tone as keyof typeof colors] : undefined"
  >
    <slot />
  </span>
</template>
<style scoped>
  .icon-frame {
    display: inline-flex;
    flex: none;
    width: 1em;
    height: 1em;
    vertical-align: -0.125em;
  }
</style>
