import { h, nextTick } from 'vue'
import { useAppConfig } from '#imports'
import UBreadcrumb from '@nuxt/ui/components/Breadcrumb.vue'
import { UiBreadcrumbs, UiBreadcrumb } from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountComparison(customized = false) {
  useAppConfig().ui!.breadcrumb = customized
    ? { slots: { link: 'hover:underline', separatorIcon: 'size-6' } }
    : {}
  const items = [
    { key: 'home', label: 'Home', to: '/home' },
    { key: 'group', label: 'Grouping' },
    { key: 'disabled', label: 'Unavailable', disabled: true },
    { key: 'current', label: 'Current' },
  ]
  const app = createUiApplication({
    render: () =>
      h('main', [
        h(UBreadcrumb, { items, 'data-native': '' }),
        h(
          UiBreadcrumbs,
          { 'data-adapter': '' },
          {
            default: () =>
              items.map((item) =>
                h(
                  UiBreadcrumb,
                  {
                    key: item.key,
                    href: item.to,
                    disabled: item.disabled,
                  },
                  { default: () => item.label },
                ),
              ),
          },
        ),
      ]),
  })
  const errors: string[] = []
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  const host = document.createElement('div')
  document.body.append(host)
  app.mount(host)
  await nextTick()
  return {
    host,
    errors,
    dispose() {
      app.unmount()
      host.remove()
    },
  }
}
