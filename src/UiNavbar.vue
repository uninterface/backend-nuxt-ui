<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()
</script>
<template>
  <nav class="nuxt-navbar">
    <div
      v-if="$slots.brand"
      class="nuxt-navbar-brand"
    >
      <slot name="brand" />
    </div>
    <div
      v-if="$slots.default"
      class="nuxt-navbar-links"
    >
      <slot />
    </div>
    <div
      v-if="$slots.actions"
      class="nuxt-navbar-actions"
    >
      <slot name="actions" />
    </div>
  </nav>
</template>
