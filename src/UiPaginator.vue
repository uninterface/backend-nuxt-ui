<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()
  import {
    useUiCollectionFooterNavigation,
    useUiCollectionFooterCompact,
  } from '@uninterface/uninterface/backend'
  const footerCompact = useUiCollectionFooterCompact()

  import UButton from '@nuxt/ui/components/Button.vue'
  import UPagination from '@nuxt/ui/components/Pagination.vue'
  import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
  import { computed } from 'vue'
  import { useUiResponsive } from '@uninterface/uninterface'
  import { useAppConfig } from '#imports'
  import { useLocale } from '@nuxt/ui/composables/useLocale'
  import { useComponentProps } from '@nuxt/ui/composables/useComponentProps'
  import { tv } from '@nuxt/ui/utils/tv'
  import theme from '#build/ui/pagination'
  import type { UiPaginatorViewProps } from '@uninterface/uninterface/backend'
  const props = defineProps<UiPaginatorViewProps>()
  const footerWidth = useUiCollectionFooterNavigation(
    () => (4 + Math.min(props.pageCount ?? 1, 5)) * 2.5,
    () => 14 + Math.max(0, String(props.page ?? 1).length - 1) * 0.65,
  )
  const compact = computed(
    () => footerCompact?.value ?? context.value === 'mobile',
  )
  const numbered = computed(
    () =>
      props.page !== undefined &&
      props.pageCount !== undefined &&
      props.pageCount > 0 &&
      props.page <= props.pageCount &&
      props.total !== undefined &&
      props.canJump,
  )
  const { context } = useUiResponsive()
  const config = useAppConfig()
  const { dir } = useLocale()
  // Reka's default labels are English. Native slots retain the pagination
  // presentation while supplying our localized accessible names.
  const presentation = useComponentProps(
    'pagination',
    {} as {
      siblingCount?: number
      color?: ButtonProps['color']
      variant?: ButtonProps['variant']
      activeColor?: ButtonProps['color']
      activeVariant?: ButtonProps['variant']
      size?: ButtonProps['size']
      ui?: Record<string, string>
      firstIcon?: string
      prevIcon?: string
      nextIcon?: string
      lastIcon?: string
    },
  )
  const controls = computed(() => [
    {
      slot: 'first' as const,
      label: props.firstLabel,
      icon:
        presentation.firstIcon ??
        (dir.value === 'rtl'
          ? config.ui?.icons.chevronDoubleRight
          : config.ui?.icons.chevronDoubleLeft),
    },
    {
      slot: 'prev' as const,
      label: props.previousLabel,
      icon:
        presentation.prevIcon ??
        (dir.value === 'rtl'
          ? config.ui?.icons.chevronRight
          : config.ui?.icons.chevronLeft),
    },
    {
      slot: 'next' as const,
      label: props.nextLabel,
      icon:
        presentation.nextIcon ??
        (dir.value === 'rtl'
          ? config.ui?.icons.chevronLeft
          : config.ui?.icons.chevronRight),
    },
    {
      slot: 'last' as const,
      label: props.lastLabel,
      icon:
        presentation.lastIcon ??
        (dir.value === 'rtl'
          ? config.ui?.icons.chevronDoubleLeft
          : config.ui?.icons.chevronDoubleRight),
    },
  ])
  const labelClass = computed(() =>
    (
      tv({
        extend: theme,
        ...config.ui?.pagination,
      }) as unknown as () => Record<
        string,
        (options?: Record<string, unknown>) => string
      >
    )().label({ class: presentation.ui?.label }),
  )
</script>
<template>
  <nav
    class="nuxt-paginator"
    :data-compact="compact ? '' : undefined"
    :aria-label="label"
    :aria-busy="pending"
  >
    <UPagination
      v-if="numbered"
      as="div"
      :show-controls="true"
      :show-edges="false"
      :page="page"
      :total="total"
      :items-per-page="acceptedPageSize"
      :disabled="pending"
      :sibling-count="
        compact
          ? (footerWidth ?? 0) >= 360
            ? 1
            : 0
          : (presentation.siblingCount ?? 2)
      "
      @update:page="goTo"
    >
      <template
        v-for="control in controls"
        :key="control.slot"
        #[control.slot]
      >
        <UButton
          :aria-label="control.label"
          :icon="control.icon"
          :color="presentation.color ?? 'neutral'"
          :variant="presentation.variant ?? 'outline'"
          :size="presentation.size"
        />
      </template>
      <template #item="{ item, page: current }">
        <UButton
          v-if="item.type === 'page'"
          :aria-label="pageName(item.value)"
          :label="String(item.value)"
          :color="
            current === item.value
              ? (presentation.activeColor ?? 'primary')
              : (presentation.color ?? 'neutral')
          "
          :variant="
            current === item.value
              ? (presentation.activeVariant ?? 'solid')
              : (presentation.variant ?? 'outline')
          "
          :size="presentation.size"
          :ui="{ label: labelClass }"
          square
        />
      </template>
    </UPagination>
    <template v-else>
      <UButton
        type="button"
        :disabled="!canFirst"
        :aria-label="firstLabel"
        :icon="compact ? controls[0].icon : undefined"
        @click="first"
      >
        <template v-if="!compact">{{ firstLabel }}</template>
      </UButton>
      <UButton
        type="button"
        :disabled="!canPrevious"
        :aria-label="previousLabel"
        :icon="compact ? controls[1].icon : undefined"
        @click="previous"
      >
        <template v-if="!compact">{{ previousLabel }}</template>
      </UButton>
      <span
        v-if="pageLabel"
        :aria-label="pageLabel"
      >
        {{ compact ? page : pageLabel }}
      </span>
      <UButton
        type="button"
        :disabled="!canNext"
        :aria-label="nextLabel"
        :icon="compact ? controls[2].icon : undefined"
        @click="next"
      >
        <template v-if="!compact">{{ nextLabel }}</template>
      </UButton>
      <UButton
        type="button"
        :disabled="!canLast"
        :aria-label="lastLabel"
        :icon="compact ? controls[3].icon : undefined"
        @click="last"
      >
        <template v-if="!compact">{{ lastLabel }}</template>
      </UButton>
    </template>
  </nav>
</template>
