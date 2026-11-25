<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { computed } from 'vue'
  import {
    useUiNativeTabList,
    type UiTabsViewProps,
  } from '@uninterface/uninterface/backend'
  import UTabs from '@nuxt/ui/components/Tabs.vue'
  const props = defineProps<UiTabsViewProps>()
  const emit = defineEmits<{ select: [key: string] }>()
  const { root, keydown, focusin } = useUiNativeTabList(props, (key) =>
    emit('select', key),
  )
  const nativeItems = computed(() =>
    props.items.map((item) => ({ ...item, value: item.key })),
  )
  function select(value: string | number) {
    emit('select', String(value))
  }
</script>
<template>
  <div
    ref="root"
    class="nuxt-tabs"
    @keydown.capture="keydown"
    @focusin="focusin"
  >
    <UTabs
      :items="nativeItems"
      :model-value="items.find((item) => item.selected)?.key"
      :orientation="orientation"
      activation-mode="manual"
      :content="false"
      :ui="{ trigger: 'nuxt-control-focus' }"
      @update:model-value="select"
    >
      <template #default="{ item }"><slot :item="item" /></template>
    </UTabs>
  </div>
</template>
