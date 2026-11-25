<script setup lang="ts">
  import { computed, inject, provide, toRef, useId } from 'vue'
  import { ConfigProvider, TooltipProvider } from 'reka-ui'
  import UOverlayProvider from '@nuxt/ui/components/OverlayProvider.vue'
  import { localeContextInjectionKey } from '@nuxt/ui/composables/useLocale'
  import { portalTargetInjectionKey } from '@nuxt/ui/composables/usePortal'
  import en from '@nuxt/ui/runtime/locale/en.js'

  const props = defineProps<{ locale?: typeof en; dir: 'ltr' | 'rtl' }>()
  const parentLocale = inject(localeContextInjectionKey, undefined)
  const locale = computed(() => ({
    ...(props.locale || parentLocale?.value || en),
    dir: props.dir,
  }))

  // Match Nuxt UI 4.12.0 App's provider setup for the adapter's locale and
  // direction. Uninterface mounts its own toast views through the app slot.
  provide(localeContextInjectionKey, locale)
  provide(
    portalTargetInjectionKey,
    toRef(() => 'body'),
  )
</script>

<template>
  <ConfigProvider
    :use-id="useId"
    :dir="dir"
    :locale="locale.code"
  >
    <TooltipProvider>
      <slot />
      <UOverlayProvider />
    </TooltipProvider>
  </ConfigProvider>
</template>
