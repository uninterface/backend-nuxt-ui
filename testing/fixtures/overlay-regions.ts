import { nextTick } from 'vue'
import { createUiApplication } from '@uninterface/uninterface/setup'
import OverlayRegions from './OverlayRegions.vue'

export async function mountOverlayRegions() {
  const host = document.body.appendChild(document.createElement('div'))
  const errors: string[] = []
  const app = createUiApplication(OverlayRegions)
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
