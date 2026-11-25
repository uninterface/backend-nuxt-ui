import { defineComponent, h, nextTick } from 'vue'
import { createUiApplication } from '@uninterface/uninterface/setup'
import Icon from '@nuxt/ui/components/Icon.vue'
import { useAppConfig } from '#imports'
import TemporalRangeIcon from '../../src/TemporalRangeIcon.vue'

export async function mountIcons() {
  const host = document.createElement('div')
  document.body.append(host)
  const errors: string[] = []
  const app = createUiApplication(
    defineComponent({
      setup() {
        const config = useAppConfig()
        const icons = config.ui?.icons
        if (!icons) throw new Error('Nuxt UI icon configuration is missing.')
        return () =>
          h('div', [
            ...Object.entries(icons).map(([role, name]) =>
              h(Icon, { name, 'data-native-icon': role }),
            ),
            ...(
              ['start', 'end', 'bounded', 'next-day', 'unrestricted'] as const
            ).map((mode) =>
              h(TemporalRangeIcon, { mode, 'data-temporal-artwork': mode }),
            ),
          ])
      },
    }),
  )
  app.config.warnHandler = (message) => errors.push(message)
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  app.mount(host)
  await nextTick()
  return {
    host,
    errors,
    dispose: () => {
      app.unmount()
      host.remove()
    },
  }
}
