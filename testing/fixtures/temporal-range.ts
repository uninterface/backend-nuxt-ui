import { h, nextTick, ref } from 'vue'
import {
  UiDateInput,
  UiDateTimeInput,
  UiField,
  UiTimeInput,
  createUiDateControl,
  createUiDateTimeControl,
  createUiTimeControl,
  type UiTemporalPresentation,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountTemporalRanges() {
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
  const datetimePresentation = ref<UiTemporalPresentation>()
  const errors: string[] = []
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
                presentation: datetimePresentation.value,
              }),
          ),
        ]),
      ]),
  })
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  const host = document.body.appendChild(document.createElement('div'))
  app.mount(host)
  async function tick() {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()
  }
  await tick()
  return {
    host,
    date,
    time,
    datetime,
    errors,
    tick,
    async setDatetimePresentation(value: UiTemporalPresentation) {
      datetimePresentation.value = value
      await tick()
    },
    dispose() {
      app.unmount()
      date.dispose()
      time.dispose()
      datetime.dispose()
      host.remove()
    },
  }
}
