import { h } from 'vue'
import {
  UiModal,
  createUiModalControl,
  UiButton,
  UiField,
  UiSelect,
  createUiEntryControl,
  createUiFieldControl,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountModal() {
  const control = createUiModalControl<void>()
  const field = createUiFieldControl('one')
  const choices = createUiEntryControl([
    { key: 'one', label: 'First choice' },
    { key: 'two', label: 'Second choice' },
  ])
  const errors: string[] = []
  const app = createUiApplication({
    render: () =>
      h(
        UiModal,
        { control, title: 'Modal example' },
        {
          default: () =>
            h(UiField, { field, label: 'Choice' }, () =>
              h(UiSelect, { control: choices }),
            ),
          actions: () =>
            h(
              UiButton,
              { onClick: () => control.state.session?.cancel() },
              () => 'Cancel',
            ),
        },
      ),
  })
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  const host = document.body.appendChild(document.createElement('div'))
  app.mount(host)
  return {
    control,
    errors,
    async dispose() {
      app.unmount()
      await control.dispose()
      choices.dispose()
      host.remove()
    },
  }
}
