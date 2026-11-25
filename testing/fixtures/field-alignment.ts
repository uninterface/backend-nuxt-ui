import { h, nextTick, ref } from 'vue'
import {
  UiNavbar,
  UiField,
  UiSelect,
  UiSegmentedSelect,
  UiTextInput,
  UiStrategy,
  uiFieldLabels,
  uiControlSize,
  createUiFieldControl,
  createUiEntryControl,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountFieldAlignment() {
  const text = createUiFieldControl('Example')
  const longText = createUiFieldControl('First line\nSecond line\nThird line')
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
  const app = createUiApplication(
    {
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
                        label: 'Selection',
                        'data-alignment-field': 'select',
                      },
                      { default: () => h(UiSelect, { control: entries }) },
                    ),
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
                    h(
                      UiField,
                      {
                        field: text,
                        label: 'Short text',
                        'data-alignment-field': 'text',
                      },
                      { default: () => h(UiTextInput) },
                    ),
                    h(
                      UiField,
                      {
                        field: longText,
                        label: 'Long text',
                        'data-alignment-field': 'textarea',
                      },
                      { default: () => h(UiTextInput, { multiline: true }) },
                    ),
                  ],
                },
              ),
          },
        ),
    },
    { i18n: { preloadCore: ['uninterface.entries'] } },
  )
  const errors: string[] = []
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  await app.ui.ready
  await app.ui.i18n.loadNamespace('uninterface.entries')
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
