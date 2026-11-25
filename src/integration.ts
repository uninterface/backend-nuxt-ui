import { defineComponent, h } from 'vue'
import en from '@nuxt/ui/runtime/locale/en.js'
import plugin from '@nuxt/ui/vue-plugin'
import type { UiBackendIntegration } from '@uninterface/uninterface/backend'
import AppProviders from './AppProviders.vue'
import icons from './icons'
export default {
  colorMode: { attribute: 'class', light: 'light', dark: 'dark' },
  initialLocale: en,
  locales: {
    resources: {
      en,
      ar: () => import('@nuxt/ui/runtime/locale/ar.js').then((m) => m.default),
      'zh-CN': () =>
        import('@nuxt/ui/runtime/locale/zh_cn.js').then((m) => m.default),
      'zh-TW': () =>
        import('@nuxt/ui/runtime/locale/zh_tw.js').then((m) => m.default),
    },
    aliases: {
      'zh-Hans': 'zh-CN',
      'zh-Hant': 'zh-TW',
      zh: 'zh-CN',
    },
  },
  icons,
  create({ nativeLocale, i18n }) {
    return {
      plugin,
      Root: defineComponent({
        setup(_, { slots }) {
          return () =>
            h(
              AppProviders,
              {
                locale: nativeLocale.value as typeof en,
                dir: i18n.state.value.direction,
              },
              slots,
            )
        },
      }),
    }
  },
} satisfies UiBackendIntegration
