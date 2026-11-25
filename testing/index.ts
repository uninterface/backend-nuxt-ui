import {
  uiNativeTestAdapter,
  type UiTestAdapter,
} from '@uninterface/testing/playwright'

/** Toolkit part mapping; browser actions remain in the shared harness. */
import {
  cardParts,
  fieldGroupParts,
  fieldSelectors,
} from './presentation-parts.mjs'
import { presentationParts } from './presentation-mapping'

export const uiTestAdapter: UiTestAdapter = {
  ...presentationParts,
  card: (card) => cardParts((selector) => card.locator(selector)),
  fieldGroup(group) {
    const parts = fieldGroupParts((selector) => group.locator(selector))
    const { label } = parts
    const generated = label
      .and(group.page().locator(fieldSelectors.required))
      .or(label.locator(fieldSelectors.required))
    return {
      ...parts,
      required: {
        elements: label.locator(':not(*)'),
        before: generated,
        after: generated,
      },
    }
  },
  inputFrame: (frame) => ({ surface: frame }),
  buttonFocus: (button) => ({ target: button, kind: 'outline' }),
  checkable: uiNativeTestAdapter.checkable,
  version: 1,
  menuPopup(menu) {
    // Reka positions the outer wrapper. The themed content owns the visible box.
    return menu.and(
      menu
        .page()
        .locator(
          '[data-reka-popper-content-wrapper]:not(.nuxt-menu-inline > *) > [data-slot="content"]',
        ),
    )
  },
  async multiSelect(control) {
    const native = await uiNativeTestAdapter.multiSelect!(control)
    return { ...uiTestAdapter.select(control), clear: native.clear }
  },
  choice(group, key, kind) {
    if (kind === 'checkbox')
      return uiNativeTestAdapter.choice!(group, key, kind)
    const value = Array.from(
      `choice:${encodeURIComponent(key)}`,
      (char) => `\\${char.codePointAt(0)!.toString(16)} `,
    ).join('')
    const control = group
      .getByRole('radio')
      .and(group.locator(`[value="${value}"]`))
    return {
      control,
      target: control.locator(
        'xpath=ancestor::label[1] | self::*[not(ancestor::label)]',
      ),
    }
  },

  navigationEntry(scope, { name, kind }) {
    // NavigationMenu roots and DropdownMenu descendants have different roles.
    const root = scope.getByRole(kind === 'submenu' ? 'button' : 'link', {
      name,
      exact: true,
    })
    const nested = scope
      .getByRole('menuitem', { name, exact: true })
      .and(
        scope.locator(
          kind === 'submenu' ? '[aria-haspopup]' : ':not([aria-haspopup])',
        ),
      )
    return root.or(nested).and(scope.locator('[data-entry-key]'))
  },
  modal(dialog) {
    return {
      body: dialog.locator(':scope > .nuxt-modal-surface > [data-slot="body"]'),
      actions: dialog.locator(
        ':scope > .nuxt-modal-surface > [data-slot="footer"]',
      ),
    }
  },
  columnHeaderParts(header) {
    return {
      caption: header.locator(
        '.nuxt-table-sort, .nuxt-table-header:not(:has(.nuxt-table-sort))',
      ),
      sortTarget: header.locator('.nuxt-table-sort'),
      sortIndicator: header.locator('.nuxt-table-sort-icon'),
    }
  },
  tableHeaderSeparator(table) {
    return {
      elements: table.locator(':scope > thead > tr[data-slot="separator"]'),
      paint: 'box',
    }
  },
  popoverSurface(dialog) {
    return dialog.and(
      dialog.page().locator('[data-ui-overlay="popover"].nuxt-overlay'),
    )
  },
  async field(control) {
    const parts = await uiNativeTestAdapter.field!(control)
    const segments = control.locator(
      '.segmented-scroll > [data-slot="root"] > [data-slot="fieldset"]',
    )
    return {
      ...parts,
      surface: (await segments.count()) ? segments : parts.surface,
    }
  },
  checkbox: (control) => control,
  select(control) {
    return {
      kind: 'composite',
      trigger: control,
      selection: control.locator('[data-slot=value], [data-slot=placeholder]'),
      async popup() {
        const id = await control.getAttribute('aria-controls')
        if (!id || /\s/.test(id))
          throw new Error(
            'UiSelect must identify exactly one owned popup through aria-controls.',
          )
        const owned = control.page().locator(`[id=${JSON.stringify(id)}]`)
        return owned
      },
    }
  },
}

export { browserControlParts } from './browser-control-parts'
