<script setup lang="ts">
  import FooterActions from './FooterActions.vue'
  import {
    useUiOverlayView,
    type UiOverlayViewProps,
  } from '@uninterface/uninterface/backend'
  import type { UiOverlayCloseTrigger } from '@uninterface/uninterface'
  import { uiFocusPresentation } from './focus'
  import { computed } from 'vue'
  import { tv } from '@nuxt/ui/utils/tv'
  import { useAppConfig } from '#imports'
  import popover from '#build/ui/popover'
  import modalTheme from '#build/ui/modal'
  import UButton from '@nuxt/ui/components/Button.vue'
  const props = defineProps<
    UiOverlayViewProps & {
      kind: 'popover'
      anchor?: HTMLElement
      trigger?: HTMLElement
    }
  >()
  const emit = defineEmits<{
    cancel: [reason: UiOverlayCloseTrigger]
    'update:expanded': [expanded: boolean]
    failure: [error: unknown]
  }>()
  const {
    surface,
    heading,
    arrow,
    placedSide,
    open,
    close,
    widthStyle,
    cancel,
    pointerdown,
    click,
  } = useUiOverlayView(
    () => props,
    props.kind,
    () => props.anchor,
    () => props.trigger,
    emit,
  )
  const config = useAppConfig()
  const ui = computed(() => {
    const regions = (
      tv({ extend: modalTheme, ...config.ui?.modal }) as unknown as (
        options: Record<string, unknown>,
      ) => Record<string, (options?: unknown) => string>
    )({ transition: false })
    const surface = (
      tv({ extend: popover, ...config.ui?.popover }) as unknown as (
        options: Record<string, unknown>,
      ) => Record<string, (options?: unknown) => string>
    )({ transition: false })
    return { ...regions, ...surface }
  })
  defineExpose({ open, close })
</script>
<template>
  <component
    :is="modal ? 'dialog' : 'div'"
    :role="modal ? undefined : 'dialog'"
    :id="`${id}-surface`"
    ref="surface"
    :popover="modal ? undefined : 'manual'"
    :inert="!active || undefined"
    :class="['nuxt-overlay', ui.content()]"
    :style="widthStyle"
    :data-ui-overlay="kind"
    :data-side="kind === 'popover' ? placedSide : undefined"
    :data-edge="edge"
    :data-panel="panel || undefined"
    :aria-modal="modal ? true : undefined"
    :aria-labelledby="title ? `${id}-title` : undefined"
    :aria-label="title ? undefined : name"
    @cancel="cancel"
    @pointerdown="pointerdown"
    @click="click"
  >
    <div class="nuxt-overlay-content">
      <header
        v-if="
          title || closeOn.includes('close-button') || $slots['header-extra']
        "
        :class="ui.header({ class: 'flex-col items-stretch' })"
      >
        <div class="nuxt-overlay-heading">
          <h2
            v-if="title"
            :id="`${id}-title`"
            ref="heading"
            tabindex="-1"
            :class="ui.title()"
            v-bind="uiFocusPresentation"
          >
            {{ title }}
          </h2>
          <UButton
            v-if="closeOn.includes('close-button')"
            :icon="config.ui?.icons.close"
            color="neutral"
            variant="ghost"
            :aria-label="closeLabel"
            :disabled="pendingClose || disabled"
            @click="emit('cancel', 'close-button')"
          />
        </div>
        <slot name="header-extra" />
      </header>
      <div
        :class="ui.body()"
        :ref="!title ? (el: any) => (heading = el?.$el ?? el) : undefined"
        role="region"
        tabindex="0"
        :aria-label="name"
        v-bind="uiFocusPresentation"
      >
        <slot />
      </div>
      <footer
        v-if="$slots.actions || $slots.footer"
        :class="ui.footer()"
      >
        <FooterActions v-if="$slots.actions">
          <slot name="actions" />
        </FooterActions>
        <slot
          v-else
          name="footer"
        />
      </footer>
    </div>
    <span
      v-if="kind === 'popover'"
      ref="arrow"
      class="nuxt-overlay-arrow"
      aria-hidden="true"
    >
      <!-- Reka UI 2.11.0 rounded Arrow artwork (MIT). Its public PopoverArrow
           requires Reka's competing positioning context; retain the artwork
           and Nuxt theme slot with this view's existing placement owner. -->
      <svg
        width="10"
        height="5"
        viewBox="0 0 12 6"
        preserveAspectRatio="none"
        data-slot="arrow"
        :class="ui.arrow()"
      >
        <path
          d="M0 0L4.58579 4.58579C5.36683 5.36683 6.63316 5.36684 7.41421 4.58579L12 0"
        />
      </svg>
    </span>
  </component>
</template>
