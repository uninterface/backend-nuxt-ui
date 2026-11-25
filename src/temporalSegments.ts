import { watch, onScopeDispose } from 'vue'
import {
  injectDateFieldRootContext,
  injectTimeFieldRootContext,
  injectDateRangeFieldRootContext,
  injectTimeRangeFieldRootContext,
} from 'reka-ui'
import type {
  UiTemporalKind,
  UiTemporalPrecision,
} from '@uninterface/uninterface'
export interface TemporalSegmentProps {
  kind: UiTemporalKind
  precision: UiTemporalPrecision
  range?: boolean
  initial: string | { start: string; end: string }
  update(value: any): void
}
/** Native context remains backend-local. The slot host only establishes injection ancestry. */
export function useTemporalSegments(props: TemporalSegmentProps) {
  const context = props.range
    ? props.kind === 'time'
      ? injectTimeRangeFieldRootContext()
      : injectDateRangeFieldRootContext()
    : props.kind === 'time'
      ? injectTimeFieldRootContext()
      : injectDateFieldRootContext()
  const refs = props.range
    ? (
        context as NonNullable<
          ReturnType<typeof injectDateRangeFieldRootContext>
        >
      ).segmentValues
    : {
        start: (
          context as NonNullable<ReturnType<typeof injectDateFieldRootContext>>
        ).segmentValues,
      }
  if (props.kind !== 'time') {
    // Reka's part() requests numeric month/day even when toParts() requests
    // two digits. Patch only this field instance; calendar formatters are separate.
    const formatter = context.formatter
    const original = formatter.part
    const padded: typeof original = (date, part, options) => {
      const value = original(date, part, options)
      return /^(year|month|day)$/.test(part) && /^\d+$/.test(value)
        ? value.padStart(part === 'year' ? 4 : 2, '0')
        : value
    }
    formatter.part = padded
    onScopeDispose(() => {
      if (formatter.part === padded) formatter.part = original
    })
    // Invalidate the already-read native segment content once so initial values
    // use padding too. This precedes our draft observer and changes no values.
    for (const target of Object.values(refs)) target.value = { ...target.value }
  }
  function resetOne(target: typeof refs.start, value: string) {
    const [date, clock] = props.kind === 'time' ? ['', value] : value.split('T')
    const numeric = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : null)
    const values: Record<string, number | string | null> = {}
    if (props.kind !== 'time')
      ['year', 'month', 'day'].forEach((part, i) => {
        values[part] = numeric((date ?? '').split('-')[i])
      })
    if (props.kind !== 'date') {
      ;[
        'hour',
        'minute',
        ...(props.precision === 'second' ? ['second'] : []),
      ].forEach((part, i) => {
        values[part] = numeric((clock ?? '').split(':')[i])
      })
      values.dayPeriod = Number(values.hour) >= 12 ? 'PM' : 'AM'
    }
    target.value = { ...target.value, ...values }
  }
  function reset(value: TemporalSegmentProps['initial']) {
    if (typeof value === 'string') resetOne(refs.start, value)
    else {
      resetOne(refs.start, value.start)
      if ('end' in refs) resetOne(refs.end, value.end)
    }
  }
  function raw(target: typeof refs.start) {
    const values = target.value as unknown as Record<
      string,
      number | string | null
    >
    const parts =
      props.kind === 'time' ? ['hour', 'minute'] : ['year', 'month', 'day']
    if (props.kind === 'datetime') parts.push('hour', 'minute')
    if (props.kind !== 'date' && props.precision === 'second')
      parts.push('second')
    if (parts.every((part) => values[part] == null)) return ''
    const part = (name: string) =>
      values[name] == null
        ? '_'.repeat(name === 'year' ? 4 : 2)
        : String(values[name]).padStart(name === 'year' ? 4 : 2, '0')
    const date = ['year', 'month', 'day'].map(part).join('-')
    const time = [
      'hour',
      'minute',
      ...(props.precision === 'second' ? ['second'] : []),
    ]
      .map(part)
      .join(':')
    return props.kind === 'date'
      ? date
      : props.kind === 'time'
        ? time
        : date + 'T' + time
  }
  if (
    JSON.stringify(props.initial).includes('_') ||
    (typeof props.initial === 'string' && props.initial.endsWith('T'))
  )
    reset(props.initial)
  watch(
    () => Object.values(refs).map((v) => v.value),
    () => {
      if (context.disabled.value || context.readonly.value) return
      props.update(
        'end' in refs
          ? { start: raw(refs.start), end: raw(refs.end) }
          : raw(refs.start),
      )
    },
    { deep: true, flush: 'sync' },
  )
  return { reset }
}
