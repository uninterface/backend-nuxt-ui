<script setup lang="ts">
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { ref } from 'vue'
  import { NavigationMenuViewport, injectNavigationMenuContext } from 'reka-ui'
  import { autoUpdate, size, useFloating } from '@floating-ui/vue'
  import { useUiOverlayTarget } from '@uninterface/uninterface/backend'
  defineProps<{ viewportClass: string }>()
  const { rootNavigationMenu, dir } = injectNavigationMenuContext()
  const target = useUiOverlayTarget()
  const wrapper = ref<HTMLElement>()
  useUiZPopup(() => wrapper.value)
  const { floatingStyles } = useFloating(rootNavigationMenu, wrapper, {
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      size({
        apply({ rects, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`
        },
      }),
    ],
  })
</script>
<template>
  <Teleport :to="target ?? 'body'">
    <div
      ref="wrapper"
      :dir="dir"
      :style="floatingStyles"
      class="nuxt-navigation-viewport-wrapper"
    >
      <!-- Reka retains viewport sizing, trigger alignment and screen clamping.
           Floating UI moves the root-relative coordinate space out of layout
           stacking contexts and follows scrolling/resizing. -->
      <NavigationMenuViewport :class="viewportClass" />
    </div>
  </Teleport>
</template>
