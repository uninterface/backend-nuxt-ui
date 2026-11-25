<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import UEmpty from '@nuxt/ui/components/Empty.vue'
  import type { UiEmptyViewProps } from '@uninterface/uninterface/backend'
  defineProps<UiEmptyViewProps>()
</script>
<template>
  <UEmpty
    variant="naked"
    class="nuxt-empty"
  >
    <template #description>
      <slot>{{ label }}</slot>
    </template>
    <template
      v-if="$slots.icon"
      #leading
    >
      <slot name="icon" />
    </template>
    <template
      v-if="$slots.actions"
      #actions
    >
      <slot name="actions" />
    </template>
  </UEmpty>
</template>
