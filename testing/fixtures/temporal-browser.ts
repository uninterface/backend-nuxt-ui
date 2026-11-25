import '@uninterface/backend/font.css'
import '@uninterface/backend/style.css'
import '@uninterface/uninterface/style.css'
import { h, nextTick } from 'vue'
import {
  UiField,
  UiDateInput,
  UiTimeInput,
  UiDateTimeInput,
  UiTextInput,
  createUiDateControl,
  createUiTimeControl,
  createUiDateTimeControl,
  createUiFieldControl,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

async function mountTemporalPresentation() {
  const date = createUiDateControl(
    { start: '2026-10-21', end: '2026-10-23' },
    {
      range: true,
      allowOpenStart: true,
      allowOpenEnd: true,
      allowUnrestricted: true,
    },
  )
  const time = createUiTimeControl(
    { start: '22:00', end: '26:00' },
    {
      range: true,
      allowOpenStart: true,
      allowOpenEnd: true,
      allowUnrestricted: true,
    },
  )
  const datetime = createUiDateTimeControl(
    { start: '2026-10-21T09:00', end: '2026-10-23T17:00' },
    {
      range: true,
      allowOpenStart: true,
      allowOpenEnd: true,
      allowUnrestricted: true,
    },
  )
  const password = createUiFieldControl('secret')
  const host = document.createElement('div')
  host.style.maxWidth = '52rem'
  document.body.append(host)
  const app = createUiApplication({
    render: () =>
      h('main', [
        h('section', { 'data-range': 'date' }, [
          h(
            UiField,
            { field: date.field, label: 'Date range', group: true },
            () =>
              h(UiDateInput, {
                binding: date.bindings.dateInput,
              }),
          ),
        ]),
        h('section', { 'data-range': 'time' }, [
          h(
            UiField,
            { field: time.field, label: 'Time range', group: true },
            () =>
              h(UiTimeInput, {
                binding: time.bindings.timeInput,
              }),
          ),
        ]),
        h('section', { 'data-range': 'datetime' }, [
          h(
            UiField,
            { field: datetime.field, label: 'Datetime range', group: true },
            () =>
              h(UiDateTimeInput, {
                binding: datetime.bindings.dateTimeInput,
              }),
          ),
        ]),
        h(UiField, { field: password, label: 'Password' }, () =>
          h(UiTextInput, { type: 'password', passwordReveal: true }),
        ),
      ]),
  })
  await app.ui.ready
  app.mount(host)
  await nextTick()
}

void mountTemporalPresentation()
