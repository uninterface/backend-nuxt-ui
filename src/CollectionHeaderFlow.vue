<script setup lang="ts">
  import { ref } from 'vue'
  import { useUiCollectionHeaderAlignment } from '@uninterface/uninterface/backend'
  const props = defineProps<{
    alignEditors?: boolean
    placeActions?: (placement: 'filters' | 'sort' | 'after') => void
  }>()
  const row = ref<HTMLElement>()
  useUiCollectionHeaderAlignment(
    row,
    () => !props.alignEditors,
    '.nuxt-button',
    (placement) => props.placeActions?.(placement),
  )
</script>
<template>
  <div
    ref="row"
    class="nuxt-collection-header-primary"
    :data-align-editors="alignEditors ? '' : undefined"
  >
    <slot />
  </div>
</template>
