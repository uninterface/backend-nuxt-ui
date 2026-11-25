<script setup lang="ts">
  import { onDeactivated, shallowRef as zRef } from 'vue'
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { useUiOverlayTarget } from '@uninterface/uninterface/backend'
  const overlayTarget = useUiOverlayTarget()
  import { useUiFieldFailure } from '@uninterface/uninterface/backend'
  import { useUiFieldDescription } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  import { focusUiTarget } from '@uninterface/uninterface/backend'
  import { ConfigProvider } from 'reka-ui'
  import { useNativeDirection } from './nativeDirection'
  import { computed, onBeforeUnmount, ref } from 'vue'
  import USelect from '@nuxt/ui/components/Select.vue'
  import { selectEscape } from './selectEscape'
  import UButton from '@nuxt/ui/components/Button.vue'
  import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
  import { useAppConfig } from '#imports'
  const appConfig = useAppConfig()
  import { useFieldPresentation } from './fieldPresentation'
  useFieldPresentation()
  import type { UiMultiSelectViewProps } from '@uninterface/uninterface/backend'

  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiMultiSelectViewProps>()
  const invalidPresentation = useUiFieldFailure(() => props.binding)
  const emit = defineEmits<{
    update: [value: string[]]
    clear: []
    blur: []
    requestLoad: []
  }>()
  const opened = ref(false)
  const { dismiss, escapeContent } = selectEscape(opened)
  const select = ref<{ triggerRef?: HTMLElement; viewportRef?: HTMLElement }>()
  const direction = useNativeDirection(
    () => select.value?.triggerRef?.parentElement ?? undefined,
  )
  let blurTimer: ReturnType<typeof setTimeout> | undefined
  function checkBlur() {
    clearTimeout(blurTimer)
    // Nuxt UI reports blur whenever its popup closes, including Escape with
    // focus returning to the trigger. Wait for that restoration and report
    // only an actual exit from the complete widget.
    blurTimer = setTimeout(() => {
      const active = document.activeElement
      if (
        !select.value?.triggerRef?.contains(active) &&
        !select.value?.viewportRef?.contains(active)
      )
        emit('blur')
    }, 0)
  }
  onBeforeUnmount(() => clearTimeout(blurTimer))
  // Reka reserves an empty string for clearing. Encode all business keys so
  // an empty key and a status candidate remain outside that widget namespace.
  const encode = (value: string) => `value:${value}`
  const label = computed(() =>
    props.value
      .map(
        (value) =>
          props.options.find((option) => option.value === value)?.label ??
          value,
      )
      .join(', '),
  )
  const items = computed(() => {
    if (!props.available)
      return [{ value: 'status:', label: props.status.message, disabled: true }]
    const result: {
      value?: string
      label: string
      disabled?: boolean
      type?: 'label'
    }[] = []
    let group: string | undefined
    for (const option of props.options) {
      if (option.hidden) continue
      if (option.group !== group && option.group !== undefined)
        result.push({ type: 'label', label: option.group })
      group = option.group
      result.push({
        value: encode(option.value),
        label: option.label,
        disabled: option.disabled,
      })
    }
    return result
  })
  function requestLoad() {
    if (!props.binding.disabled) emit('requestLoad')
  }
  function keydown(event: KeyboardEvent) {
    if (
      ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'F4'].includes(
        event.key,
      ) ||
      (event.key.length === 1 && !event.ctrlKey && !event.metaKey)
    )
      requestLoad()
  }
  function update(value: unknown) {
    if (
      !Array.isArray(value) ||
      value.some(
        (key) => typeof key !== 'string' || !key.startsWith('value:'),
      ) ||
      props.binding.disabled ||
      !props.available
    )
      return
    emit(
      'update',
      value.map((key) => key.slice(6)),
    )
  }
  function clear() {
    if (!props.clearable) return
    emit('clear')
    opened.value = false
    select.value?.triggerRef?.focus()
  }
  function open(value: boolean) {
    opened.value = value
    if (value) requestLoad()
  }
  defineExpose({
    focus: () =>
      focusUiTarget(
        () => select.value?.triggerRef,
        () => props.binding.disabled,
      ),
  })
  const description = useUiFieldDescription(() => props.binding, 'replace-help')
  const controlSize = useControlSize('UiMultiSelect')
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { popupTarget, controlledPopup } from './zOrder'
  useUiZPopup(() => popupTarget(select.value?.viewportRef), {
    source: 'UiMultiSelect choices',
  })
  onDeactivated(() => {
    opened.value = false
  })
</script>
<template>
  <ConfigProvider :dir="direction">
    <UFieldGroup
      class="w-full min-w-0"
      :size="controlSize"
    >
      <USelect
        ref="select"
        :portal="overlayTarget ?? true"
        :content="escapeContent"
        v-bind="$attrs"
        :id="binding.id"
        class="w-full min-w-0 nuxt-control-focus"
        :color="invalidPresentation ? 'error' : undefined"
        :highlight="invalidPresentation"
        :size="controlSize"
        multiple
        :model-value="value.map(encode)"
        :placeholder="placeholder"
        :loading="status.pending"
        :items="items"
        :open="opened"
        :disabled="binding.disabled"
        :required="binding.required"
        :aria-busy="binding.validating || status.pending || undefined"
        :aria-required="binding.required || undefined"
        :aria-invalid="binding.invalid || undefined"
        :aria-describedby="
          [
            description,
            status.message ? `${binding.id}-source-status` : undefined,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        "
        @pointerdown="requestLoad"
        @click="requestLoad"
        @keydown.capture="dismiss"
        @keydown="keydown"
        @update:open="open"
        @update:model-value="update"
        @blur="checkBlur"
        @focusout="checkBlur"
      >
        <template #item-label="{ item }">
          <span
            :data-uninterface-key="
              item.value?.startsWith('value:') ? item.value.slice(6) : undefined
            "
          >
            {{ item.label }}
          </span>
        </template>
        <template
          v-if="value.length"
          #default
        >
          {{ label }}
        </template>
      </USelect>
      <UButton
        v-if="clearable"
        :id="`${binding.id}-clear`"
        color="neutral"
        variant="outline"
        :icon="appConfig.ui?.icons.close"
        :aria-label="clearLabel"
        :title="clearLabel"
        @click="clear"
      />
    </UFieldGroup>
  </ConfigProvider>
  <span
    :id="`${binding.id}-source-status`"
    :data-uninterface-source-state="status.state"
    class="sr-only nuxt-select-status"
    role="status"
    aria-live="polite"
  >
    {{ status.message }}
  </span>
</template>
