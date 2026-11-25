<script setup lang="ts">
  import type { UiDrawerEdge } from '@uninterface/uninterface'
  defineProps<{ edge: UiDrawerEdge }>()
</script>
<template>
  <span
    class="nuxt-drawer-depth"
    :data-edge="edge"
    aria-hidden="true"
  >
    <span class="nuxt-drawer-depth-shadow" />
  </span>
</template>
