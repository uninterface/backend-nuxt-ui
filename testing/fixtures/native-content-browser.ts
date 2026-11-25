import '@uninterface/backend/style.css'
import { createUiApplication } from '@uninterface/uninterface/setup'
import NativeContent from './NativeContent.vue'

const app = createUiApplication(NativeContent)
const host = document.createElement('div')
document.body.append(host)
export const errors: string[] = []
app.config.errorHandler = (error) => errors.push(String(error))
export const ready = app.ui.ready.then(() => app.mount(host))
export function dispose() {
  app.unmount()
  host.remove()
}
