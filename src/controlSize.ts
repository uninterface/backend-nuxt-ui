import { useComponentProps } from '@nuxt/ui/composables/useComponentProps'
import { fieldSizeKey } from './fieldPresentation'
import {
  computed,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
} from 'vue'
import {
  useUiStrategy,
  uiControlSizeQuery,
} from '@uninterface/uninterface/backend'
const strategySizeKey: InjectionKey<ComputedRef<boolean>> = Symbol(
  'nuxt-field-strategy-size',
)
const names = {
  UiField: 'formField',
  UiTextInput: 'input',
  UiInputFrame: 'input',
  UiPreviewRegion: 'input',
  UiDateInput: 'inputDate',
  UiDateTimeInput: 'inputDate',
  UiTimeInput: 'inputTime',
  UiSelect: 'select',
  UiMultiSelect: 'select',
  UiCheckbox: 'checkbox',
  UiSwitch: 'switch',
  UiRadioGroup: 'radioGroup',
  UiSegmentedSelect: 'radioGroup',
  UiButton: 'button',
  UiUploadRegion: 'fileUpload',
} as const
export function useControlSize(component: keyof typeof names) {
  const strategySized = inject(
    strategySizeKey,
    computed(() => false),
  )
  const nativeSize = inject(
    fieldSizeKey,
    computed(() => undefined),
  )
  const defaults = useComponentProps(names[component], {
    size: undefined as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined,
  })
  const result = useUiStrategy(uiControlSizeQuery, [-2, -1, 0, 1, 2])
  if (component === 'UiField')
    provide(
      strategySizeKey,
      computed(() => result.value.status === 'answered' || strategySized.value),
    )
  return computed(() =>
    result.value.status === 'answered'
      ? ({ '-2': 'xs', '-1': 'sm', '0': 'md', '1': 'lg', '2': 'xl' } as const)[
          result.value.value
        ]
      : strategySized.value
        ? (defaults.size ?? 'md')
        : (defaults.size ?? nativeSize.value),
  )
}
