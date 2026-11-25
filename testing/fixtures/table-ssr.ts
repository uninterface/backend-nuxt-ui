import { defineComponent, h, nextTick, ref, useId, type Component } from 'vue'
import {
  createUiListControl,
  UiTable,
  UiTableColumn,
  UiCollectionView,
  UiCollectionField,
  UiButton,
  type UiListSlotProps,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'
import '@uninterface/backend/style.css'

export interface TableSsrRequest {
  entry: 'table' | 'collection'
  empty: boolean
  idPrefix: string
  height?: 'content' | 'full'
}
interface Row {
  id: string
  name: string
}

export async function createTableRequest(request: TableSsrRequest) {
  let reads = 0
  let actions = 0
  const errors: string[] = []
  const drafts = new Map<string, string>()
  const label = ref('SSR records')
  const height = ref(request.height ?? 'content')
  const control = createUiListControl<Row, Record<string, never>, 'name'>({
    itemKey: (item) => item.id,
    query: { filters: {}, sort: [] },
    sorting: { mode: 'single', keys: ['name'] },
    selection: 'multiple',
    source(query) {
      reads++
      const rows = request.empty
        ? []
        : [
            { id: 'one', name: 'Alpha' },
            { id: 'two', name: 'Beta' },
          ]
      if (query.sort[0]?.direction === 'desc') rows.reverse()
      return { items: rows, complete: true }
    },
    activate() {
      actions++
    },
  })
  // Both server and browser receive the same owner-loaded initial snapshot.
  // Hydration must not cause any additional source request.
  await control.refresh()
  const Draft = defineComponent({
    props: { row: { type: Object as () => Row, required: true } },
    setup(props) {
      const value = ref(`Draft ${props.row.name}`)
      const id = useId()
      return () =>
        h('input', {
          id,
          'data-ssr-draft': props.row.id,
          'aria-label': `Draft ${props.row.name}`,
          value: value.value,
          onInput(event: Event) {
            value.value = (event.target as HTMLInputElement).value
            drafts.set(props.row.id, value.value)
          },
        })
    },
  })
  const declaration = (key: 'name' | 'draft' | 'action') =>
    h(
      (request.entry === 'table'
        ? UiTableColumn
        : UiCollectionField) as Component,
      {
        key,
        ...(request.entry === 'table' ? { columnKey: key } : { fieldKey: key }),
        label: { name: 'Name', draft: 'Draft', action: 'Action' }[key],
        spring: key === 'name',
        preferredWidth: key === 'name' ? 240 : 180,
        minWidth: 100,
        ...(key === 'name' ? { sortBy: 'name' } : {}),
      },
      {
        default: ({ item, context }: UiListSlotProps<Row>) =>
          key === 'name'
            ? h('span', { 'data-ssr-name': item.id }, item.name)
            : key === 'draft'
              ? h(Draft, { row: item })
              : h(
                  UiButton,
                  { binding: context.bindings.activateButton },
                  () => `Inspect ${item.name}`,
                ),
        ...(key === 'name'
          ? {
              summary: () =>
                h(
                  'output',
                  { 'data-ssr-total': '' },
                  request.empty ? '0' : '2',
                ),
            }
          : {}),
      },
    )
  // Exercise an ordinary reusable declaration as well as a direct declaration.
  const BusinessColumns = defineComponent({
    setup: () => () => [declaration('draft'), declaration('action')],
  })
  const app = createUiApplication(
    defineComponent({
      setup: () => () =>
        h(
          (request.entry === 'table' ? UiTable : UiCollectionView) as Component,
          {
            binding: control.bindings.list,
            ariaLabel: label.value,
            height: height.value,
            scroll: height.value === 'full' ? 'both' : 'horizontal',
            summaryLabel: 'Record total',
            ...(request.entry === 'collection'
              ? { presentation: 'table' }
              : {}),
          },
          () => [declaration('name'), h(BusinessColumns)],
        ),
    }),
    {
      ssr: true,
      idPrefix: request.idPrefix,
      colorMode: {
        preference: 'light',
        ...(typeof document === 'undefined' ? {} : { document }),
      },
    },
  )
  app.config.warnHandler = (warning) => errors.push(warning)
  app.config.errorHandler = (error) => errors.push(String(error))
  let disposed = false
  function dispose() {
    if (disposed) return
    disposed = true
    control.dispose()
    app.ui.dispose()
  }
  app.onUnmount(dispose)
  await app.ui.ready
  return {
    app,
    errors,
    label,
    height,
    control,
    dispose,
    snapshot: () => ({
      reads,
      actions,
      selected: [...control.state.selectedKeys],
      drafts: Object.fromEntries(drafts),
      disposed: control.state.disposed,
    }),
  }
}

export async function hydrateTable(request: TableSsrRequest) {
  const session = await createTableRequest(request)
  try {
    session.app.mount('#table-host')
    for (let i = 0; i < 10; i++) await nextTick()
    return {
      errors: session.errors,
      snapshot: session.snapshot,
      async rename(label: string) {
        session.label.value = label
        await nextTick()
      },
      async resize(height: 'content' | 'full') {
        session.height.value = height
        for (let i = 0; i < 10; i++) await nextTick()
      },
      unmount: () => session.app.unmount(),
    }
  } catch (error) {
    session.dispose()
    throw error
  }
}
