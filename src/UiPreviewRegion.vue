<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import {
    useUiFieldFailure,
    useUiFieldDescription,
    type UiPreviewRegionViewProps,
  } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiPreviewRegionViewProps>()
  const invalid = useUiFieldFailure(() => props.binding)
  const description = useUiFieldDescription(() => props.binding, 'replace-help')
  const size = useControlSize('UiPreviewRegion')
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
    // Use the input theme without creating an editable input element.
    return ui.base()
  })
</script>
<template>
  <div
    v-bind="$attrs"
    :id="binding.id"
    data-ui-preview-region
    :data-extent="extent"
    role="group"
    :aria-label="label"
    :aria-describedby="description"
    :aria-invalid="binding.invalid || undefined"
    :aria-disabled="binding.disabled || undefined"
    :aria-busy="binding.validating || undefined"
    :class="[classes, 'nuxt-ui-preview-region']"
    :data-disabled="binding.disabled ? '' : undefined"
  >
    <div
      class="nuxt-ui-preview-viewport"
      data-preview-viewport
    >
      <slot />
    </div>
  </div>
</template>
