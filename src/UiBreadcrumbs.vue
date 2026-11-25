<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()
  import { useUiZPart } from '@uninterface/uninterface/backend'
  const vUiZPart = useUiZPart()

  import UButton from '@nuxt/ui/components/Button.vue'
  import { computed } from 'vue'
  import type { UiBreadcrumbsViewProps } from '@uninterface/uninterface/backend'
  import UIcon from '@nuxt/ui/components/Icon.vue'
  import ULinkBase from '@nuxt/ui/components/LinkBase.vue'
  import { useLocale } from '@nuxt/ui/composables/useLocale'
  import { tv } from '@nuxt/ui/utils/tv'
  import { useAppConfig } from '#imports'
  import theme from '#build/ui/breadcrumb'
  defineProps<UiBreadcrumbsViewProps>()
  const appConfig = useAppConfig()
  const { dir } = useLocale()
  // Use the native theme and link primitive while forwarding all target attributes
  // and capture listeners (UBreadcrumb's item prop picker drops some of them).
  const ui = computed(() =>
    (
      tv({ extend: theme, ...appConfig.ui?.breadcrumb }) as unknown as (
        options?: Record<string, unknown>,
      ) => Record<string, (options?: Record<string, unknown>) => string>
    )(),
  )
</script>
<template>
  <nav
    :aria-label="label"
    data-uninterface-breadcrumbs
    data-slot="root"
    :class="ui.root()"
  >
    <ol
      data-slot="list"
      :class="ui.list()"
    >
      <template
        v-for="(item, index) in items"
        :key="item.key"
      >
        <li
          v-ui-z-part="item.z"
          data-slot="item"
          :class="ui.item()"
        >
          <ULinkBase
            v-bind="item.attributes"
            :as="item.actionable ? 'button' : 'span'"
            :href="item.href"
            :type="
              item.actionable && item.href === undefined ? 'button' : undefined
            "
            :disabled="item.disabled"
            :aria-disabled="item.disabled || undefined"
            :aria-current="item.current ? 'page' : undefined"
            data-slot="link"
            :class="
              ui.link({
                active: item.current,
                disabled: item.disabled,
                to: item.href !== undefined,
              })
            "
          >
            <span
              data-slot="linkLabel"
              :class="ui.linkLabel()"
            >
              <slot :item="item" />
            </span>
          </ULinkBase>
        </li>
        <li
          v-if="index < items.length - 1"
          role="presentation"
          aria-hidden="true"
          data-slot="separator"
          :class="ui.separator()"
        >
          <UIcon
            :name="
              dir === 'rtl'
                ? (appConfig.ui?.icons?.chevronLeft ?? 'i-lucide-chevron-left')
                : (appConfig.ui?.icons?.chevronRight ??
                  'i-lucide-chevron-right')
            "
            data-slot="separatorIcon"
            :class="ui.separatorIcon()"
          />
        </li>
      </template>
    </ol>
    <div
      v-if="status?.message"
      role="status"
      :aria-busy="status.pending || undefined"
    >
      {{ status.message }}
      <UButton
        variant="link"
        v-if="status.failed"
        @click="retry?.()"
      >
        {{ status.retryLabel }}
      </UButton>
    </div>
  </nav>
</template>
