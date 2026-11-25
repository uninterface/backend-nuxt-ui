<script setup lang="ts">
  import { onDeactivated, shallowRef as zRef } from 'vue'
  import { useId } from 'vue'
  import {
    useUiZPopup,
    useUiOverlayTarget,
  } from '@uninterface/uninterface/backend'
  import { controlledPopup } from './zOrder'
  const zId = useId(),
    portal = useUiOverlayTarget()
  useUiZPopup(() => controlledPopup(zId))
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import USelect from '@nuxt/ui/components/Select.vue'
  import type { UiPaginatorSizeSelectViewProps } from '@uninterface/uninterface/backend'
  defineProps<UiPaginatorSizeSelectViewProps>()
  const opened = zRef(false)
  onDeactivated(() => {
    opened.value = false
  })
</script>
<template>
  <USelect
    v-model:open="opened"
    :id="zId"
    :portal="portal"
    class="nuxt-paginator-size"
    :aria-label="label"
    :model-value="value"
    :items="[...options]"
    :disabled="disabled"
    :aria-busy="pending"
    @update:model-value="(value) => select(Number(value))"
  >
    <template #item-label="{ item }">
      <span :data-uninterface-key="String(item.value)">{{ item.label }}</span>
    </template>
  </USelect>
</template>
