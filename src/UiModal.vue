<script setup lang="ts">
  import FooterActions from './FooterActions.vue'
  import { computed, ref, useId } from 'vue'
  import { tv } from '@nuxt/ui/utils/tv'
  import { useAppConfig } from '#imports'
  import theme from '#build/ui/modal'
  import { uiFocusPresentation } from './focus'
  import {
    useUiModalView,
    settleUiModalMotion,
    type UiModalViewProps,
  } from '@uninterface/uninterface/backend'
  import UButton from '@nuxt/ui/components/Button.vue'
  const props = defineProps<UiModalViewProps>()
  const appConfig = useAppConfig()
  const ui = computed(
    () =>
      (
        tv({ extend: theme, ...appConfig.ui?.modal }) as unknown as (
          options: Record<string, boolean>,
        ) => unknown
      )({
        fullscreen: false,
        overlay: true,
        scrollable: false,
        transition: true,
      }) as unknown as Record<
        string,
        (options?: Record<string, unknown>) => string
      >,
  )
  // Keep the complete native content theme on the regions, including scoped
  // divider overrides. Portals remain siblings under the native dialog host.
  const surface = ref<HTMLElement>()
  const emit = defineEmits<{
    cancel: [reason: UiModalViewProps['closeOn'][number]]
  }>()
  const {
    widthStyle,
    vModalPart,
    ModalPart,
    dialog,
    body,
    title: heading,
    open,
    close,
    cancel,
    pointerdown,
    click,
  } = useUiModalView(() => props, emit, {
    beforeEnter: () => {
      if (surface.value) surface.value.dataset.state = 'open'
    },
    enter: async () => {
      if (surface.value) await settleUiModalMotion(surface.value)
    },
    leave: async () => {
      if (!surface.value) return
      surface.value.dataset.state = 'closed'
      await settleUiModalMotion(surface.value)
    },
  })
  const id = useId()
  defineExpose({ open, close })
</script>
<template>
  <dialog
    ref="dialog"
    :style="widthStyle"
    class="nuxt-modal"
    :aria-labelledby="`${id}-title`"
    @cancel="cancel"
    @pointerdown="pointerdown"
    @click="click"
  >
    <div
      ref="surface"
      class="nuxt-modal-surface"
      data-slot="content"
      :class="
        ui.content({
          class: 'relative inset-auto translate-none m-0 w-full max-w-none',
        })
      "
    >
      <header
        v-modal-part="'header'"
        data-slot="header"
        :class="ui.header({ class: 'shrink-0 relative' })"
      >
        <div
          data-slot="wrapper"
          :class="
            ui.wrapper({
              class: closeOn.includes('close-button')
                ? 'min-w-0 pe-10'
                : 'min-w-0',
            })
          "
        >
          <h2
            :id="`${id}-title`"
            ref="heading"
            v-bind="uiFocusPresentation"
            tabindex="-1"
            data-slot="title"
            :class="ui.title()"
          >
            {{ title }}
          </h2>
          <ModalPart part="header">
            <slot name="header-extra" />
          </ModalPart>
        </div>
        <UButton
          v-if="closeOn.includes('close-button')"
          :icon="appConfig.ui?.icons.close"
          data-slot="close"
          :class="ui.close()"
          color="neutral"
          variant="ghost"
          :disabled="pendingClose"
          :aria-label="closeLabel"
          @click="emit('cancel', 'close-button')"
        />
      </header>
      <div
        ref="body"
        v-bind="uiFocusPresentation"
        role="region"
        :aria-labelledby="`${id}-title`"
        tabindex="0"
        data-slot="body"
        :class="
          ui.body({
            class:
              bodyScroll === 'content' ? 'min-h-0 flex flex-col' : 'min-h-0',
          })
        "
      >
        <slot />
      </div>
      <footer
        v-modal-part="'footer'"
        v-if="$slots.footer || $slots.actions"
        data-slot="footer"
        :class="ui.footer({ class: 'shrink-0' })"
      >
        <ModalPart part="footer">
          <FooterActions v-if="$slots.actions">
            <slot name="actions" />
          </FooterActions>
          <slot
            v-else
            name="footer"
          />
        </ModalPart>
      </footer>
    </div>
  </dialog>
</template>
