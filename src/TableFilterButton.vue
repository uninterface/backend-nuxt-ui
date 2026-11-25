<script setup lang="ts">
  import UButton from '@nuxt/ui/components/Button.vue'
  import FilterIcon from './icons/filter.vue'
  defineProps<{ active: boolean; disabled: boolean }>()
</script>
<template>
  <UButton
    type="button"
    :color="active ? 'primary' : 'neutral'"
    variant="ghost"
    size="xs"
    square
    class="nuxt-table-filter"
    :disabled="disabled"
    :data-filter-active="active || undefined"
  >
    <span aria-hidden="true"><FilterIcon class="table-filter-icon" /></span>
  </UButton>
</template>
