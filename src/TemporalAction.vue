<script setup lang="ts">
  import UButton from '@nuxt/ui/components/Button.vue'
  defineProps<{
    label: string
    disabled: boolean
    active?: boolean
    clear?: boolean
  }>()
  defineEmits<{ click: [] }>()
</script>
<template>
  <UButton
    type="button"
    color="neutral"
    variant="ghost"
    :disabled="disabled"
    :aria-label="label"
    :title="label"
    :aria-pressed="clear ? undefined : active"
    :data-temporal-unbounded="!clear ? '' : undefined"
    :data-temporal-clear="clear ? '' : undefined"
    @mousedown.prevent
    @click="$emit('click')"
  >
    <span aria-hidden="true">{{ clear ? '×' : '∞' }}</span>
  </UButton>
</template>
