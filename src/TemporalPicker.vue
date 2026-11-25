<script setup lang="ts">
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { shallowRef } from 'vue'
  import { popupTarget } from './zOrder'
  const zPopup = shallowRef<HTMLElement>()
  useUiZPopup(() => popupTarget(zPopup.value))
  import { onDeactivated, onScopeDispose } from 'vue'
  import { computed, ref, watch, nextTick } from 'vue'
  import type { UiTemporalEditorViewProps } from '@uninterface/uninterface/backend'
  import { useUiI18n } from '@uninterface/uninterface'
  import { useUiOverlayTarget } from '@uninterface/uninterface/backend'
  import UPopover from '@nuxt/ui/components/Popover.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import TemporalIcon from './TemporalIcon.vue'
  const portal = useUiOverlayTarget()
  const props = defineProps<UiTemporalEditorViewProps>()
  const open = ref(false),
    i18n = useUiI18n()
  const pickerLabel = computed(() =>
    i18n.text({
      namespace: 'uninterface',
      key:
        props.kind === 'date'
          ? 'pickDate'
          : props.kind === 'time'
            ? 'pickTime'
            : 'pickDateTime',
    }),
  )
  const draftDate = ref(''),
    draftTime = ref('')
  function syncDraft(value: string) {
    draftDate.value = props.kind === 'time' ? '' : (value.split('T')[0] ?? '')
    draftTime.value =
      props.kind === 'time' ? value : (value.split('T')[1] ?? '')
  }
  watch(() => props.value, syncDraft, { immediate: true })
  watch(open, (visible) => {
    if (visible) syncDraft(props.value)
  })
  const date = computed(() => draftDate.value)
  const clock = computed(() => draftTime.value)
  function chosen(value: string) {
    if (props.binding.disabled || props.readonly) return
    if (props.eligible(value)) {
      props.update(value)
      void nextTick(() => props.blur())
      if (props.kind === 'date') open.value = false
    }
  }
  function chooseDate(value: string) {
    if (props.binding.disabled || props.readonly) return
    draftDate.value = value
    if (props.kind === 'datetime') {
      if (clock.value) chosen(value + 'T' + clock.value)
      else {
        props.update(value + 'T')
        void nextTick(() => props.blur())
      }
      open.value = false
    } else chosen(value)
  }

  import UCalendar from '@nuxt/ui/components/Calendar.vue'
  import { parseDate } from '@internationalized/date'
  watch(
    () => [props.binding.disabled, props.readonly],
    () => {
      if (props.binding.disabled || props.readonly) open.value = false
    },
  )
  const nativeDate = computed(() => {
    try {
      return parseDate(date.value)
    } catch {
      return undefined
    }
  })
  onDeactivated(() => {
    open.value = false
  })
  defineExpose({
    show() {
      if (!props.binding.disabled && !props.readonly) open.value = true
    },
  })
  const emit = defineEmits<{ 'open-change': [open: boolean] }>()
  watch(open, (value) => emit('open-change', value), { flush: 'sync' })
  onScopeDispose(() => emit('open-change', false))
</script>
<template>
  <UPopover
    :open="open"
    :portal="portal"
    :content="{
      side: 'bottom',
      align: 'start',
    }"
    @update:open="open = !binding.disabled && !readonly && $event"
  >
    <UButton
      @keydown.esc.stop.prevent="open = false"
      type="button"
      color="neutral"
      variant="link"
      size="sm"
      :disabled="binding.disabled || readonly"
      :aria-label="pickerLabel + (label ? ' — ' + label : '')"
      :aria-expanded="open"
      aria-haspopup="dialog"
      data-temporal-trigger
    >
      <TemporalIcon :time="kind === 'time'" />
    </UButton>
    <template #content>
      <div
        role="dialog"
        :aria-label="pickerLabel"
        ref="zPopup"
        data-temporal-popup
        @keydown.esc.capture.stop.prevent="open = false"
        class="p-2"
      >
        <UCalendar
          v-if="kind !== 'time'"
          :model-value="nativeDate"
          :is-date-unavailable="
            kind === 'date'
              ? (value: any) => !eligible(value.toString())
              : undefined
          "
          @update:model-value="chooseDate(String($event ?? ''))"
        />
      </div>
    </template>
  </UPopover>
</template>
