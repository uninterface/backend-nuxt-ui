import type { BrowserControlParts } from '@uninterface/testing/playwright'

// Map rendered parts without performing interactions.
export const browserControlParts: BrowserControlParts = {
  collapsibleTrigger: (scope, name) =>
    scope.getByRole('button', { name, exact: typeof name === 'string' }),
  temporalMode: (trigger, _value, label) => ({
    kind: 'menu',
    option: trigger
      .page()
      .getByRole('menuitemcheckbox', { name: label, exact: true }),
  }),
  fileInputName: (root) => ({
    kind: 'text',
    control: root.locator('[data-ui-file-name]'),
  }),
  fileInput(root, clearName) {
    const clear = root.getByRole('button', { name: clearName, exact: true })
    const frame = root.locator('.nuxt-input-frame')
    return {
      chooser: root.locator('input[type=file]'),
      frame,
      focusedFrame: frame.and(root.locator('[data-focused]')),
      clear,
      clearFocus: { target: clear, kind: 'outline' },
    }
  },
}
