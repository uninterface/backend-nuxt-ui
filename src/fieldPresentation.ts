import {
  computed,
  inject,
  onScopeDispose,
  onMounted,
  ref,
  type ComputedRef,
  type InjectionKey,
} from 'vue'
import { useUiFieldStrategyContext } from '@uninterface/uninterface/backend'
import type { UiFieldViewBinding } from '@uninterface/uninterface/backend'

export const fieldPresentationKey: InjectionKey<{
  binding: ComputedRef<UiFieldViewBinding | undefined>
  registerCheckbox(): () => void
  feedback: ComputedRef<{
    help?: string | null
    issue?: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>
}> = Symbol('nuxt-field-presentation')
export const fieldSizeKey: InjectionKey<
  ComputedRef<'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined>
> = Symbol('nuxt-field-size')

// Preserve native presentation defaults while isolating the toolkit's generated
// ARIA descriptions, which include hidden help and replace caller associations.
export function useFieldPresentation(checkbox = false) {
  const policy = useUiFieldStrategyContext()
  const parent = inject(fieldPresentationKey, undefined)
  let release: (() => void) | undefined
  const registered = ref(false)
  onMounted(() => {
    if (checkbox && parent?.binding.value) {
      release = parent.registerCheckbox()
      registered.value = true
    }
  })
  onScopeDispose(() => release?.())
  const field = computed(() => {
    const binding = parent?.binding.value
    if (
      !checkbox ||
      !registered.value ||
      (policy && policy.value.labels !== 'adjacent') ||
      !binding
    )
      return undefined
    return {
      ...binding,
      label: binding.label,
      markerPosition: policy?.value.markerPosition ?? 'suffix',
      requiredLabel:
        !policy || policy.value.marker === 'required'
          ? binding.requiredLabel
          : undefined,
    }
  })
  return {
    field,
    feedback: computed(() =>
      field.value ? parent?.feedback.value : undefined,
    ),
  }
}
