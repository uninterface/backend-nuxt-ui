import type { UiLayoutPresentation } from '@uninterface/uninterface/backend'

export const uiLayoutPresentation: UiLayoutPresentation = {
  scrollFocus: { class: 'nuxt-scroll-focus' },
  peerSpacing: {
    gap: 'calc(var(--spacing) * 6)',
  },
  peerSpacingLevels: {
    [-1]: { gap: 'calc(var(--spacing) * 2)' },
    1: { gap: 'calc(var(--spacing) * 8)' },
  },
}
