<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'

  import { useUiFieldFailure } from '@uninterface/uninterface/backend'
  import { useUiFieldDescription } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  import { focusUiTarget } from '@uninterface/uninterface/backend'
  import { useFieldPresentation } from './fieldPresentation'
  useFieldPresentation()
  import { ref } from 'vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import UInput from '@nuxt/ui/components/Input.vue'
  import UTextarea from '@nuxt/ui/components/Textarea.vue'
  import type { UiTextInputViewProps } from '@uninterface/uninterface/backend'
  import ShowIcon from './icons/show.vue'
  import HideIcon from './icons/hide.vue'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiTextInputViewProps>()
  const invalidPresentation = useUiFieldFailure(
    () => props.descriptionBinding ?? props.binding,
  )
  defineEmits<{ update: [value: string]; blur: [] }>()
  const input = ref<{
    $el?: HTMLElement
    inputRef?: HTMLInputElement
    textareaRef?: HTMLTextAreaElement
  }>()
  // The transparent width context has no painted box; retain native-root stacking.
  useUiZView({ targets: () => (input.value?.$el ? [input.value.$el] : []) })
  defineExpose({
    focus: () =>
      focusUiTarget(
        () => input.value?.textareaRef ?? input.value?.inputRef,
        () => props.binding.disabled,
      ),
  })
  const description = useUiFieldDescription(
    () => props.descriptionBinding ?? props.binding,
    'replace-help',
  )
  const controlSize = useControlSize('UiTextInput')
</script>
<template>
  <div
    class="nuxt-text-input-context"
    :style="{
      '--ui-text-min-width':
        minWidthCharacters === undefined
          ? undefined
          : `${minWidthCharacters}ch`,
      '--ui-text-max-width':
        maxWidthCharacters === undefined
          ? undefined
          : `${maxWidthCharacters}ch`,
    }"
  >
    <component
      :data-ui-control-frame="frame?.owner"
      :data-ui-frame-editor="frame?.owner === 'parent' ? '' : undefined"
      :is="multiline ? UTextarea : UInput"
      ref="input"
      v-bind="$attrs"
      :id="binding.id"
      :type="multiline ? undefined : type"
      :variant="frame?.owner === 'parent' ? 'none' : undefined"
      :readonly="readonly"
      :class="frame?.owner === 'parent' ? 'nuxt-frame-text-editor' : 'w-full'"
      :ui="{ base: 'nuxt-control-focus' }"
      :color="
        frame?.owner !== 'parent' && invalidPresentation ? 'error' : undefined
      "
      :highlight="frame?.owner !== 'parent' && invalidPresentation"
      :size="controlSize"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :model-value="value"
      :disabled="binding.disabled"
      :aria-busy="binding.validating || undefined"
      :aria-required="binding.required || undefined"
      :aria-describedby="description"
      :aria-invalid="binding.invalid || undefined"
      @update:model-value="$emit('update', String($event ?? ''))"
      @keydown="reveal?.keydown($event)"
      @blur="$emit('blur')"
    >
      <template
        v-if="$slots.leading"
        #leading
      >
        <slot name="leading" />
      </template>
      <template
        v-if="reveal || $slots.trailing"
        #trailing
      >
        <slot name="trailing" />
        <UButton
          v-if="reveal"
          color="neutral"
          variant="link"
          :disabled="binding.disabled"
          :aria-label="reveal.label"
          data-password-reveal
          :aria-pressed="reveal.shown"
          @mousedown.prevent
          @click="reveal.toggle"
        >
          <component
            :is="reveal.shown ? HideIcon : ShowIcon"
            aria-hidden="true"
          />
        </UButton>
      </template>
    </component>
  </div>
</template>
