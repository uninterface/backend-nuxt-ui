import { computed } from 'vue'
import { useComponentProps } from '@nuxt/ui/composables/useComponentProps'
import { tv } from '@nuxt/ui/utils/tv'
import { useAppConfig } from '#imports'
import theme from '#build/ui/form-field'

type FieldSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type FieldSlots = Record<string, (options?: Record<string, unknown>) => string>

/** Reuse native FormField slots when the requested feedback cannot use its slots. */
export function useFieldTheme(size: () => FieldSize | undefined) {
  const config = useAppConfig()
  const defaults = useComponentProps('formField', {
    ui: undefined as Record<string, string> | undefined,
  })
  return computed(() => {
    // Vite generates the native theme module; retain its native size variant
    // contract at this boundary instead of duplicating its classes or tokens.
    const resolve = tv({
      extend: theme,
      ...config.ui?.formField,
    }) as unknown as (variants: {
      size?: FieldSize
      orientation?: 'vertical'
    }) => FieldSlots
    const slots = resolve({ size: size(), orientation: 'vertical' })
    return Object.fromEntries(
      Object.entries(slots).map(([name, render]) => [
        name,
        (options: Record<string, unknown> = {}) =>
          render({ ...options, class: [defaults.ui?.[name], options.class] }),
      ]),
    ) as FieldSlots
  })
}
