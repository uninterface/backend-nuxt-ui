import {
  browserFieldFeedbackParts,
  type UiTestAdapter,
} from '@uninterface/testing/playwright'
import {
  fieldSelectors,
  temporalPickerParts,
  entryIconColumn,
} from './presentation-parts.mjs'

export const presentationParts = {
  fieldFeedback: (editor) =>
    browserFieldFeedbackParts(editor, fieldSelectors.invalid),
  tableBody(table) {
    const scope = table.locator('xpath=ancestor-or-self::*[@data-scroll][1]')
    return {
      body: table.locator('tbody'),
      scrollSurface: table.locator(
        'xpath=ancestor-or-self::*[@data-scroll and @role="region"][1]',
      ),
      emptyState: scope.locator('.nuxt-empty'),
      errorState: scope.locator('[data-collection-failure="initial"]'),
    }
  },
  feedbackItem(item) {
    return {
      content: item.locator(
        '.nuxt-notification-content,[data-ui-managed-feedback][tabindex="0"]',
      ),
      surface: item.locator('[data-ui-managed-feedback]'),
    }
  },
  progressBar(bar) {
    return {
      track: bar.locator('[data-slot="base"]'),
      fill: bar.locator('[data-slot="indicator"]'),
    }
  },
  async uploadRegion(region) {
    const surface = region
    const chooser = region.locator('[data-upload-choose]')
    return {
      surface,
      chooser,
      chooserFocus:
        (await region.getAttribute('data-upload-recovery')) !== null
          ? { target: chooser, kind: 'outline' }
          : { target: surface, kind: 'outline' },
    }
  },
  temporalPicker: (picker) =>
    temporalPickerParts((selector) => picker.locator(selector)),
  menuEntryIcon(entry) {
    const column = entry.locator(
      `:is(${entryIconColumn}):not(:scope [data-entry-key] *)`,
    )
    return {
      column,
      icon: column.locator(':scope > *'),
    }
  },
} satisfies Partial<UiTestAdapter>
