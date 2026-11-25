import { h, nextTick } from 'vue'
import { createUiApplication } from '@uninterface/uninterface/setup'
import NestedModalPopups from './NestedModalPopups.vue'

export async function mountModalPopups() {
  const host = document.createElement('div')
  document.body.append(host)
  const errors: string[] = []
  const app = createUiApplication({ render: () => h(NestedModalPopups) })
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  app.mount(host)
  await nextTick()
  return {
    errors,
    dispose() {
      app.unmount()
      host.remove()
    },
  }
}
