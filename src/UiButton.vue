<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { useControlSize } from './controlSize'
  import {
    focusUiTarget,
    useUiButtonPresentation,
  } from '@uninterface/uninterface/backend'
  import { computed, ref } from 'vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import type { UiButtonViewProps } from '@uninterface/uninterface/backend'
  defineOptions({ inheritAttrs: false })
  const props = withDefaults(defineProps<UiButtonViewProps>(), {
    color: 'secondary',
  })
  const color = computed(() =>
    props.color === 'danger' ? 'error' : props.color,
  )
  const element = ref<{ $el: HTMLElement }>()
  defineExpose({
    focus: () =>
      focusUiTarget(
        () => element.value?.$el,
        () => Boolean(props.disabled || props.loading),
      ),
  })
  const {
    variant: buttonVariant,
    width: buttonWidth,
    iconOnly,
    hint,
  } = useUiButtonPresentation(props, { collectionActionVariant: 'bordered' })
  const controlSize = useControlSize('UiButton')
</script>
<template>
  <span
    class="nuxt-button-host"
    :data-ui-button-width="buttonWidth()"
    :data-ui-control-frame="frame?.owner"
  >
    <UButton
      :block="
        buttonWidth() === undefined ? undefined : buttonWidth() === 'full'
      "
      :size="controlSize"
      ref="element"
      v-bind="$attrs"
      class="nuxt-button nuxt-control-focus"
      :loading-auto="false"
      :square="iconOnly()"
      :type="type"
      :form="form"
      :title="hint()"
      :data-ui-button-variant="buttonVariant()"
      :color="color"
      :variant="
        buttonVariant() === undefined
          ? undefined
          : (
              {
                filled: 'solid',
                outline: 'outline',
                neutral: 'outline',
                soft: 'soft',
                text: 'ghost',
                icon: 'ghost',
              } as const
            )[buttonVariant()!]
      "
      :disabled="disabled || loading"
      :loading="loading"
      :aria-busy="loading || undefined"
    >
      <template
        v-if="$slots.icon && !iconOnly() && !loading"
        #leading
      >
        <span
          class="nuxt-button-icon"
          aria-hidden="true"
        >
          <slot name="icon" />
        </span>
      </template>
      <span
        v-if="iconOnly()"
        class="nuxt-button-icon"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>
      <span
        class="nuxt-button-label"
        :class="{ 'sr-only nuxt-button-label-hidden': iconOnly() }"
      >
        <slot />
      </span>
    </UButton>
    <span
      class="sr-only nuxt-button-status"
      role="status"
      aria-live="polite"
    >
      {{ loading ? loadingLabel : '' }}
    </span>
  </span>
</template>
