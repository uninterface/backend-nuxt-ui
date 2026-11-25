import { h, ref, nextTick } from 'vue'
import {
  UiField,
  createUiFormControl,
  UiDateInput,
  UiTimeInput,
  UiDateTimeInput,
  createUiDateControl,
  createUiTimeControl,
  createUiDateTimeControl,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountNativeTemporal() {
  const locale = ref('en-US')
  const disabled = ref(false),
    readonly = ref(false)
  const date = createUiDateControl('2024-02-29', {
    allowed: (value) => value !== '2024-02-16',
  })
  const time = createUiTimeControl('09:30:12', {
    precision: 'second',
  })
  const datetime = createUiDateTimeControl('2024-02-29T09:30:12', {
    precision: 'second',
  })
  const form = createUiFormControl({
    date: date.field,
    time: time.field,
    datetime: datetime.field,
  })
  const errors: string[] = []
  const app = createUiApplication({
    render: () =>
      h('main', [
        h(
          UiField,
          { field: date.field, label: 'Date' },
          {
            default: () =>
              h(UiDateInput, {
                binding: date.bindings.dateInput,
                disabled: disabled.value,
                readonly: readonly.value,
                presentation: { locale: locale.value, hourCycle: 'h12' },
              }),
          },
        ),
        h(
          UiField,
          { field: time.field, label: 'Time' },
          {
            default: () =>
              h(UiTimeInput, {
                binding: time.bindings.timeInput,
                presentation: { locale: locale.value, hourCycle: 'h12' },
                disabled: disabled.value,
                readonly: readonly.value,
              }),
          },
        ),
        h(
          UiField,
          { field: datetime.field, label: 'Date and time' },
          {
            default: () =>
              h(UiDateTimeInput, {
                binding: datetime.bindings.dateTimeInput,
                disabled: disabled.value,
                readonly: readonly.value,
              }),
          },
        ),
      ]),
  })
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  const host = document.createElement('div')
  document.body.append(host)
  app.mount(host)
  async function tick() {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 250))
    await nextTick()
  }
  await tick()
  return {
    host,
    form,
    date,
    time,
    datetime,
    errors,
    tick,
    async setLocale(value: string) {
      locale.value = value
      await tick()
    },
    async setDisabled(value: boolean) {
      disabled.value = value
      await tick()
    },
    async setReadonly(value: boolean) {
      readonly.value = value
      await tick()
    },
    dispose() {
      app.unmount()
      host.remove()
      form.dispose()
      date.dispose()
      time.dispose()
      datetime.dispose()
    },
  }
}
