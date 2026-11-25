import { h, nextTick, ref } from 'vue'
import { createUiApplication } from '@uninterface/uninterface/setup'
import {
  createUiEntryControl,
  createUiFieldControl,
  UiField,
  UiSelect,
  type UiEntry,
} from '@uninterface/uninterface'
export async function mountAsyncChoice() {
  let entries: readonly UiEntry[] = [
    {
      kind: 'group',
      key: 'contacts',
      label: 'Contacts',
      entries: [
        { key: 'saved', label: 'Saved contact' },
        { key: 'other', label: 'Other contact' },
        { key: '', label: 'Unavailable empty choice', disabled: true },
      ],
    },
  ]
  let finish!: () => void
  let initial = true
  let failNext = false
  const control = createUiEntryControl(async () => {
    if (initial)
      await new Promise<void>((resolve) => {
        finish = resolve
      })
    if (failNext) {
      failNext = false
      throw new Error('Source unavailable')
    }
    return entries
  })
  const field = createUiFieldControl('saved')
  const select = ref<InstanceType<typeof UiSelect>>()
  // Composite widgets may create their native named participant only inside a form.
  const host = document.createElement('form')
  document.body.append(host)
  const errors: string[] = []
  const app = createUiApplication({
    render: () =>
      h(
        UiField,
        { field, label: 'Contact' },
        {
          default: () =>
            h(UiSelect, {
              ref: select,
              control,
              name: 'contact',
            }),
        },
      ),
  })
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  app.mount(host)
  await nextTick()
  return {
    host,
    field,
    // Exercise the backend-to-core event boundary even for ineligible values
    // that real widgets correctly prevent users from selecting.
    reportCandidate: async (value: string) => {
      await select.value!.$.subTree.props!.onUpdate(value)
      await nextTick()
    },
    errors,
    tick: nextTick,
    finish: async () => {
      initial = false
      finish()
      await control.load()
      await nextTick()
    },
    fail: async () => {
      failNext = true
      await control.refresh()
      await nextTick()
    },
    reload: async () => {
      await control.refresh()
      await nextTick()
    },
    empty: async () => {
      entries = []
      await control.refresh()
      await nextTick()
    },
    dispose: () => {
      app.unmount()
      control.dispose()
      host.remove()
    },
  }
}

import { UiMenu } from '@uninterface/uninterface'
export async function mountMenuHost(simple = false) {
  const mode = ref<'inline' | 'popup'>('popup')
  let entries: readonly UiEntry[] = simple
    ? [
        { key: 'first', label: 'First command' },
        { key: 'disabled', label: 'Disabled command', disabled: true },
        { kind: 'separator', key: 'separator' },
        { key: 'last', label: 'Last command' },
      ]
    : [
        { key: 'one', label: 'First command' },
        {
          kind: 'submenu',
          key: 'a',
          label: 'Branch A',
          children: [{ key: 'a1', label: 'A command' }],
        },
        {
          kind: 'submenu',
          key: 'b',
          label: 'Branch B',
          children: [{ key: 'b1', label: 'B command' }],
        },
      ]
  const control = createUiEntryControl(async () => entries)
  await control.load()
  const host = document.createElement('div')
  document.body.append(host)
  const errors: string[] = []
  const activated: string[] = []
  const app = createUiApplication({
    render: () =>
      h(
        UiMenu,
        {
          control,
          mode: mode.value,
          'aria-label': 'Host commands',
          onActivate: (key: string) => activated.push(key),
        },
        mode.value === 'popup'
          ? {
              host: ({
                buttonTrigger,
                contextTrigger,
              }: import('@uninterface/uninterface').UiMenuHostBindings) => [
                h(
                  'button',
                  {
                    ...buttonTrigger,
                    type: 'button',
                    'data-test': 'custom-host',
                  },
                  'My host button',
                ),
                h(
                  'article',
                  { ...contextTrigger, 'data-test': 'custom-context' },
                  'My record',
                ),
              ],
            }
          : {},
      ),
  })
  app.config.errorHandler = (error) => errors.push(String(error))
  await app.ui.ready
  app.mount(host)
  await nextTick()
  return {
    host,
    mode,
    errors,
    activated,
    async refresh(next: readonly UiEntry[]) {
      entries = next
      await control.refresh()
      await nextTick()
    },
    tick: nextTick,
    dispose() {
      app.unmount()
      control.dispose()
      host.remove()
    },
  }
}
