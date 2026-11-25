<script setup lang="ts">
  import DrawerDepth from './DrawerDepth.vue'
  import type { UiDrawerEdge } from '@uninterface/uninterface'
  defineProps<{ edge: UiDrawerEdge }>()
</script>
<template>
  <div
    class="nuxt-drawer-dock"
    :data-edge="edge"
  >
    <div class="nuxt-drawer-dock-motion"><slot /></div>
    <DrawerDepth :edge="edge" />
  </div>
</template>
