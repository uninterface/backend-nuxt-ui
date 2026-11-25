<script setup lang="ts">
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { popupTarget } from './zOrder'
  const zPopup = shallowRef<HTMLElement>()
  useUiZPopup(() => popupTarget(zPopup.value))
  import { dateFormatLocale, retainDateFormatFocus } from './dateFormat'
  import {
    computed,
    ref,
    shallowRef,
    watch,
    nextTick,
    type Component,
  } from 'vue'
  import {
    parseDate,
    parseDateTime,
    CalendarDateTime,
  } from '@internationalized/date'
  import UInputDate from '@nuxt/ui/components/InputDate.vue'
  import UInputTime from '@nuxt/ui/components/InputTime.vue'
  import UPopover from '@nuxt/ui/components/Popover.vue'
  import UCalendar from '@nuxt/ui/components/Calendar.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import { useUiI18n } from '@uninterface/uninterface'
  import {
    useUiControlFrameParticipant,
    useUiFieldDescription,
    useUiOverlayTarget,
    focusUiTarget,
    type UiTemporalEditorViewProps,
  } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  import TemporalSegments from './TemporalSegments.vue'
  import TemporalIcon from './TemporalIcon.vue'
  import { onDeactivated, onScopeDispose, type ObjectDirective } from 'vue'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<
    Omit<UiTemporalEditorViewProps, 'value' | 'update'> & {
      value: { start: string; end: string }
      update(value: { start: string; end: string }): void
    }
  >()
  const editor = ref<{ inputsRef?: { $el: HTMLElement }[] }>()
  const trigger = ref<{ $el?: HTMLButtonElement }>()
  const portal = useUiOverlayTarget()
  const open = ref(false)
  const focus = () =>
    focusUiTarget(
      () =>
        editor.value?.inputsRef?.find(
          (item) => item.$el.getAttribute('role') === 'spinbutton',
        )?.$el,
      () => props.binding.disabled,
    )
  const { frame, setEngaged } = useUiControlFrameParticipant({
    focus,
    invalid: () => props.binding.invalid,
  })
  defineExpose({ focus })
  watch(open, setEngaged, { flush: 'sync' })
  watch(
    () => [props.binding.disabled, props.readonly],
    () => {
      if (props.binding.disabled || props.readonly) open.value = false
    },
  )
  onDeactivated(() => {
    open.value = false
  })
  onScopeDispose(() => {
    open.value = false
  })
  // Native range segments expose endpoint identity but omit our grouped field name.
  // Keep actual editing targets named and semantically invalid independently of paint.
  function targetAttributes(root: HTMLElement) {
    // Nuxt renders both endpoints as flat sibling segments. Assign columns in
    // their native locale order, including literals, without moving Vue nodes.
    // CSS alone switches rows at narrow widths; editing/focus state stays native.
    if (props.kind === 'datetime') {
      const field = root.querySelector<HTMLElement>(
        '[data-temporal-native-range]',
      )
      const columns = { start: 2, end: 2 }
      for (const segment of Array.from(field?.children ?? [])) {
        const side = segment.getAttribute(
          'data-reka-date-range-field-segment-type',
        )
        if (
          (side === 'start' || side === 'end') &&
          segment instanceof HTMLElement
        )
          segment.style.setProperty(
            '--ui-temporal-column',
            String(columns[side]++),
          )
      }
    }
    for (const target of root.querySelectorAll<HTMLElement>(
      '[role=spinbutton]',
    )) {
      const side =
        target.getAttribute('data-reka-date-range-field-segment-type') ??
        target.getAttribute('data-reka-time-range-field-segment-type')
      const part = (target.getAttribute('aria-label') ?? '').split(',')[0]
      const endpoint = i18n.text({
        namespace: 'uninterface',
        key:
          side === 'end'
            ? props.kind === 'date'
              ? 'rangeDateEnd'
              : 'rangeEnd'
            : 'rangeStart',
      })
      target.setAttribute('aria-label', `${part}, ${props.label} — ${endpoint}`)
      if (props.binding.invalid) target.setAttribute('aria-invalid', 'true')
      else target.removeAttribute('aria-invalid')
      if (description.value)
        target.setAttribute('aria-describedby', description.value)
      else target.removeAttribute('aria-describedby')
    }
  }
  const vNativeRangeTargets: ObjectDirective<HTMLElement> = {
    mounted: targetAttributes,
    updated: targetAttributes,
  }
  const nativeComponent = computed<Component>(() =>
    props.kind === 'time' ? UInputTime : UInputDate,
  )
  const i18n = useUiI18n()
  const locale = computed(() =>
    props.kind === 'time'
      ? (props.presentation?.locale ?? i18n.state.value.formattingLocale)
      : dateFormatLocale(props.dateFormatWish),
  )
  const description = useUiFieldDescription(() => props.binding, 'replace-help')
  const size = useControlSize(
    props.kind === 'time'
      ? 'UiTimeInput'
      : props.kind === 'date'
        ? 'UiDateInput'
        : 'UiDateTimeInput',
  )
  retainDateFormatFocus(locale, () =>
    editor.value?.inputsRef?.[0]?.$el.closest('[data-temporal-native-range]'),
  )
  const pickerLabel = computed(() =>
    i18n.text({
      namespace: 'uninterface',
      key: props.kind === 'date' ? 'pickDate' : 'pickDateTime',
    }),
  )
  function nativeValue(value: typeof props.value) {
    const parse = (raw: string, end: boolean) => {
      try {
        if (props.kind === 'date') return parseDate(raw)
        if (props.kind === 'datetime') return parseDateTime(raw)
        if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(raw)) return undefined
        const [hour, minute, second = 0] = raw.split(':').map(Number)
        if (hour! > 23 || minute! > 59 || second > 59) return undefined
        // Private fixed calendar anchor, never the system date/timezone. End's date
        // represents overnight ordering without changing the visible clock.
        return new CalendarDateTime(
          2000,
          1,
          end && value.start && raw <= value.start ? 2 : 1,
          hour!,
          minute!,
          second,
        )
      } catch {
        return undefined
      }
    }
    return { start: parse(value.start, false), end: parse(value.end, true) }
  }
  const model = shallowRef(nativeValue(props.value))
  const segments = ref<{ reset(value: typeof props.value): void }>()
  let reported: string | undefined
  let calendarReported: string | undefined
  let synchronizing = false
  let revision = 0
  watch(
    () => props.value,
    async (value, previous) => {
      const serialized = JSON.stringify(value)
      // Parent renders create fresh endpoint objects even when their values are
      // unchanged. Do not mistake those for an external replacement mid-picker.
      if (serialized === JSON.stringify(previous)) return
      if (
        open.value &&
        props.kind === 'datetime' &&
        serialized !== reported &&
        serialized !== calendarReported
      ) {
        calendarTimes.value = {
          start: value.start.split('T')[1] ?? '',
          end: value.end.split('T')[1] ?? '',
        }
      }
      calendarReported = undefined
      if (serialized === reported) {
        reported = undefined
        return
      }
      const current = ++revision
      synchronizing = true
      model.value = nativeValue(value)
      await nextTick()
      if (current !== revision) return
      segments.value?.reset(value)
      await nextTick()
      if (current === revision) synchronizing = false
    },
  )
  function update(value: typeof props.value) {
    if (
      synchronizing ||
      props.binding.disabled ||
      props.readonly ||
      JSON.stringify(value) === JSON.stringify(props.value)
    )
      return
    reported = JSON.stringify(value)
    props.update(value)
    if (props.kind === 'time') {
      // Keep native ordering on the same canonical overnight interpretation.
      const next = nativeValue(value)
      if (next.start && next.end) model.value = next
    }
  }
  function close() {
    open.value = false
    trigger.value?.$el?.focus()
  }
  const calendarTimes = ref({ start: '', end: '' })
  watch(
    open,
    (value) => {
      if (value && props.kind === 'datetime')
        calendarTimes.value = {
          start: props.value.start.split('T')[1] ?? '',
          end: props.value.end.split('T')[1] ?? '',
        }
    },
    { flush: 'sync' },
  )
  const calendarValue = computed(() => {
    const parse = (v: string) => {
      try {
        return parseDate(v.split('T')[0]!)
      } catch {
        return undefined
      }
    }
    return { start: parse(props.value.start), end: parse(props.value.end) }
  })
  function choose(value: {
    start?: { toString(): string }
    end?: { toString(): string }
  }) {
    if (props.binding.disabled || props.readonly) return
    const endpoint = (side: 'start' | 'end') => {
      const date = value[side]?.toString() ?? ''
      return !date || props.kind === 'date'
        ? date
        : date +
            'T' +
            (props.value[side].split('T')[1] ?? calendarTimes.value[side])
    }
    reported = undefined
    const next = { start: endpoint('start'), end: endpoint('end') }
    calendarReported = JSON.stringify(next)
    props.update(next)
    // Partial calendar selection keeps the range picker open.
    if (value.start && value.end) {
      open.value = false
      void nextTick(() => trigger.value?.$el?.focus())
    }
  }
</script>
<template>
  <div
    v-native-range-targets
    class="nuxt-temporal-native-range-host"
  >
    <component
      :is="nativeComponent"
      ref="editor"
      v-bind="$attrs"
      range
      :key="precision + ':' + presentation?.hourCycle"
      :id="binding.id + '-editor'"
      :model-value="model"
      :locale="locale"
      :granularity="
        kind === 'date' ? 'day' : precision === 'second' ? 'second' : 'minute'
      "
      :hour-cycle="presentation?.hourCycle === 'h12' ? 12 : 24"
      :disabled="binding.disabled"
      :readonly="readonly"
      :required="binding.required"
      :aria-label="label"
      :aria-describedby="description"
      :aria-invalid="binding.invalid || undefined"
      :aria-busy="binding.validating || undefined"
      :size="size"
      variant="none"
      :highlight="false"
      :data-ui-control-frame="frame.owner"
      data-temporal-native-range
      class="w-full"
      @blur="blur"
      @keydown.alt.down.prevent="
        kind !== 'time' && !binding.disabled && !readonly && (open = true)
      "
    >
      <TemporalSegments
        ref="segments"
        range
        :kind="kind"
        :precision="precision"
        :initial="value"
        :update="update"
      />
      <template
        v-if="kind !== 'time'"
        #leading
      >
        <UPopover
          :open="open"
          :portal="portal"
          @update:open="open = !binding.disabled && !readonly && $event"
        >
          <UButton
            ref="trigger"
            type="button"
            color="neutral"
            variant="link"
            size="sm"
            :disabled="binding.disabled || readonly"
            :aria-label="pickerLabel + ' — ' + label"
            :aria-expanded="open"
            aria-haspopup="dialog"
            data-temporal-trigger
          >
            <TemporalIcon />
          </UButton>
          <template #content>
            <div
              role="dialog"
              :aria-label="pickerLabel"
              ref="zPopup"
              data-temporal-popup
              class="p-2"
              @keydown.esc.capture.stop.prevent="close"
            >
              <UCalendar
                range
                :model-value="calendarValue"
                :is-date-unavailable="
                  kind === 'date'
                    ? (value: any) => !eligible(value.toString())
                    : undefined
                "
                @update:model-value="choose($event as any)"
              />
            </div>
          </template>
        </UPopover>
      </template>
    </component>
  </div>
</template>
