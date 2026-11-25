<script setup lang="ts">
  import { dateFormatLocale, retainDateFormatFocus } from './dateFormat'
  import {
    computed,
    nextTick,
    ref,
    shallowRef,
    watch,
    type Component,
  } from 'vue'
  import { useUiI18n } from '@uninterface/uninterface'
  import UInputDate from '@nuxt/ui/components/InputDate.vue'
  import UInputTime from '@nuxt/ui/components/InputTime.vue'
  import {
    useUiFieldFailure,
    useUiFieldDescription,
    focusUiTarget,
    type UiTemporalEditorViewProps,
  } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  import { nativeTemporalValue } from './temporalNative'
  import TemporalSegments from './TemporalSegments.vue'
  import TemporalPicker from './TemporalPicker.vue'
  import TemporalAction from './TemporalAction.vue'
  defineOptions({ inheritAttrs: false })
  const emit = defineEmits<{ 'open-change': [open: boolean] }>()
  const props = defineProps<
    UiTemporalEditorViewProps & {
      boundaryLabel?: string
      toggleBoundary?: () => void
    }
  >()
  const pickerProps = computed(() => {
    const { dateFormatWish, ...picker } = props
    return picker
  })
  const nativeComponent = computed<Component>(() =>
    props.kind === 'time' ? UInputTime : UInputDate,
  )
  const i18n = useUiI18n()
  const locale = computed(() =>
    props.kind === 'time'
      ? (props.presentation?.locale ?? i18n.state.value.formattingLocale)
      : dateFormatLocale(props.dateFormatWish),
  )
  const invalid = useUiFieldFailure(() => props.binding)
  const description = useUiFieldDescription(() => props.binding, 'replace-help')
  const size = useControlSize(
    props.kind === 'time' ? 'UiTimeInput' : 'UiDateInput',
  )
  const editor = ref<{ inputsRef?: { $el: HTMLElement }[] }>()
  retainDateFormatFocus(locale, () =>
    editor.value?.inputsRef?.[0]?.$el.closest('[data-temporal-native]'),
  )
  const picker = ref<{ show(): void }>()
  const model = shallowRef(nativeTemporalValue(props))
  const segments = ref<{ reset(value: string): void }>()
  let emitted: string | undefined
  let synchronizing = false
  watch(
    () => props.value,
    async (value) => {
      if (value === emitted) {
        emitted = undefined
        return
      }
      synchronizing = true
      model.value = nativeTemporalValue(props)
      await nextTick()
      // Reka preserves partial segments on null model updates. Synchronize
      // external clears and incomplete calendar choices without replacing
      // the input or its popup trigger (which would lose native focus return).
      if (!model.value) segments.value?.reset(value)
      await nextTick()
      synchronizing = false
    },
  )
  function update(value: string) {
    if (
      synchronizing ||
      props.binding.disabled ||
      props.readonly ||
      value === props.value
    )
      return
    emitted = value
    props.update(value)
  }
  function focusout(event: FocusEvent) {
    const host = event.currentTarget as HTMLElement
    if (
      event.relatedTarget instanceof Node &&
      host.contains(event.relatedTarget)
    )
      return
    void nextTick(() => {
      if (host.isConnected && !host.contains(host.ownerDocument.activeElement))
        props.blur()
    })
  }
  defineExpose({
    focus: () =>
      focusUiTarget(
        () =>
          editor.value?.inputsRef?.find(
            (input) => input.$el.getAttribute('role') === 'spinbutton',
          )?.$el,
        () => props.binding.disabled,
      ),
  })
</script>
<template>
  <component
    :data-ui-control-frame="frame?.owner"
    :is="nativeComponent"
    :key="precision + ':' + presentation?.hourCycle"
    ref="editor"
    v-bind="$attrs"
    :id="binding.id"
    :model-value="model"
    :granularity="
      kind === 'date' ? 'day' : precision === 'second' ? 'second' : 'minute'
    "
    :locale="locale"
    :hour-cycle="presentation?.hourCycle === 'h12' ? 12 : 24"
    :disabled="binding.disabled"
    :readonly="readonly"
    :required="binding.required"
    :aria-label="label || $attrs['aria-label']"
    :aria-describedby="description"
    :aria-invalid="binding.invalid || undefined"
    :aria-busy="binding.validating || undefined"
    :color="frame?.owner !== 'parent' && invalid ? 'error' : undefined"
    :highlight="frame?.owner !== 'parent' && invalid"
    :size="size"
    class="w-full nuxt-ui-temporal-editor"
    :variant="frame?.owner === 'parent' ? 'none' : undefined"
    :class="{ 'nuxt-ui-temporal-part': frame?.owner === 'parent' }"
    :data-temporal-inline-time="kind === 'time' ? '' : undefined"
    data-temporal-native
    @update:model-value="model = $event ?? null"
    @focusout="focusout"
    @keydown.alt.down.prevent="picker?.show()"
  >
    <TemporalSegments
      ref="segments"
      :kind="kind"
      :precision="precision"
      :initial="value"
      :update="update"
    />
    <template
      v-if="kind !== 'time'"
      #leading
    >
      <TemporalPicker
        @open-change="emit('open-change', $event)"
        ref="picker"
        v-bind="pickerProps"
      />
    </template>
    <template
      v-if="toggleBoundary"
      #trailing
    >
      <TemporalAction
        :label="boundaryLabel ?? ''"
        :active="false"
        :disabled="binding.disabled || readonly"
        @click="toggleBoundary"
      />
    </template>
  </component>
</template>
