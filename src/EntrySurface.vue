<script setup lang="ts">
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { popupTarget } from './zOrder'
  import { computed, ref, nextTick } from 'vue'
  import {
    DropdownMenuContent,
    DropdownMenuSubContent,
    injectNavigationMenuContext,
  } from 'reka-ui'
  import {
    useUiMenuPopup,
    useUiMenuPoint,
  } from '@uninterface/uninterface/backend'
  import { useMenuTheme } from './menuTheme'
  const props = defineProps<{
    sub?: boolean
    label: string
    parentKey?: string
    pending?: boolean
    anchor?: HTMLElement
    point?: { x: number; y: number }
    inline?: boolean
  }>()
  const emit = defineEmits<{ close: [] }>()
  const element = ref<HTMLElement>()
  const popup = useUiMenuPopup(element)
  useUiZPopup(() => (props.inline ? undefined : popupTarget(element.value)), {
    scope: true,
    scopeActive: () => !props.inline,
    source: 'menu popup',
  })
  const navigation = injectNavigationMenuContext(null)
  // Submenus are teleported outside NavigationMenu's content and viewport.
  // Share its native hover timer so entering a descendant cancels dismissal,
  // and leaving the whole popup tree still closes with the native delay.
  function pointerEnter(event: PointerEvent) {
    if (props.sub && event.pointerType === 'mouse')
      navigation?.onContentEnter(navigation.modelValue.value)
  }
  function pointerLeave(event: PointerEvent) {
    if (props.sub && event.pointerType === 'mouse') navigation?.onContentLeave()
  }
  function itemPointerLeave(event: PointerEvent) {
    const surface = element.value
    const item = event.target
    if (
      props.inline ||
      event.pointerType !== 'mouse' ||
      !surface ||
      !(item instanceof HTMLElement) ||
      !item.matches('[role^="menuitem"]')
    )
      return
    const focused = surface.ownerDocument.activeElement
    // Reka focuses this surface when a highlighted item loses its hover.
    // A viewport change can trigger that leave while focus is in an open child.
    if (!surface.contains(focused) && popup.contains(focused))
      event.stopPropagation()
  }
  const ui = useMenuTheme()
  const effectivePoint = useUiMenuPoint(
    () => props.point,
    () => props.anchor,
  )
  const reference = computed(() => {
    const point = effectivePoint.value
    return point
      ? {
          getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0),
          contextElement: props.anchor,
        }
      : props.anchor
  })
  function keyboard(event: KeyboardEvent) {
    // Reka Escape normally closes the entire tree; Uninterface closes one branch.
    if (props.sub && event.key === 'Escape') {
      // An open child trigger owns its own Escape, even when it is inside this
      // surface. Let it close the deeper branch without collapsing this one.
      if (
        (event.target as HTMLElement).closest(
          '[data-entry-key][aria-expanded="true"]',
        )
      )
        return
      event.preventDefault()
      event.stopImmediatePropagation()
      const trigger = document.getElementById(
        (event.currentTarget as HTMLElement)?.getAttribute('aria-labelledby') ??
          '',
      )
      emit('close')
      nextTick(() => trigger?.focus())
    }
  }
</script>
<template>
  <component
    :is="sub ? DropdownMenuSubContent : DropdownMenuContent"
    :ref="
      (instance: any) => {
        element = instance?.$el
      }
    "
    :reference="sub ? undefined : reference"
    :aria-label="label"
    :aria-busy="pending || undefined"
    :data-parent="parentKey"
    data-slot="content"
    :class="ui.content()"
    :side-offset="sub ? 0 : 8"
    :collision-padding="8"
    loop
    @pointerenter="pointerEnter"
    @pointerleave="pointerLeave"
    @pointerleave.capture="itemPointerLeave"
    @keydown.capture="keyboard"
    @escape-key-down="
      (event: KeyboardEvent) => {
        if (!sub) {
          event.preventDefault()
          emit('close')
        }
      }
    "
    @close-auto-focus.prevent
    @interact-outside="
      (event: Event) => {
        if (inline || anchor?.contains(event.target as Node))
          event.preventDefault()
      }
    "
  >
    <slot />
  </component>
</template>
