<script setup lang="ts">
  import { useUiControlFrameParticipant } from '@uninterface/uninterface/backend'
  import { computed, ref } from 'vue'
  import type {
    UiTemporalEditorViewProps,
    UiFocusHandle,
  } from '@uninterface/uninterface/backend'
  import { nativeTemporalSupported } from './temporalNative'
  import TemporalNativeEditor from './TemporalNativeEditor.vue'
  import TemporalTextEditor from './TemporalTextEditor.vue'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<
    UiTemporalEditorViewProps & {
      extendedHours?: boolean
      unbounded?: boolean
      boundaryLabel?: string
      toggleBoundary?: () => void
    }
  >()
  const editor = ref<UiFocusHandle>()
  const { frame, setEngaged } = useUiControlFrameParticipant({
    focus: () => editor.value?.focus() ?? Promise.resolve(null),
    invalid: () => props.binding.invalid,
  })
  const nativeDraft = ref<string>()
  const native = computed(
    () =>
      !props.extendedHours &&
      !props.unbounded &&
      props.precision !== 'millisecond' &&
      (nativeTemporalSupported(props) || props.value === nativeDraft.value),
  )
  const viewProps = computed(() => {
    // Editor-selection flags must not fall through to the native DOM. The
    // text fallback alone consumes unbounded to present the infinity value.
    const { extendedHours, unbounded, ...view } = props
    return native.value ? view : { ...view, unbounded }
  })
  function update(value: string) {
    if (native.value) nativeDraft.value = value
    props.update(value)
  }
  defineExpose({ focus: () => editor.value?.focus() ?? Promise.resolve(null) })
</script>
<template>
  <component
    :is="native ? TemporalNativeEditor : TemporalTextEditor"
    ref="editor"
    v-bind="{ ...$attrs, ...viewProps }"
    :frame="frame"
    :update="update"
    @open-change="setEngaged($event)"
  />
</template>
