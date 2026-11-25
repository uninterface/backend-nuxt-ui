<script setup lang="ts">
  import {
    useUiZPopup,
    useUiOverlayTarget,
    useUiTooltipAnchorVisibility,
    useUiTooltipPlacement,
  } from '@uninterface/uninterface/backend'
  import { popupTarget } from './zOrder'
  import { ref, onDeactivated, watch } from 'vue'
  import UTooltip from '@nuxt/ui/components/Tooltip.vue'
  const props = defineProps<{ message: string | null; id: string }>()
  const anchor = ref<HTMLElement>()
  const surface = ref<HTMLElement>(),
    portal = useUiOverlayTarget()
  useUiZPopup(() => popupTarget(surface.value), {
    tooltip: { anchor: () => anchor.value, visible: () => visible.value },
    source: 'field failure tooltip',
  })
  const suppressed = ref(false)
  const placement = useUiTooltipPlacement(
    () => anchor.value,
    () => 'top',
  )
  const visible = useUiTooltipAnchorVisibility(
    () => anchor.value,
    () => Boolean(props.message) && !suppressed.value,
  )
  onDeactivated(() => {
    suppressed.value = true
  })
  watch(
    () => props.message,
    () => {
      suppressed.value = false
    },
  )
</script>
<template>
  <div
    ref="anchor"
    class="nuxt-field-editor"
  >
    <slot />
    <span
      v-if="message"
      :id="id"
      class="nuxt-tooltip-description"
    >
      {{ message }}
    </span>
    <UTooltip
      :portal="portal"
      :reference="anchor"
      :open="visible"
      :disabled="!message"
      :content="{ side: placement }"
      :arrow="true"
      :ui="{ content: 'nuxt-field-failure-tooltip' }"
    >
      <template #content>
        <span
          ref="surface"
          :data-ui-field-tooltip-for="id"
        >
          {{ message }}
        </span>
      </template>
    </UTooltip>
  </div>
</template>
