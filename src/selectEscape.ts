import type { Ref } from 'vue'
import type { SelectProps } from '@nuxt/ui/components/Select.vue'

export function selectEscape(opened: Ref<boolean>) {
  function dismiss(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented || !opened.value)
      return
    event.preventDefault()
    event.stopPropagation()
    if (!event.repeat) opened.value = false
  }
  // Reka forwards content attributes to the popup, including when teleported.
  const escapeContent: NonNullable<SelectProps['content']> & {
    onKeydownCapture: typeof dismiss
  } = { onKeydownCapture: dismiss }
  return { dismiss, escapeContent }
}
