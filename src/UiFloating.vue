<script setup lang="ts">
  import UButton from '@nuxt/ui/components/Button.vue'
  import { Teleport } from 'vue'
  import {
    useUiFloatingView,
    useUiOverlayTarget,
    type UiFloatingViewProps,
  } from '@uninterface/uninterface/backend'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiFloatingViewProps>()
  const {
    root,
    ready,
    style,
    movePanel,
    moveStyle,
    editor,
    editing,
    closeMove,
    attributes,
    move,
  } = useUiFloatingView(props)
  const portal = useUiOverlayTarget()
</script>
<template>
  <Teleport
    :to="portal ?? 'body'"
    :disabled="!ready"
  >
    <div
      ref="root"
      class="nuxt-ui-floating"
      :style="style"
      v-bind="{ ...$attrs, ...attributes }"
    >
      <slot />
      <div
        ref="movePanel"
        :style="moveStyle"
        v-if="editing"
        class="nuxt-ui-floating-move"
        @pointerdown.stop
        @contextmenu.stop.prevent
      >
        <label>
          {{ positionLabel }}
          <input
            ref="editor"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="position * 100"
            @input="move(Number(($event.target as HTMLInputElement).value))"
          />
        </label>
        <UButton
          color="primary"
          variant="outline"
          @click="closeMove"
        >
          {{ doneLabel }}
        </UButton>
      </div>
    </div>
  </Teleport>
</template>
