<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    useUiTemporalRange,
    useUiOverlayTarget,
  } from '@uninterface/uninterface/backend'
  import type {
    UiTemporalInputViewProps,
    UiFocusHandle,
  } from '@uninterface/uninterface/backend'
  import TemporalEditor from './TemporalEditor.vue'
  import TemporalAction from './TemporalAction.vue'
  import TemporalNativeRange from './TemporalNativeRange.vue'
  import TemporalMode from './TemporalMode.vue'
  import TemporalRangeIcon from './TemporalRangeIcon.vue'
  import UBadge from '@nuxt/ui/components/Badge.vue'
  import UTooltip from '@nuxt/ui/components/Tooltip.vue'
  import { nativeTemporalSupported } from './temporalNative'
  import InputFrame from './UiInputFrame.vue'
  const props = withDefaults(defineProps<UiTemporalInputViewProps>(), {
    dateFormatWish: 'YMD',
  })
  defineOptions({ inheritAttrs: false })
  const portal = useUiOverlayTarget()
  const editor = ref<UiFocusHandle>()
  const modeTarget = ref<UiFocusHandle>()
  const endpoints = new Map<string, UiFocusHandle>()
  function endpointRef(side: string, value: unknown) {
    if (value) endpoints.set(side, value as UiFocusHandle)
    else endpoints.delete(side)
  }
  const {
    range,
    mode,
    modes,
    messages,
    nextDay,
    display: displayEndpoint,
    selectMode,
    updateEndpoint,
    updateRange,
    clear,
  } = useUiTemporalRange(props)
  const nativeRange = computed(
    () =>
      mode.value === 'bounded' &&
      (props.kind === 'date' || props.options.precision !== 'millisecond') &&
      ['start', 'end'].every((side) => {
        const value = displayEndpoint(side as 'start' | 'end')
        return (
          !value ||
          value.includes('_') ||
          nativeTemporalSupported({
            ...props,
            precision: props.options.precision ?? 'minute',
            value,
          })
        )
      }),
  )
  const nativeEditor = ref<UiFocusHandle>()
  async function focus() {
    if (!props.options.range) return editor.value?.focus() ?? null
    if (nativeRange.value) return nativeEditor.value?.focus() ?? null
    for (const side of ['start', 'end'] as const) {
      const result = await endpoints.get(side)?.focus()
      if (result === true) return true
    }
    return modeTarget.value?.focus() ?? null
  }
  defineExpose({ focus })
</script>
<template>
  <InputFrame
    v-if="options.range"
    :binding="binding"
    :description-binding="binding"
    :label="label"
    :readonly="readonly"
    :dirty="!!value"
    :focus-editor="focus"
    data-temporal-range
    :data-temporal-kind="kind"
  >
    <template #leading>
      <TemporalMode
        ref="modeTarget"
        v-if="modes.length > 1"
        :value="mode"
        :modes="modes"
        :label="messages.rangeMode"
        :disabled="binding.disabled || readonly"
        @change="selectMode"
      />
    </template>
    <TemporalNativeRange
      v-if="nativeRange"
      ref="nativeEditor"
      v-bind="$attrs"
      :binding="binding"
      :kind="kind"
      :date-format-wish="dateFormatWish"
      :value="{ start: displayEndpoint('start'), end: displayEndpoint('end') }"
      :precision="options.precision ?? 'minute'"
      :presentation="presentation"
      :readonly="readonly"
      :label="label"
      :eligible="eligible"
      :update="updateRange"
      :blur="blur"
    />
    <div
      v-else
      class="nuxt-ui-temporal-range"
      :data-open="mode !== 'bounded' ? '' : undefined"
      :data-temporal-unrestricted="mode === 'unrestricted' ? '' : undefined"
    >
      <template
        v-for="side in ['start', 'end'] as const"
        :key="side"
      >
        <span
          v-if="side === 'end'"
          aria-hidden="true"
          data-temporal-separator
        >
          –
        </span>
        <div
          class="nuxt-ui-temporal-boundary"
          :data-temporal-side="side"
        >
          <UBadge
            v-if="range[side] === null"
            color="neutral"
            variant="subtle"
            size="sm"
            role="img"
            :aria-label="
              (side === 'start' ? startLabel : endLabel) +
              ' — ' +
              messages.openBoundary
            "
            data-temporal-infinity
          >
            <span aria-hidden="true">∞</span>
          </UBadge>
          <TemporalEditor
            v-else
            :ref="(value) => endpointRef(side, value)"
            v-bind="$attrs"
            :binding="{
              ...binding,
              id: binding.id + '-' + side,
              disabled: binding.disabled,
            }"
            :kind="kind"
            :date-format-wish="dateFormatWish"
            :value="displayEndpoint(side)"
            :precision="options.precision ?? 'minute'"
            :presentation="presentation"
            :readonly="readonly"
            :label="label + ' — ' + (side === 'start' ? startLabel : endLabel)"
            :eligible="eligible"
            :update="(value) => updateEndpoint(side, value)"
            :blur="blur"
          />
        </div>
      </template>
      <span
        v-if="mode !== 'bounded'"
        class="nuxt-ui-temporal-spacer"
        aria-hidden="true"
      />
    </div>
    <template #trailing>
      <UTooltip
        v-if="kind === 'time' && mode === 'bounded'"
        :text="messages.rangeNextDay"
        :disabled="!nextDay"
        :portal="portal"
      >
        <span
          :style="{ visibility: nextDay ? undefined : 'hidden' }"
          :aria-hidden="!nextDay || undefined"
          :aria-label="messages.rangeNextDay"
          role="img"
          data-temporal-next-day
        >
          <TemporalRangeIcon mode="next-day" />
        </span>
      </UTooltip>
      <TemporalAction
        clear
        :label="clearLabel"
        :disabled="binding.disabled || readonly"
        @click="clear"
      />
    </template>
  </InputFrame>
  <TemporalEditor
    v-else
    ref="editor"
    v-bind="$attrs"
    :binding="binding"
    :kind="kind"
    :date-format-wish="dateFormatWish"
    :value="typeof value === 'string' ? display(value) : ''"
    :precision="options.precision ?? 'minute'"
    :presentation="presentation"
    :readonly="readonly"
    :label="label"
    :eligible="eligible"
    :update="(value) => update(value === '' ? null : candidate(value))"
    :blur="blur"
  />
</template>
