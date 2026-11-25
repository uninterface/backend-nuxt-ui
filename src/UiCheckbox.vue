<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { useUiFieldFailure } from '@uninterface/uninterface/backend'
  import { useUiFieldDescription } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  import { ref } from 'vue'
  import { focusUiTarget } from '@uninterface/uninterface/backend'
  import { useFieldPresentation } from './fieldPresentation'
  import CheckableFeedback from './CheckableFeedback.vue'
  const { field, feedback } = useFieldPresentation(true)
  import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
  import type { UiCheckboxViewProps } from '@uninterface/uninterface/backend'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiCheckboxViewProps>()
  const invalidPresentation = useUiFieldFailure(() => props.binding)
  defineEmits<{ update: [value: boolean] }>()
  const checkbox = ref<{ $el: HTMLElement }>()
  defineExpose({
    focus: () =>
      focusUiTarget(
        () => checkbox.value?.$el?.querySelector('[role="checkbox"]'),
        () => props.binding.disabled,
      ),
  })
  const description = useUiFieldDescription(() => props.binding, 'replace-help')
  const controlSize = useControlSize('UiCheckbox')
</script>
<template>
  <UCheckbox
    ref="checkbox"
    v-bind="$attrs"
    :id="binding.id"
    :model-value="value"
    :color="invalidPresentation ? 'error' : undefined"
    :disabled="binding.disabled"
    :highlight="invalidPresentation"
    :size="controlSize"
    :label="field?.label"
    :required="binding.required"
    :ui="{
      base: 'nuxt-control-focus',
      label: field
        ? field.requiredLabel
          ? `nuxt-required${field.markerPosition === 'prefix' ? ' nuxt-required-prefix' : ''}`
          : 'after:content-none'
        : undefined,
    }"
    :aria-busy="binding.validating || undefined"
    :aria-required="binding.required || undefined"
    :aria-describedby="description"
    :aria-invalid="binding.invalid || undefined"
    @update:model-value="$emit('update', $event === true)"
  >
    <template
      v-if="feedback?.help || feedback?.issue"
      #description
    >
      <CheckableFeedback
        :id="binding.id"
        :feedback="feedback!"
      />
    </template>
  </UCheckbox>
</template>
