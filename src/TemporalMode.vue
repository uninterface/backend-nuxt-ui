<script setup lang="ts">
  import { computed, ref, watch, onDeactivated } from 'vue'
  import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
  import TemporalRangeIcon from './TemporalRangeIcon.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import {
    useUiControlFrameParticipant,
    focusUiTarget,
    useUiOverlayTarget,
    type UiTemporalBoundaryMode,
  } from '@uninterface/uninterface/backend'
  const props = defineProps<{
    value: UiTemporalBoundaryMode
    modes: { value: UiTemporalBoundaryMode; label: string; symbol: string }[]
    label: string
    disabled: boolean
  }>()
  const emit = defineEmits<{ change: [value: UiTemporalBoundaryMode] }>()
  const trigger = ref<{ $el?: HTMLButtonElement }>()
  const focus = () =>
    focusUiTarget(
      () => trigger.value?.$el,
      () => props.disabled,
    )
  defineExpose({ focus })
  const open = ref(false)
  const portal = useUiOverlayTarget()
  const { setEngaged } = useUiControlFrameParticipant({
    focus: async () => null,
  })
  watch(open, setEngaged, { flush: 'sync' })
  watch(
    () => props.disabled,
    (value) => {
      if (value) open.value = false
    },
  )
  onDeactivated(() => {
    open.value = false
  })
  const selected = computed(() =>
    props.modes.find((mode) => mode.value === props.value),
  )
  const items = computed(() =>
    props.modes.map((mode) => ({
      label: mode.label,
      mode: mode.value,
      type: 'checkbox' as const,
      checked: mode.value === props.value,
      onSelect: () => {
        if (!props.disabled) emit('change', mode.value)
      },
    })),
  )
</script>
<template>
  <UDropdownMenu
    :open="open"
    :items="items"
    :portal="portal"
    @update:open="open = !disabled && $event"
  >
    <template #item-leading="{ item }">
      <TemporalRangeIcon
        :mode="item.mode"
        data-temporal-mode-icon
      />
    </template>
    <UButton
      ref="trigger"
      color="neutral"
      variant="link"
      size="sm"
      :disabled="disabled"
      data-temporal-mode
      :aria-label="label + ': ' + selected?.label"
      :aria-expanded="open"
      aria-haspopup="menu"
    >
      <TemporalRangeIcon :mode="value" />
    </UButton>
  </UDropdownMenu>
</template>
