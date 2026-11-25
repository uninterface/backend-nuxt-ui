import ui from '@nuxt/ui/vite'
import { nativeIconsPlugin } from './nativeIcons.mjs'

/** Configure native presentation while retaining required adapter integration. */
export default function createBackendPlugins(options = {}) {
  if (
    !options ||
    typeof options !== 'object' ||
    Array.isArray(options) ||
    Object.keys(options).some((key) => key !== 'ui') ||
    (options.ui !== undefined &&
      (!options.ui ||
        typeof options.ui !== 'object' ||
        Array.isArray(options.ui)))
  ) {
    throw new Error(
      'Nuxt UI backend options must be an object with optional ui configuration.',
    )
  }
  const nativePlugins = ui({
    ui: options.ui,
    components: false,
    autoImport: false,
    dts: false,
    scanPackages: ['@uninterface/backend'],
    router: false,
    colorMode: false,
  })
  return [
    {
      name: 'uninterface-nuxt-locale-isolation',
      enforce: 'pre',
      config() {
        // The compiled views reference virtual Nuxt modules resolved by Vite
        // plugins. Keep Core and the adapter in that same module graph.
        return {
          optimizeDeps: {
            exclude: [
              '@nuxt/ui',
              'reka-ui',
              '@uninterface/backend',
              '@uninterface/uninterface',
            ],
          },
        }
      },
      transform(code, id) {
        if (
          id
            .replaceAll('\\', '/')
            .endsWith('/reka-ui/dist/Toast/ToastRootImpl.js')
        ) {
          // Managed feedback owns scoped Escape; native Reka otherwise listens
          // on the whole document, including unrelated modal/editor key events.
          const original = 'onKeyStroke("Escape", (event) => {'
          if (!code.includes(original))
            throw new Error(
              'Review Reka managed feedback keyboard integration after upgrade.',
            )
          return {
            code: code.replace(
              original,
              original +
                '\n if (currentElement.value?.hasAttribute("data-ui-managed-feedback")) return;',
            ),
            map: null,
          }
        }
        if (
          id
            .replaceAll('\\', '/')
            .endsWith('/@nuxt/ui/dist/runtime/components/FormField.vue')
        ) {
          const declaration =
            'const id = ref(useId());\nconst ariaId = id.value;'
          if (!code.includes(declaration))
            throw new Error(
              'Review Nuxt UI field identity integration after the toolkit update.',
            )
          return {
            code: code.replace(
              declaration,
              'const generatedId = useId();\nconst id = ref(inject(inputIdInjectionKey, undefined)?.value ?? generatedId);\nconst ariaId = generatedId;',
            ),
            map: null,
          }
        }
        if (
          !id
            .replaceAll('\\', '/')
            .endsWith('/@nuxt/ui/dist/runtime/composables/useLocale.js')
        )
          return
        // Nuxt UI 4.12.0 shares the first client injection through VueUse.
        // Keep its native translator and context, but resolve it per caller so
        // independent Vue apps/SSR hydration cannot borrow another app's locale.
        const declaration =
          'export const useLocale = import.meta.client ? createSharedComposable(_useLocale) : _useLocale;'
        if (!code.includes(declaration))
          throw new Error(
            'Review Nuxt UI locale isolation integration after the toolkit update.',
          )
        return {
          code: code.replace(
            declaration,
            'export const useLocale = _useLocale;',
          ),
          map: null,
        }
      },
    },
    nativeIconsPlugin(nativePlugins),
    nativePlugins,
  ]
}
