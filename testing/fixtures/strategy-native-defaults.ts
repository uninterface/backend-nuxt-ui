import Defaults from '@nuxt/ui/components/Theme.vue'
import { h, nextTick, reactive } from 'vue'
import { createUiApplication } from '@uninterface/uninterface/setup'
import {
  UiField,
  UiTextInput,
  UiStrategy,
  createUiFieldControl,
  uiControlSize,
  uiControlSizeQuery,
  uiFieldHelp,
  uiFieldLabels,
  UiCheckbox,
} from '@uninterface/uninterface'

export async function mount() {
  const field = createUiFieldControl('Draft')
  const theme = reactive({
    props: {
      formField: {
        size: 'xl' as const,
        orientation: 'horizontal' as 'horizontal' | 'vertical',
      },
      input: { size: 'lg' as const },
    },
    ui: { formField: { help: 'font-semibold' } },
  })
  const checkbox = createUiFieldControl(false)
  const host = document.createElement('div')
  document.body.append(host)
  const app = createUiApplication({
    render: () =>
      h(Defaults, theme, () => [
        h(
          UiField,
          {
            field: checkbox,
            label: 'Native checkable defaults',
            'data-native-checkable': '',
          },
          () => h(UiCheckbox),
        ),
        h(UiStrategy, { use: uiFieldLabels('show') }, () =>
          h(
            UiField,
            {
              field: checkbox,
              label: 'Native checkable show',
              'data-native-checkable-show': '',
            },
            () => h(UiCheckbox),
          ),
        ),
        h(UiStrategy, { use: uiFieldLabels('floating') }, () =>
          h(
            UiField,
            {
              field: checkbox,
              label: 'Native checkable fallback',
              'data-native-checkable-fallback': '',
            },
            () => h(UiCheckbox),
          ),
        ),
        h(UiStrategy, { use: uiFieldLabels('show') }, () =>
          h(UiField, { field, label: 'Show labels' }, () =>
            h(UiTextInput, { 'data-native-show': '' }),
          ),
        ),
        h(UiStrategy, { use: uiFieldLabels('floating') }, () =>
          h(UiField, { field, label: 'Explicit floating' }, () =>
            h(UiTextInput, { 'data-native-floating': '' }),
          ),
        ),
        h(UiField, { field, label: 'Native defaults' }, () =>
          h(UiTextInput, { 'data-native-default': '' }),
        ),
        h(
          UiStrategy,
          { use: [uiControlSize(-1), uiFieldHelp('together')] },
          () =>
            h(
              UiField,
              { field, label: 'Sized field', help: 'Themed helper' },
              () =>
                h(UiStrategy, { block: uiControlSizeQuery }, () =>
                  h(UiTextInput, { 'data-native-blocked': '' }),
                ),
            ),
        ),
      ]),
  })
  await app.ui.ready
  app.mount(host)
  await nextTick()
  return {
    host,
    field,
    async setOrientation(value: typeof theme.props.formField.orientation) {
      theme.props.formField.orientation = value
      await nextTick()
    },
    dispose() {
      app.unmount()
      host.remove()
    },
  }
}
