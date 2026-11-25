import { computed } from 'vue'
import { tv } from '@nuxt/ui/utils/tv'
import { useAppConfig } from '#imports'
import theme from '#build/ui/dropdown-menu'

export function useMenuTheme() {
  const config = useAppConfig()
  return computed(
    () =>
      tv({ extend: theme, ...config.ui?.dropdownMenu })(
        {},
      ) as unknown as Record<
        string,
        (options?: Record<string, unknown>) => string
      >,
  )
}
