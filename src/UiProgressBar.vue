<script setup lang="ts">
  import {
    useUiZView,
    type UiProgressBarViewProps,
  } from '@uninterface/uninterface/backend'
  import UProgress from '@nuxt/ui/components/Progress.vue'
  useUiZView()
  defineProps<UiProgressBarViewProps>()
  // UProgress forwards attributes to an outer root, not its ProgressRoot.
  // Own semantics here and hide the native visual from AT to avoid duplication.
</script>
<template>
  <div
    class="nuxt-ui-progress-bar"
    data-ui-progress-bar
    :data-state="value === null ? 'indeterminate' : 'determinate'"
    role="progressbar"
    :aria-label="label"
    :aria-valuetext="valueText"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value ?? undefined"
    :style="{
      '--ui-progress-remaining':
        fraction === null ? undefined : `${(1 - fraction) * 100}%`,
    }"
  >
    <UProgress
      aria-hidden="true"
      orientation="horizontal"
      :model-value="value"
      :max="max"
      :color="color === 'danger' ? 'error' : color"
      :status="false"
    />
  </div>
</template>
