export function cardParts(find) {
  return {
    header: find(':scope > .nuxt-card-header'),
    body: find(':scope > .nuxt-card-body'),
    footer: find(':scope > .nuxt-card-footer'),
    topEnd: find(':scope > [data-slot="body"] > .nuxt-card-top-end'),
  }
}

export const fieldSelectors = {
  root: '.nuxt-field-group,.nuxt-strategy-field',
  surface: '.nuxt-input-frame,[data-slot="base"]',
  required: '.nuxt-required',
  invalid: '.nuxt-strategy-field [aria-invalid="true"], [aria-invalid="true"]',
}

export function fieldGroupParts(find) {
  return {
    label: find(
      ':scope > legend, :scope > [data-slot=wrapper] [data-slot=label]',
    ),
    controlArea: find(
      ':scope > .nuxt-strategy-content, :scope > [data-slot=wrapper]',
    ),
  }
}

export function temporalPickerParts(find) {
  return {
    dateInput: find('input[type=date],input[type=datetime-local]'),
    timeInput: find('input[type=time],input[type=datetime-local]'),
    day(isoDate) {
      return find(
        '[data-reka-calendar-cell-trigger][data-value="DATE"]'.replaceAll(
          'DATE',
          isoDate,
        ),
      )
    },
    timeSegment(unit) {
      return find(
        '[data-reka-time-field-segment="UNIT"],[data-segment="UNIT"][role="spinbutton"]'.replaceAll(
          'UNIT',
          unit,
        ),
      )
    },
  }
}

export const entryIconColumn = '.nuxt-entry-icon,.nuxt-navigation-icon'
