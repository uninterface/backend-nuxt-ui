<script setup lang="ts">
  import FilterButton from './TableFilterButton.vue'
  import AddRow from './TableAddRow.vue'
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  defineOptions({ inheritAttrs: false })
  import { useUiLoadingSurface } from '@uninterface/uninterface/backend'
  import Empty from './UiEmpty.vue'
  import LoadingRegion from './UiLoadingRegion.vue'
  import {
    computed,
    h,
    onMounted,
    onUpdated,
    watchPostEffect,
    ref,
    useSlots,
  } from 'vue'
  import SortIcon from './icons/sort.vue'
  import SortAscendingIcon from './icons/sort-ascending.vue'
  import SortDescendingIcon from './icons/sort-descending.vue'
  import UTable from '@nuxt/ui/components/Table.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
  import type { TableColumn } from '@nuxt/ui/components/Table.vue'
  import {
    useUiCollectionView,
    useUiTableSizing,
    useUiTableAddRow,
    type UiTableViewProps,
    type UiCollectionRow,
  } from '@uninterface/uninterface/backend'
  import Status from './CollectionStatus.vue'
  const props = defineProps<UiTableViewProps>()
  const slots = useSlots()
  const { root, target, sentinel, rowRef, id, failure } =
    useUiCollectionView(props)
  const sizing = useUiTableSizing(props, root, id, { minimumHeader: true })
  const addGeometry = useUiTableAddRow({
    enabled: () => Boolean(props.addRow),
    bounded: () => props.height === 'full',
    host: () => root.value,
    summary: () =>
      target.value?.querySelector<HTMLElement>('[data-collection-summary]'),
    header: () => target.value?.querySelector<HTMLElement>('thead'),
    row: () =>
      target.value?.querySelector<HTMLElement>(
        'tbody tr:not([data-collection-add-track])',
      ),
  })
  const addTracks = computed(() => [
    ...(props.selection === 'none' ? [] : [sizing.selectionWidth.value]),
    ...props.columns.map((column) => sizing.width(column.key)),
  ])
  const addKeys = computed(() => [
    ...(props.selection === 'none' ? [] : ['selection']),
    ...props.columns.map((column) => column.key),
  ])
  const native = ref<{ tableRef?: HTMLTableElement }>()
  const rowId = (row: UiCollectionRow) => `${typeof row.key}:${row.key}`
  const definitions = new Map<string, TableColumn<UiCollectionRow>>()
  const selectionColumn: TableColumn<UiCollectionRow> = {
    id: 'selection',
    meta: {
      style: {
        th: () => ({ width: `${sizing.selectionWidth.value}px` }),
        td: () => ({ width: `${sizing.selectionWidth.value}px` }),
      },
    },
    header: () =>
      props.selection === 'multiple'
        ? h(UCheckbox, {
            'aria-label': props.selectPageLabel,
            modelValue: props.pageMixed ? 'indeterminate' : props.pageSelected,
            disabled: !props.canSelectPage,
            'onUpdate:modelValue': (value: unknown) =>
              props.selectPage(value === true),
          })
        : props.selectPageLabel,
    cell: ({ row }) =>
      h(UCheckbox, {
        'aria-label': row.original.selectLabel,
        modelValue: row.original.context.selected,
        disabled: !row.original.context.selectable,
        'onUpdate:modelValue': (value: unknown) =>
          row.original.context.requestSelected(value === true),
      }),
  }
  const columns = computed<TableColumn<UiCollectionRow>[]>(() => [
    ...(props.selection === 'none' ? [] : [selectionColumn]),
    ...props.columns.map(({ key }) => {
      let definition = definitions.get(key)
      if (!definition) {
        definition = {
          id: `column:${key}`,
          enableSorting: false,
          enableColumnFilter: false,
          meta: {
            style: {
              th: () => sizing.cellStyle(key),
              td: () => sizing.cellStyle(key),
            },
          },
          header: () => {
            const index = props.columns.findIndex(
              (column) => column.key === key,
            )
            const column = props.columns[index]
            if (!column) return null
            return h(
              'div',
              {
                ref: sizing.contentRef(key),
                class: 'nuxt-table-header',
                style: { ...sizing.contentStyle(key), display: 'inline-flex' },
              },
              [
                column.sortable
                  ? h(
                      UButton,
                      {
                        type: 'button',
                        variant: 'ghost',
                        class: 'nuxt-table-sort',
                        color: 'neutral',
                        disabled: props.disabled,
                        'aria-describedby': column.sortDescription
                          ? `${id}-sort-${index}`
                          : undefined,
                        onClick: () => column.requestSort(),
                      },
                      {
                        default: () => [
                          slots.label?.({ column }),
                          h(
                            column.sort === 'ascending'
                              ? SortAscendingIcon
                              : column.sort === 'descending'
                                ? SortDescendingIcon
                                : SortIcon,
                            {
                              'aria-hidden': 'true',
                              class: 'nuxt-table-sort-icon',
                            },
                          ),
                          props.showSortPriority && column.sort
                            ? h(
                                'span',
                                {
                                  class: 'nuxt-table-sort-priority',
                                  'data-ui-sort-priority': '',
                                  'aria-hidden': 'true',
                                },
                                String(column.sortPriority),
                              )
                            : null,
                        ],
                      },
                    )
                  : slots.label?.({ column }),
                props.showSortPriority && column.sort
                  ? h(
                      'span',
                      {
                        onClick: (event: Event) => event.stopPropagation(),
                        onKeydown: (event: Event) => event.stopPropagation(),
                      },
                      slots['sort-actions']?.({ column }),
                    )
                  : null,
                column.sortDescription
                  ? h(
                      'span',
                      {
                        id: `${id}-sort-${index}`,
                        class: 'nuxt-collection-announcement',
                      },
                      column.sortDescription,
                    )
                  : null,
                column.filter
                  ? slots.filter?.({ column, trigger: FilterButton })
                  : null,
                sizing.handle(key)
                  ? h('span', {
                      ...sizing.handle(key),
                      class: 'nuxt-column-resizer',
                    })
                  : null,
              ],
            )
          },
          cell: ({ row }) => {
            const column = props.columns.find((column) => column.key === key)
            return column
              ? h(
                  'div',
                  {
                    ref: sizing.contentRef(key, row.original.key),
                    class: 'nuxt-table-cell-content',
                    style: sizing.contentStyle(key),
                  },
                  [
                    slots.cell?.({ row: row.original, column }),
                    row.original.issue &&
                    column.key === props.columns[props.columns.length - 1]?.key
                      ? h('p', row.original.issue)
                      : null,
                  ],
                )
              : null
          },
        }
        definitions.set(key, definition)
      }
      if (props.dataSummary)
        definition.footer = () =>
          h(
            'div',
            {
              ref:
                key === props.columns[0]?.key &&
                (props.dataSummary?.labelColumnSpan ?? 1) > 1
                  ? undefined
                  : sizing.summaryRef(key),
              style:
                key === props.columns[0]?.key &&
                (props.dataSummary?.labelColumnSpan ?? 1) > 1
                  ? { minWidth: '0' }
                  : sizing.contentStyle(key),
            },
            slots['summary-cell']?.({
              column: props.columns.find((column) => column.key === key),
            }),
          )
      else delete definition.footer
      return definition
    }),
  ])
  function sync() {
    const table = native.value?.tableRef
    target.value = table
    if (!table) return
    const footer = table.querySelector('tfoot')
    if (footer && props.dataSummary) {
      footer.setAttribute('data-collection-summary', '')
      footer.setAttribute('data-summary-status', props.dataSummary.status)
      footer.setAttribute('aria-label', props.dataSummary.label)
      ;[...footer.querySelectorAll('tr[data-slot="tr"] > th')]
        .slice(props.selection === 'none' ? 0 : 1)
        .forEach((cell, index) => {
          const column = props.columns[index]
          if (column) {
            const span = props.dataSummary?.labelColumnSpan ?? 1
            ;(cell as HTMLTableCellElement).colSpan = index === 0 ? span : 1
            ;(cell as HTMLElement).hidden = index > 0 && index < span
            cell.setAttribute(
              'headers',
              (index === 0 ? props.columns.slice(0, span) : [column])
                .map((column) => sizing.columnId(column.key))
                .join(' '),
            )
            if (index === 0) {
              ;(cell as HTMLElement).style.width =
                span > 1 ? '' : sizing.cellStyle(column.key).width
              ;(cell as HTMLElement).style.textAlign =
                span > 1 ? 'start' : (column.align ?? '')
            }
          }
        })
    }
    table.setAttribute('aria-label', props.label)
    table.setAttribute('aria-busy', String(props.busy))
    table.tabIndex = -1
    Object.assign(table.style, sizing.tableStyle.value)
    const headers = [...table.querySelectorAll('thead th')].slice(
      props.selection === 'none' ? 0 : 1,
    )
    headers.forEach((header, index) => {
      const column = props.columns[index]
      if (column) header.id = sizing.columnId(column.key)
      if (column?.primary && column.sort)
        header.setAttribute('aria-sort', column.sort)
      else header.removeAttribute('aria-sort')
    })
    const elements = [...table.querySelectorAll('tbody tr[data-slot="tr"]')]
    props.rows.forEach((row, index) => rowRef(row.key, elements[index] ?? null))
  }
  watchPostEffect(sync)
  onMounted(sync)
  onUpdated(sync)
  const loadingSurface = {
    ...useUiLoadingSurface(() => root.value),
    // Keep header filter anchors available while a live query refreshes rows.
    interactionTarget: computed(
      () => target.value?.querySelector<HTMLElement>('tbody') ?? root.value,
    ),
  }
</script>
<template>
  <div
    class="nuxt-collection-frame"
    :data-collection-full="height === 'full' || undefined"
  >
    <div
      v-if="failed && failurePlacement === 'replacement' && !loading"
      ref="failure"
      class="nuxt-collection-failure"
      data-collection-failure="replacement"
    >
      <slot
        name="error"
        :placement="failurePlacement!"
        :error="error"
        :retry="retry"
        :can-retry="canRetry"
      />
    </div>
    <div
      ref="root"
      v-bind="$attrs"
      class="nuxt-collection"
      :data-full="height === 'full' || undefined"
      :data-loading-empty="(loading && rows.length === 0) || undefined"
      :data-scroll="scroll"
      :data-column-fit="sizing.fits.value"
      :data-add-row-compact="addGeometry.compact.value || undefined"
      :role="scroll !== 'none' ? 'region' : undefined"
      :aria-label="scroll !== 'none' ? label : undefined"
      :tabindex="scroll !== 'none' ? 0 : undefined"
    >
      <!-- UTable has fragment roots; directives must attach to a real element.
           Keep the native table mounted to preserve unfinished cell drafts. -->
      <div v-show="sizing.fits.value">
        <UTable
          ref="native"
          class="nuxt-table"
          :caption="label"
          :sticky="height === 'full' ? (dataSummary ? true : 'header') : false"
          :ui="{
            caption: 'sr-only',
            ...(dataSummary ? { tfoot: 'bg-default' } : {}),
          }"
          :data="[...rows]"
          :columns="columns"
          :get-row-id="rowId"
          :get-sub-rows="() => undefined"
          :sorting-options="{ manualSorting: true }"
          :column-filters-options="{ manualFiltering: true }"
          :pagination-options="{ manualPagination: true }"
          :expanded-options="{ manualExpanding: true }"
          :auto-reset-all="false"
          :watch-options="{ deep: false }"
        >
          <template #body-bottom>
            <tr
              v-if="infinite"
              data-collection-continuation
            >
              <td :colspan="Math.max(1, columns.length)">
                <div
                  v-if="failed && failurePlacement === 'append' && !loading"
                  ref="failure"
                  class="nuxt-collection-failure"
                  data-collection-failure="append"
                >
                  <slot
                    name="error"
                    :placement="failurePlacement!"
                    :error="error"
                    :retry="retry"
                    :can-retry="canRetry"
                  />
                </div>
                <div
                  ref="sentinel"
                  aria-hidden="true"
                  class="nuxt-collection-sentinel"
                />
                <Status
                  v-bind="props"
                  suppress-announcement
                  empty-in-body
                >
                  <template
                    v-if="$slots['infinity-loading']"
                    #infinity-loading="values"
                  >
                    <slot
                      name="infinity-loading"
                      v-bind="values"
                    />
                  </template>
                  <template
                    v-if="$slots['infinity-complete']"
                    #infinity-complete="values"
                  >
                    <slot
                      name="infinity-complete"
                      v-bind="values"
                    />
                  </template>
                </Status>
              </td>
            </tr>
            <tr
              v-if="addRow"
              data-collection-add-track
              class="nuxt-table-add-track"
            >
              <td
                :colspan="
                  Math.max(1, columns.length + (selection === 'none' ? 0 : 1))
                "
              >
                <AddRow
                  :tracks="addTracks"
                  :keys="addKeys"
                  :viewport="addGeometry.viewportWidth.value"
                >
                  <slot name="add-row-action" />
                </AddRow>
              </td>
            </tr>
          </template>
          <template #empty>
            <div
              v-if="failed && failurePlacement === 'initial' && !loading"
              ref="failure"
              class="nuxt-collection-failure"
              data-collection-failure="initial"
            >
              <slot
                name="error"
                :placement="failurePlacement!"
                :error="error"
                :retry="retry"
                :can-retry="canRetry"
              />
            </div>
            <slot
              v-if="empty"
              name="empty"
            >
              <Empty :label="message" />
            </slot>
            <span v-else />
          </template>
        </UTable>
      </div>
      <p
        v-if="!sizing.fits.value"
        role="status"
      >
        {{ sizeConstraintLabel }}
      </p>
      <div
        v-if="!infinite && failed && failurePlacement === 'append' && !loading"
        ref="failure"
        class="nuxt-collection-failure"
        data-collection-failure="append"
      >
        <slot
          name="error"
          :placement="failurePlacement!"
          :error="error"
          :retry="retry"
          :can-retry="canRetry"
        />
      </div>
      <Status
        v-if="!infinite"
        v-bind="props"
        empty-in-body
      >
        <template
          v-if="$slots['infinity-loading']"
          #infinity-loading="values"
        >
          <slot
            name="infinity-loading"
            v-bind="values"
          />
        </template>
        <template
          v-if="$slots['infinity-complete']"
          #infinity-complete="values"
        >
          <slot
            name="infinity-complete"
            v-bind="values"
          />
        </template>
      </Status>
      <div
        v-else
        class="nuxt-collection-status"
      >
        <span
          class="nuxt-collection-announcement"
          data-ui-loading-status
          role="status"
          aria-atomic="true"
        >
          {{ announcement }}
        </span>
      </div>
    </div>
    <div
      v-if="$slots.footer"
      class="nuxt-table-footer"
    >
      <slot name="footer" />
    </div>
  </div>
  <LoadingRegion
    :surface="loadingSurface"
    :loading="loading"
    :label="message"
    :announce="false"
    :manage-busy="false"
  />
</template>
