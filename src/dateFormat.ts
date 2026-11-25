import { watch, nextTick, type ComputedRef } from 'vue'
// Backend locale mapping for the undocumented common date-format wish.
export type NuxtDateFormat = 'YMD' | 'DMY' | 'MDY'
const locales = { YMD: 'en-CA', DMY: 'en-GB', MDY: 'en-US' } as const
export function dateFormatLocale(format: NuxtDateFormat = 'YMD') {
  if (!Object.hasOwn(locales, format))
    throw new Error('Unsupported Nuxt date format.')
  return locales[format]
}

/** Nuxt keys segments by part/index, so changing locale can replace a focused node. */
export function retainDateFormatFocus(
  locale: ComputedRef<string>,
  root: () => Element | null | undefined,
) {
  let revision = 0
  watch(locale, async () => {
    const current = ++revision
    const field = root()
    const active = field?.ownerDocument.activeElement
    if (
      !active ||
      !field?.contains(active) ||
      !active.hasAttribute('data-segment')
    )
      return
    const part = active.getAttribute('data-segment')
    const side = active.getAttribute('data-reka-date-range-field-segment-type')
    await nextTick()
    if (current !== revision) return
    const next = root()
    const focused = next?.ownerDocument.activeElement
    if (focused && focused !== active && focused !== next?.ownerDocument.body)
      return
    const target = [
      ...(next?.querySelectorAll<HTMLElement>('[role=spinbutton]') ?? []),
    ].find(
      (el) =>
        el.getAttribute('data-segment') === part &&
        el.getAttribute('data-reka-date-range-field-segment-type') === side,
    )
    target?.focus()
  })
}
