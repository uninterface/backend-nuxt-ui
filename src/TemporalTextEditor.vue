<script setup lang="ts">
  import { ref } from 'vue'
  import {
    useUiTemporalEditor,
    type UiTemporalEditorViewProps,
    type UiFocusHandle,
  } from '@uninterface/uninterface/backend'
  import UiTextInput from './UiTextInput.vue'
  import TemporalPicker from './TemporalPicker.vue'
  import TemporalAction from './TemporalAction.vue'
  const emit = defineEmits<{ 'open-change': [open: boolean] }>()
  const props = defineProps<
    UiTemporalEditorViewProps & {
      unbounded?: boolean
      boundaryLabel?: string
      toggleBoundary?: () => void
    }
  >()
  const { text, focused, update, blur } = useUiTemporalEditor(props)
  const editor = ref<UiFocusHandle>()
  const picker = ref<{ show(): void }>()
  function pick(value: string) {
    // Picker output is canonical, not text to parse with the display adapter.
    props.update(value)
  }
  defineExpose({ focus: () => editor.value?.focus() ?? Promise.resolve(null) })
</script>
<template>
  <div
    class="nuxt-ui-temporal-editor"
    :class="{ 'nuxt-ui-temporal-part': frame?.owner === 'parent' }"
  >
    <UiTextInput
      ref="editor"
      v-bind="$attrs"
      :binding="binding"
      :frame="frame"
      :data-temporal-inline-time="kind === 'time' ? '' : undefined"
      :aria-label="label || $attrs['aria-label']"
      :value="unbounded ? '∞' : text"
      type="text"
      inputmode="text"
      autocomplete="off"
      :readonly="readonly || unbounded"
      @update="update"
      @focus="focused = true"
      @blur="blur"
      @keydown.alt.down.prevent="picker?.show()"
    >
      <template
        v-if="!unbounded && kind !== 'time'"
        #leading
      >
        <TemporalPicker
          @open-change="emit('open-change', $event)"
          ref="picker"
          :binding="binding"
          :kind="kind"
          :value="value"
          :precision="precision"
          :readonly="readonly"
          :label="label"
          :presentation="presentation"
          :eligible="eligible"
          :update="pick"
          :blur="blur"
        />
      </template>
      <template
        v-if="toggleBoundary"
        #trailing
      >
        <TemporalAction
          :label="boundaryLabel ?? ''"
          :active="unbounded"
          :disabled="binding.disabled || readonly"
          @click="toggleBoundary"
        />
      </template>
    </UiTextInput>
  </div>
</template>
