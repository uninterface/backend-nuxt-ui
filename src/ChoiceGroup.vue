<script setup lang="ts">
  import { uiFocusPresentation } from './focus'
  import { computed, ref, watchPostEffect, onUpdated } from 'vue'
  import {
    useUiChoiceGroupView,
    useUiFieldDescription,
    useUiFieldFailure,
  } from '@uninterface/uninterface/backend'
  import type { UiChoiceGroupViewProps } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  import { useNativeDirection } from './nativeDirection'
  import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
  import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiChoiceGroupViewProps & { multiple: boolean }>()
  const emit = defineEmits<{ choose: [key: string]; blur: [] }>()
  const root = ref<HTMLElement>()
  const direction = useNativeDirection(() => root.value)
  const size = useControlSize(props.multiple ? 'UiCheckbox' : 'UiRadioGroup')
  const description = useUiFieldDescription(() => props.binding, 'replace-help')
  const failure = useUiFieldFailure(() => props.binding)
  const describedBy = computed(
    () =>
      [
        description.value,
        props.status.message ? `${props.binding.id}-source-status` : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined,
  )
  const selected = computed(
    () => props.options.find((option) => option.selected)?.key,
  )
  function targets() {
    return Array.from(
      root.value?.querySelectorAll<HTMLElement>(
        'input[type=radio], input[type=checkbox], [role=radio], [role=checkbox]',
      ) ?? [],
    )
      .filter(
        (element) =>
          element.getAttribute('aria-hidden') !== 'true' &&
          element.tabIndex >= -1,
      )
      .flatMap((element) => {
        const key =
          element
            .closest('[data-uninterface-key]')
            ?.getAttribute('data-uninterface-key') ??
          (element.getAttribute('value')?.startsWith('choice:')
            ? decodeURIComponent(element.getAttribute('value')!.slice(7))
            : undefined)
        return key === null || key === undefined ? [] : [{ key, element }]
      })
  }
  const { focus, keydown, focusout } = useUiChoiceGroupView(
    props,
    () => props.multiple,
    () => root.value,
    targets,
    (key) => emit('choose', key),
    () => emit('blur'),
  )
  defineExpose({ focus })
  // Nuxt's native list descriptions have no input association. Keep its slots
  // and theme, adding IDs and ARIA relationships on the actual Reka targets.
  function syncDescriptions() {
    for (const target of targets()) {
      const index = props.options.findIndex(
        (option) => option.key === target.key,
      )
      if (index < 0) continue
      const item = target.element.closest(
        props.multiple ? '[data-uninterface-key]' : '[data-slot=item]',
      )
      const help = item?.querySelector('[data-slot=description]')
      if (help) help.id = `${props.binding.id}-option-${index}-help`
      const descriptions = optionDescription(index)
      if (descriptions)
        target.element.setAttribute('aria-describedby', descriptions)
      else target.element.removeAttribute('aria-describedby')
      if (props.binding.invalid)
        target.element.setAttribute('aria-invalid', 'true')
      else target.element.removeAttribute('aria-invalid')
    }
  }
  watchPostEffect(syncDescriptions)
  onUpdated(syncDescriptions)
  function optionDescription(index: number) {
    return (
      [
        description.value,
        props.options[index].description
          ? `${props.binding.id}-option-${index}-help`
          : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined
    )
  }
</script>
<template>
  <div
    ref="root"
    v-bind="$attrs"
    :id="binding.id"
    :role="'group'"
    :aria-label="label"
    :aria-describedby="describedBy"
    :aria-invalid="binding.invalid || undefined"
    :aria-disabled="binding.disabled || undefined"
    :aria-busy="binding.validating || status.pending || undefined"
    :class="uiFocusPresentation.class"
    data-uninterface-choice-group
    class="nuxt-choice-group space-y-2"
    @keydown.capture="keydown"
    @focusout="focusout"
  >
    <URadioGroup
      v-if="!multiple"
      :dir="direction"
      :id="`${binding.id}-radios`"
      :name="binding.id"
      :aria-label="label"
      :aria-required="binding.required || undefined"
      :aria-describedby="describedBy"
      :aria-invalid="binding.invalid || undefined"
      :model-value="
        selected === undefined ? '' : `choice:${encodeURIComponent(selected)}`
      "
      :items="
        options.map((option) => ({
          value: `choice:${encodeURIComponent(option.key)}`,
          label: option.label,
          description: option.description,
          disabled: option.disabled || binding.disabled || !available,
        }))
      "
      :orientation="orientation"
      :size="size"
      :color="failure ? 'error' : undefined"
      :highlight="failure"
      :ui="{
        base: 'nuxt-control-focus',
        fieldset: orientation === 'horizontal' ? 'flex-wrap' : undefined,
      }"
      loop
      @update:model-value="
        typeof $event === 'string' &&
        emit('choose', decodeURIComponent($event.slice(7)))
      "
    />
    <div
      v-if="multiple"
      class="flex gap-2"
      :class="orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'"
    >
      <div
        v-for="(option, index) in options"
        :key="option.key"
        :data-uninterface-key="option.key"
      >
        <UCheckbox
          :ui="{ base: 'nuxt-control-focus' }"
          :id="`${binding.id}-option-${index}`"
          :model-value="option.selected"
          :label="option.label"
          :description="option.description"
          :disabled="binding.disabled || !available || option.disabled"
          :size="size"
          :color="failure ? 'error' : undefined"
          :highlight="failure"
          :aria-invalid="binding.invalid || undefined"
          :aria-describedby="description"
          @update:model-value="emit('choose', option.key)"
        />
      </div>
    </div>
    <div
      v-for="item in retained"
      :key="item.key"
      data-uninterface-retained
    >
      {{ item.label }}
      <template v-if="unavailableLabel">— {{ unavailableLabel }}</template>
    </div>
    <div
      :id="`${binding.id}-source-status`"
      role="status"
      :data-uninterface-source-state="status.state"
    >
      {{ status.message }}
    </div>
  </div>
</template>
