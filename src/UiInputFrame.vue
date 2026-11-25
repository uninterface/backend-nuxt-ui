<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import {
    useUiFieldFailure,
    useUiFieldDescription,
    useUiInputFrameSurface,
    type UiInputFrameViewProps,
  } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiInputFrameViewProps>()
  const emit = defineEmits<{ enter: []; leave: [] }>()
  const { attrs, focus } = useUiInputFrameSurface(props, emit)
  defineExpose({ focus })
  const invalid = useUiFieldFailure(() => props.binding)
  const description = useUiFieldDescription(
    () => props.descriptionBinding,
    'replace-help',
  )
  const size = useControlSize('UiInputFrame')
  import { computed } from 'vue'
  import { useAppConfig } from '#imports'
  import { useComponentProps } from '@nuxt/ui/composables/useComponentProps'
  import { tv } from '@nuxt/ui/utils/tv'
  import theme from '#build/ui/input'
  const config = useAppConfig()
  const defaults = useComponentProps('input', {
    variant: undefined as string | undefined,
    color: undefined as string | undefined,
  })
  const classes = computed(() => {
    const ui = (
      tv({ extend: theme, ...config.ui?.input }) as unknown as (
        options: Record<string, unknown>,
      ) => { base(): string }
    )({
      size: size.value,
      variant: defaults.variant,
      color: invalid.value ? 'error' : defaults.color,
      highlight: invalid.value,
    })
    // Backend CSS extends native state variants to this compound surface.
    return ui.base()
  })
</script>
<template>
  <div
    v-bind="{ ...$attrs, ...attrs }"
    :class="[classes, 'nuxt-input-frame']"
    :data-disabled="binding.disabled ? '' : undefined"
    :aria-describedby="description"
  >
    <slot name="leading" />
    <slot />
    <slot name="trailing" />
  </div>
</template>
