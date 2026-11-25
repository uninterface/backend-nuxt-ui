<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import {
    useUiTooltipView,
    useUiOverlayTarget,
    type UiTooltipViewProps,
  } from '@uninterface/uninterface/backend'
  const props = defineProps<UiTooltipViewProps>()
  const {
    anchor,
    surface,
    trigger,
    surfaceEvents,
    visible,
    describe,
    placement,
  } = useUiTooltipView(props)
  const portal = useUiOverlayTarget()
  import UTooltip from '@nuxt/ui/components/Tooltip.vue'
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { popupTarget } from './zOrder'
  useUiZPopup(() => popupTarget(surface.value), {
    tooltip: { anchor: () => anchor.value, visible: () => visible.value },
    source: 'UiTooltip',
  })
</script>
<template>
  <slot
    name="host"
    :trigger="trigger"
  />
  <UTooltip
    v-if="anchor"
    :reference="anchor"
    :open="visible"
    :disabled="disabled"
    :portal="portal"
    :content="{ side: placement }"
    :delay-duration="0"
    :disable-closing-trigger="true"
  >
    <template #content>
      <div
        :id="id"
        ref="surface"
        v-bind="surfaceEvents"
      >
        <slot />
      </div>
    </template>
  </UTooltip>
</template>
