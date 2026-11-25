<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import type { UiLoadingIndicatorViewProps } from '@uninterface/uninterface/backend'
  import UIcon from '@nuxt/ui/components/Icon.vue'
  import { useAppConfig } from '#imports'
  const appConfig = useAppConfig()
  import { computed } from 'vue'
  import {
    useUiStrategy,
    uiControlSizeQuery,
  } from '@uninterface/uninterface/backend'
  const requestedSize = useUiStrategy(uiControlSizeQuery, [-2, -1, 0, 1, 2])
  const scale = computed(() =>
    requestedSize.value.status === 'answered' ? requestedSize.value.value : 0,
  )
  defineProps<UiLoadingIndicatorViewProps>()
</script>
<template>
  <span
    class="nuxt-loading-indicator"
    :style="{ fontSize: `${1 + scale * 0.125}em` }"
  >
    <UIcon
      :name="appConfig.ui?.icons?.loading ?? 'i-lucide-loader-circle'"
      class="animate-spin"
      aria-hidden="true"
    />
    <slot>
      <span class="nuxt-loading-label-hidden">{{ label }}</span>
    </slot>
  </span>
</template>
