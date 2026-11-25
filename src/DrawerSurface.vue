<script setup lang="ts">
  import DrawerDepth from './DrawerDepth.vue'
  import FooterActions from './FooterActions.vue'
  import {
    useUiOverlayView,
    useUiDrawerResize,
    createUiModalCssMotion,
    type UiOverlayViewProps,
  } from '@uninterface/uninterface/backend'
  import type { UiOverlayCloseTrigger } from '@uninterface/uninterface'
  import { uiFocusPresentation } from './focus'
  import { computed, nextTick, ref, watch, type ObjectDirective } from 'vue'
  import { useNativeDirection } from './nativeDirection'
  import {
    DrawerRoot,
    DrawerContent,
    DrawerHandle,
    DrawerTitle,
  } from 'vaul-vue'
  import { tv } from '@nuxt/ui/utils/tv'
  import { useAppConfig } from '#imports'
  import drawer from '#build/ui/drawer'
  import UButton from '@nuxt/ui/components/Button.vue'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<
    UiOverlayViewProps & { anchor?: HTMLElement; trigger?: HTMLElement }
  >()
  const emit = defineEmits<{
    cancel: [reason: UiOverlayCloseTrigger]
    'update:expanded': [expanded: boolean]
    failure: [error: unknown]
  }>()
  const {
    surface,
    visible,
    cssPanel,
    heading,
    open,
    close,
    widthStyle,
    cancel,
    pointerdown,
    click,
  } = useUiOverlayView(
    () => props,
    'drawer',
    () => props.anchor,
    () => props.trigger,
    emit,
    createUiModalCssMotion('nuxt-drawer', { includeBackdrop: true }),
  )
  const resize = useUiDrawerResize(() => props, surface)
  // Reka DialogContent always loops Tab, including nonmodal content. Install
  // this boundary listener before Vue installs the native primitive's listeners.
  // Descendant handlers still run; browser Tab defaults remain uncancelled for
  // panels, while owned popups/dialogs retain their own keyboard/focus behavior.
  const vDrawerKeyboard: ObjectDirective<HTMLElement> = {
    created(element) {
      element.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return
        if (
          event.defaultPrevented ||
          !props.modal ||
          (event.target as Element | null)?.closest('dialog') !== element
        )
          event.stopImmediatePropagation()
      })
    },
  }
  const nativeDrawer = ref<{ open: boolean }>()
  const exiting = ref(false)
  const canDrag = computed(
    () =>
      !props.docked &&
      props.active &&
      !exiting.value &&
      !props.pendingClose &&
      !props.disabled &&
      props.closeOn.includes('drag'),
  )
  // Native hosting owns modality/focus/exit lifetime; Vaul owns pointer gestures.
  // Restore Vaul's exposed local open ref synchronously, before its render watcher
  // can close the content. A drag only requests closure through the business owner.
  function resetDrag() {
    if (nativeDrawer.value) nativeDrawer.value.open = true
    surface.value?.style.removeProperty('transform')
    surface.value?.style.removeProperty('transition')
  }
  let cancelledGesture = false
  function cancelGesture() {
    cancelledGesture = true
    resetDrag()
  }
  watch(canDrag, (enabled) => {
    if (!enabled) cancelGesture()
  })
  function move(event: PointerEvent) {
    if (cancelledGesture) event.stopPropagation()
  }
  function release(staysOpen: boolean) {
    // Vaul 0.4.1 measures distance against height even for side drawers, and
    // compares signed translation for top/left. Keep native velocity handling,
    // but apply its 25% distance threshold on the actual outward travel axis.
    const element = surface.value
    const vertical = direction.value === 'top' || direction.value === 'bottom'
    const transform = element ? getComputedStyle(element).transform : 'none'
    const matrix = new DOMMatrixReadOnly(
      transform === 'none' ? undefined : transform,
    )
    const sign =
      direction.value === 'top' || direction.value === 'left' ? -1 : 1
    const distance = (vertical ? matrix.m42 : matrix.m41) * sign
    const bounds = element?.getBoundingClientRect()
    const size = bounds ? (vertical ? bounds.height : bounds.width) : 0
    const requested = !staysOpen || (size > 0 && distance >= size * 0.25)
    resetDrag()
    // Vaul writes its snap-back styles after emitting release(true).
    void nextTick(resetDrag)
    if (requested && !cancelledGesture && canDrag.value) emit('cancel', 'drag')
  }
  const writingDirection = useNativeDirection(
    () => surface.value ?? props.trigger,
  )
  const direction = computed(() => {
    if (props.edge === 'top' || props.edge === 'bottom') return props.edge
    return (props.edge === 'start') !== (writingDirection.value === 'rtl')
      ? 'left'
      : 'right'
  })
  const config = useAppConfig()
  const ui = computed(() =>
    (
      tv({
        extend: {
          ...drawer,
          slots: {
            ...drawer.slots,
            // Separate bounded body scrolling and stable region insets are adapter contracts.
            container: 'flex flex-col flex-1 min-w-0 min-h-0',
            header: [drawer.slots.header, 'p-4 px-6'],
            body: [drawer.slots.body, 'p-6'],
            footer: [drawer.slots.footer, 'p-4 px-6'],
          },
        },
        ...config.ui?.drawer,
      }) as unknown as (
        options: Record<string, unknown>,
      ) => Record<string, (options?: unknown) => string>
    )({ direction: direction.value, inset: false }),
  )
  defineExpose({
    element: surface,
    async open() {
      exiting.value = false
      await open()
    },
    async close() {
      exiting.value = true
      cancelGesture()
      await close()
    },
  })
</script>
<template>
  <DrawerRoot
    ref="nativeDrawer"
    :open="true"
    :modal="false"
    no-body-styles
    :direction="direction"
    :handle-only="!canDrag"
    :close-threshold="Infinity"
    @release="release"
  >
    <DrawerContent
      as-child
      force-mount
      :aria-describedby="undefined"
      @open-auto-focus.prevent
      @close-auto-focus.prevent
    >
      <component
        :is="modal ? 'dialog' : 'div'"
        v-bind="$attrs"
        v-drawer-keyboard
        :role="modal ? undefined : 'dialog'"
        :id="`${id}-surface`"
        ref="surface"
        :popover="modal || docked || cssPanel ? undefined : 'manual'"
        :inert="!active || undefined"
        :class="['nuxt-overlay', ui.content()]"
        :style="[
          widthStyle,
          drawerSizing
            ? ['start', 'end'].includes(edge)
              ? { width: `${drawerSizing.extent}px` }
              : { height: `${drawerSizing.extent}px` }
            : undefined,
          resize.style(),
        ]"
        :data-docked="docked || undefined"
        :data-css-panel="cssPanel || undefined"
        :hidden="((docked || cssPanel) && !active && !visible) || undefined"
        data-ui-overlay="drawer"
        :data-edge="edge"
        :data-panel="panel || undefined"
        :aria-modal="modal ? true : undefined"
        data-vaul-animate="false"
        data-vaul-custom-container="true"
        :data-vaul-no-drag="!canDrag || undefined"
        @pointerdown.capture="cancelledGesture = false"
        @pointermove.capture="move"
        @pointercancel="cancelGesture"
        @pointerup="() => nextTick(resetDrag)"
        @cancel="cancel"
        @pointerdown="pointerdown"
        @click="click"
      >
        <DrawerTitle
          v-if="!title"
          as="span"
          class="sr-only top-0 left-0"
        >
          {{ name }}
        </DrawerTitle>
        <DrawerHandle
          v-if="!docked && closeOn.includes('drag')"
          :class="ui.handle()"
          :data-disabled="!canDrag || undefined"
          :inert="!canDrag || undefined"
          prevent-cycle
        />
        <div
          class="nuxt-overlay-content"
          :class="ui.container()"
        >
          <header
            v-if="
              title ||
              closeOn.includes('close-button') ||
              $slots['header-extra']
            "
            :class="
              ui.header({
                class: [
                  'flex-col items-stretch',
                  !title && !$slots['header-extra'] ? 'pb-0' : undefined,
                ],
              })
            "
          >
            <div class="nuxt-overlay-heading">
              <DrawerTitle
                v-if="title"
                as-child
              >
                <h2
                  ref="heading"
                  tabindex="-1"
                  :class="ui.title()"
                  v-bind="uiFocusPresentation"
                >
                  {{ title }}
                </h2>
              </DrawerTitle>
              <UButton
                v-if="closeOn.includes('close-button')"
                :icon="config.ui?.icons.close"
                color="neutral"
                variant="ghost"
                :aria-label="closeLabel"
                :disabled="pendingClose || disabled"
                data-vaul-no-drag
                @click="emit('cancel', 'close-button')"
              />
            </div>
            <slot name="header-extra" />
          </header>
          <div
            :class="ui.body()"
            data-vaul-no-drag
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
            data-vaul-no-drag
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
        <DrawerDepth
          v-if="!docked"
          :edge="edge"
        />
        <div
          v-if="drawerSizing?.enabled"
          class="nuxt-ui-drawer-resize"
          v-bind="resize.attributes()"
        />
      </component>
    </DrawerContent>
  </DrawerRoot>
</template>
