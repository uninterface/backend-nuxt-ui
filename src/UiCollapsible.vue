<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { computed } from 'vue'
  import {
    AccordionRoot,
    AccordionItem,
    AccordionHeader,
    AccordionTrigger,
    AccordionContent,
  } from 'reka-ui'
  import UIcon from '@nuxt/ui/components/Icon.vue'
  import theme from '#build/ui/accordion'
  import { useAppConfig } from '#imports'
  import { tv } from '@nuxt/ui/utils/tv'
  import type { UiCollapsibleViewProps } from '@uninterface/uninterface/backend'
  const props = defineProps<UiCollapsibleViewProps>()
  const emit = defineEmits<{ 'update:expanded': [expanded: boolean] }>()
  const appConfig = useAppConfig()
  const ui = computed(() =>
    (
      tv({
        extend: theme,
        ...appConfig.ui?.accordion,
      }) as unknown as (
        options: Record<string, boolean>,
      ) => Record<string, (options?: Record<string, unknown>) => string>
    )({ disabled: props.disabled }),
  )
  function request(value: unknown) {
    if (!props.disabled) emit('update:expanded', value === props.panelId)
  }
</script>
<template>
  <AccordionRoot
    as-child
    type="single"
    :model-value="expanded ? panelId : ''"
    collapsible
    :unmount-on-hide="false"
    :disabled="disabled"
    :class="ui.root()"
    @update:model-value="request"
  >
    <AccordionItem
      :value="panelId"
      :disabled="disabled"
      data-slot="item"
      :class="ui.item()"
    >
      <AccordionHeader
        as="div"
        data-slot="header"
        :class="ui.header()"
      >
        <AccordionTrigger
          as-child
          data-slot="trigger"
          :class="ui.trigger()"
        >
          <button
            :id="triggerId"
            type="button"
            :aria-controls="panelId"
          >
            <span
              data-slot="label"
              :class="ui.label()"
              class="inline-flex flex-wrap items-center gap-2"
            >
              <slot name="summary" />
            </span>
            <UIcon
              :name="
                appConfig.ui?.icons?.chevronDown ?? 'i-lucide-chevron-down'
              "
              data-slot="trailingIcon"
              :class="ui.trailingIcon()"
            />
          </button>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent
        as-child
        data-slot="content"
        :class="ui.content()"
        :inert="!expanded"
        :aria-hidden="!expanded"
      >
        <div
          :id="panelId"
          :aria-labelledby="triggerId"
        >
          <div
            data-slot="body"
            :class="ui.body()"
          >
            <slot v-if="mounted" />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
