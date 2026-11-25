<script setup lang="ts">
  import {
    useUiZView,
    type UiCollectionHeaderViewProps,
  } from '@uninterface/uninterface/backend'
  useUiZView()
  defineProps<UiCollectionHeaderViewProps>()
</script>
<template>
  <div
    class="nuxt-collection-header"
    data-ui-collection-header
    :data-adaptation="adaptation"
  >
    <slot />
  </div>
</template>
