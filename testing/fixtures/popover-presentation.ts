import { h, ref } from 'vue'
import {
  UiButton,
  UiPopover,
  createUiPopoverControl,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountPopover() {
  const popover = createUiPopoverControl<string>()
  const popoverModal = ref(false)
  const errors: string[] = []
  const renderPopover = () =>
    h(
      UiPopover,
      {
        key: String(popoverModal.value),
        control: popover,
        title: 'Quick edit',
        modal: popoverModal.value,
        placement: 'bottom',
      },
      {
        host: ({
          buttonTrigger,
          anchor,
        }: {
          buttonTrigger: Record<string, unknown>
          anchor: Record<string, unknown>
        }) => [
          h(
            UiButton,
            { ...buttonTrigger, id: 'popover-trigger' },
            () => 'Quick edit',
          ),
          h('span', { ...anchor, id: 'separate-anchor' }, 'Anchor'),
        ],
        default: () => 'Edit details',
      },
    )
  const app = createUiApplication({ render: renderPopover })
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  const host = document.body.appendChild(document.createElement('div'))
  app.mount(host)
  return {
    popover,
    popoverModal,
    errors,
    async dispose() {
      app.unmount()
      await popover.dispose()
      host.remove()
    },
  }
}
