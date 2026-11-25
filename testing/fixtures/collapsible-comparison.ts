import { nextTick, type Component } from 'vue'
import Comparison from './CollapsibleComparison.vue'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountComparison() {
  return mountCollapsibleFixture(Comparison)
}

export async function mountCollapsibleFixture(component: Component) {
  const app = createUiApplication(component)
  const errors: string[] = []
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  const host = document.createElement('div')
  document.body.append(host)
  app.mount(host)
  async function tick() {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 250))
    await nextTick()
  }
  await tick()
  return {
    host,
    errors,
    tick,
    dispose() {
      app.unmount()
      host.remove()
    },
  }
}
