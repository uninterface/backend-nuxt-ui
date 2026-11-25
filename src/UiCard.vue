<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { shallowRef } from 'vue'
  import { useUiLoadingSurface } from '@uninterface/uninterface/backend'
  import LoadingRegion from './UiLoadingRegion.vue'
  defineOptions({ inheritAttrs: false })
  const loadingHost = shallowRef<HTMLElement | { $el: HTMLElement }>()
  const loadingSurface = useUiLoadingSurface(() => loadingHost.value)
  import UCard from '@nuxt/ui/components/Card.vue'
  import type { UiCardViewProps } from '@uninterface/uninterface/backend'
  defineProps<UiCardViewProps>()
</script>
<template>
  <UCard
    ref="loadingHost"
    v-bind="$attrs"
    class="nuxt-card"
    :data-card-body="bodyLayout ? 'layout' : undefined"
    :data-card-top-end="$slots['top-end'] ? '' : undefined"
    :data-card-level="level"
    :data-card-header="treatment.header"
    :data-card-footer="treatment.footer"
    :data-card-density="treatment.density"
    :data-card-surface="treatment.surface"
    :data-card-elevation="treatment.elevation"
    :data-card-border="treatment.border"
    :data-card-title-size="treatment.titleSize"
    :style="{
      '--nuxt-card-accent': color
        ? `var(--ui-${color === 'danger' ? 'error' : color})`
        : 'var(--ui-border-accented)',
    }"
    variant="outline"
    :ui="{
      root: [
        'overflow-visible min-w-0 ring-0 divide-y-0',
        treatment.border === 'dashed'
          ? 'divide-dashed'
          : treatment.border === 'dotted'
            ? 'divide-dotted'
            : 'divide-solid',
      ],
      header: 'nuxt-card-header',
      body: 'nuxt-card-body',
      footer: 'nuxt-card-footer',
    }"
  >
    <template
      v-if="$slots.header || $slots.title || $slots.description"
      #header
    >
      <slot name="header">
        <div
          v-if="$slots.title"
          class="nuxt-card-title"
        >
          <slot name="title" />
        </div>
        <div
          v-if="$slots.description"
          class="nuxt-card-description"
        >
          <slot name="description" />
        </div>
      </slot>
    </template>
    <slot />
    <div
      v-if="$slots['top-end']"
      class="nuxt-card-top-end"
    >
      <slot name="top-end" />
    </div>
    <template
      v-if="$slots.footer"
      #footer
    >
      <slot name="footer" />
    </template>
  </UCard>
  <LoadingRegion
    :surface="loadingSurface"
    :loading="loading"
    :label="loadingLabel"
  />
</template>
