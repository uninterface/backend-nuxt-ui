<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import {
    useUiSuggestionsView,
    useUiOverlayTarget,
    type UiSuggestionsViewProps,
  } from '@uninterface/uninterface/backend'
  const props = defineProps<UiSuggestionsViewProps>()
  const { anchor, surface, visible, host, active, accept } =
    useUiSuggestionsView(props)
  const portal = useUiOverlayTarget()
  import { computed } from 'vue'
  import { tv } from '@nuxt/ui/utils/tv'
  import { useAppConfig } from '#imports'
  import theme from '#build/ui/input-menu'
  const appConfig = useAppConfig()
  const ui = computed(() =>
    (
      tv({ extend: theme, ...appConfig.ui?.inputMenu }) as unknown as (
        options: Record<string, string>,
      ) => Record<string, (options?: Record<string, unknown>) => string>
    )({ size: 'md' }),
  )
  import UPopover from '@nuxt/ui/components/Popover.vue'
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { popupTarget } from './zOrder'
  useUiZPopup(() => popupTarget(surface.value), { source: 'UiSuggestions' })
</script>
<template>
  <slot
    name="host"
    :host="host"
  />
  <UPopover
    v-if="anchor"
    :reference="anchor"
    :open="visible"
    :portal="portal"
    :ui="{ content: 'nuxt-ui-suggestions-popup' }"
    :content="{
      side: 'bottom',
      align: 'start',
      onOpenAutoFocus: (event: Event) => event.preventDefault(),
      onCloseAutoFocus: (event: Event) => event.preventDefault(),
    }"
  >
    <template #content>
      <div
        ref="surface"
        class="nuxt-ui-suggestions"
      >
        <div
          :id="id"
          role="listbox"
          :aria-busy="pending || undefined"
          :class="ui.viewport()"
          :aria-label="label"
        >
          <div
            v-for="(item, index) in results"
            :id="`${id}-${index}`"
            :key="item.key"
            role="option"
            :class="ui.item()"
            :data-highlighted="active === index ? '' : undefined"
            :data-disabled="item.disabled ? '' : undefined"
            :aria-label="item.label"
            :aria-selected="active === index"
            :aria-disabled="item.disabled || undefined"
            @mousedown.prevent
            @click="accept(index)"
          >
            <span :class="ui.itemWrapper()">
              <!-- InputMenu's row gap separates the label from leading and trailing content. -->
              <span :class="ui.itemLabel()">
                <slot
                  name="suggestion"
                  :item="item"
                  :active="active === index"
                >
                  {{ item.label }}
                </slot>
              </span>
            </span>
          </div>
        </div>
        <div
          v-if="message"
          :class="ui.empty(results.length ? { class: 'py-1' } : undefined)"
          role="status"
        >
          <small v-if="results.length">{{ message }}</small>
          <template v-else>{{ message }}</template>
        </div>
      </div>
    </template>
  </UPopover>
</template>
