import '@uninterface/backend/style.css'
import '@uninterface/uninterface/style.css'
import { h, nextTick, ref } from 'vue'
import {
  UiNavbar,
  UiField,
  UiSegmentedSelect,
  UiStrategy,
  uiFieldLabels,
  uiControlSize,
  createUiFieldControl,
  createUiEntryControl,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountFieldAlignment() {
  const selection = createUiFieldControl('one')
  const entries = createUiEntryControl([
    { key: 'one', label: 'First' },
    { key: 'two', label: 'Second' },
    { key: 'three', label: 'Third' },
  ])
  const size = ref<-1 | 0 | 1>(0)
  const labels = ref<'above' | 'beside' | 'show'>('above')
  const tall = ref(false)
  const help = ref(false)
  const host = document.createElement('div')
  document.body.append(host)
  const app = createUiApplication({
    render: () =>
      h(
        UiStrategy,
        { use: [uiControlSize(size.value), uiFieldLabels(labels.value)] },
        {
          default: () =>
            h(
              UiNavbar,
              { 'aria-label': 'Field alignment' },
              {
                actions: () => [
                  h(
                    UiField,
                    {
                      field: selection,
                      label: 'Choices',
                      help: help.value
                        ? 'Additional explanation below choices.'
                        : undefined,
                      'data-alignment-field': 'segments',
                    },
                    {
                      default: () =>
                        h(UiSegmentedSelect, {
                          control: entries,
                          orientation: tall.value ? 'vertical' : 'horizontal',
                        }),
                    },
                  ),
                ],
              },
            ),
        },
      ),
  })
  const errors: string[] = []
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  app.mount(host)
  await entries.load()
  await nextTick()
  return {
    host,
    errors,
    async update(options: {
      size?: -1 | 0 | 1
      labels?: 'above' | 'beside' | 'show'
      tall?: boolean
      help?: boolean
    }) {
      if (options.size !== undefined) size.value = options.size
      if (options.labels !== undefined) labels.value = options.labels
      if (options.tall !== undefined) tall.value = options.tall
      if (options.help !== undefined) help.value = options.help
      await nextTick()
    },
    dispose() {
      app.unmount()
      entries.dispose()
      host.remove()
    },
  }
}

void mountFieldAlignment().then((fixture) => {
  Object.assign(window, { fieldAlignment: fixture })
})
