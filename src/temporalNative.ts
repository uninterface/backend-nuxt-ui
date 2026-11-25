import { parseDate, parseDateTime, parseTime } from '@internationalized/date'
import type { UiTemporalEditorViewProps } from '@uninterface/uninterface/backend'

export function nativeTemporalValue(
  props: Pick<UiTemporalEditorViewProps, 'kind' | 'value' | 'precision'>,
) {
  const { kind, value, precision } = props
  if (!value) return null
  const clock =
    precision === 'second' ? '\\d{2}:\\d{2}:\\d{2}' : '\\d{2}:\\d{2}'
  const pattern =
    kind === 'date'
      ? '\\d{4}-\\d{2}-\\d{2}'
      : kind === 'time'
        ? clock
        : '\\d{4}-\\d{2}-\\d{2}T' + clock
  if (!new RegExp('^' + pattern + '$').test(value)) return null
  try {
    const parsed =
      kind === 'date'
        ? parseDate(value)
        : kind === 'time'
          ? parseTime(value)
          : parseDateTime(value)
    return parsed.toString().slice(0, value.length) === value ? parsed : null
  } catch {
    return null
  }
}
export function nativeTemporalSupported(props: UiTemporalEditorViewProps) {
  if (props.kind !== 'date' && props.precision === 'millisecond') return false
  // A calendar choice on an empty datetime leaves its clock unfinished.
  if (props.kind === 'datetime' && /^\d{4}-\d{2}-\d{2}T$/.test(props.value)) {
    try {
      parseDate(props.value.slice(0, 10))
      return true
    } catch {
      return false
    }
  }
  return !props.value || nativeTemporalValue(props) !== null
}
