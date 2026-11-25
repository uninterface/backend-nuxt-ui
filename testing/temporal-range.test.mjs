import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

test('Nuxt native ranges retain drafts, infer overnight clocks, switch boundary modes and reset', async () => {
  await withBuiltDomFixture(
    build,
    new URL('./fixtures/temporal-range.ts', import.meta.url),
    async ({ mountTemporalRanges }, window) => {
      const demo = await mountTemporalRanges()
      try {
        // No size strategy: ordinary consumers must resolve native defaults safely.
        assert.deepEqual(
          Array.from(demo.errors),
          [],
          'default-sized ranges mount without errors',
        )
        const doc = window.document
        const section = (kind) =>
          demo.host.querySelector(`[data-range=${kind}]`)
        const segment = (kind, side, part) =>
          section(kind).querySelector(
            `[data-reka-${kind === 'time' ? 'time' : 'date'}-range-field-segment-type=${side}][data-segment=${part}]`,
          )
        const key = (el, key) => {
          el.focus()
          el.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              key,
              bubbles: true,
              cancelable: true,
            }),
          )
        }
        for (const kind of ['date', 'time', 'datetime'])
          assert.ok(section(kind).querySelector('[data-temporal-native-range]'))
        // Layout annotations follow native locale order, including literals and AM/PM.
        // Resizing only changes CSS; the same native nodes still own editing/navigation.
        for (const presentation of [
          { locale: 'en-US', hourCycle: 'h12' },
          { locale: 'en-GB', hourCycle: 'h23' },
          { locale: 'zh-CN', hourCycle: 'h23' },
          { locale: 'ar-EG', hourCycle: 'h12' },
        ]) {
          await demo.setDatetimePresentation(presentation)
          const root = section('datetime').querySelector(
            '[data-temporal-native-range]',
          )
          for (const side of ['start', 'end']) {
            const nodes = [
              ...root.querySelectorAll(
                `[data-reka-date-range-field-segment-type=${side}]`,
              ),
            ]
            assert.ok(nodes.some((el) => el.dataset.segment === 'literal'))
            nodes.forEach((el, index) =>
              assert.equal(
                el.style.getPropertyValue('--ui-temporal-column'),
                String(index + 2),
              ),
            )
          }
        }
        await demo.setDatetimePresentation({
          locale: 'en-US',
          hourCycle: 'h23',
        })
        const datetimeRoot = section('datetime').querySelector(
          '[data-temporal-native-range]',
        )
        const lastStart = [
          ...datetimeRoot.querySelectorAll(
            '[data-reka-date-range-field-segment-type=start][role=spinbutton]',
          ),
        ].at(-1)
        const firstEnd = datetimeRoot.querySelector(
          '[data-reka-date-range-field-segment-type=end][role=spinbutton]',
        )
        key(lastStart, 'ArrowRight')
        assert.equal(doc.activeElement, firstEnd)
        key(firstEnd, 'ArrowLeft')
        assert.equal(doc.activeElement, lastStart)
        const endMinute = segment('datetime', 'end', 'minute')
        key(endMinute, 'ArrowUp')
        await demo.tick()
        assert.equal(demo.datetime.field.state.input.end, '2026-10-23T17:01')
        key(endMinute, 'Backspace')
        key(endMinute, 'Backspace')
        await demo.tick()
        assert.ok(demo.datetime.field.state.input.end.includes('_'))
        demo.datetime.field.reset()
        await demo.tick()
        assert.equal(segment('datetime', 'end', 'minute'), endMinute)
        assert.equal(demo.datetime.field.state.input.end, '2026-10-23T17:00')
        assert.equal(segment('time', 'end', 'hour').textContent, '02')
        assert.equal(
          segment('time', 'end', 'hour').getAttribute('aria-invalid'),
          null,
        )
        assert.match(
          segment('time', 'end', 'hour').getAttribute('aria-label'),
          /Time range.*End/,
        )
        key(segment('time', 'end', 'hour'), 'ArrowUp')
        await demo.tick()
        assert.equal(demo.time.field.state.input.end, '03:00')
        assert.equal(await demo.time.field.validate(), true)
        const day = segment('date', 'start', 'day')
        key(day, 'Backspace')
        key(day, 'Backspace')
        assert.ok(
          demo.date.field.state.input.start.includes('_'),
          'partial edit invalidates synchronously',
        )
        await demo.tick()
        await demo.date.field.validate()
        await demo.tick()
        assert.equal(demo.date.field.state.valid, false)
        assert.equal(
          segment('date', 'start', 'day'),
          day,
          'partial editing retains native target',
        )
        assert.equal(day.getAttribute('aria-invalid'), 'true')
        const draft = demo.date.field.state.input.start
        async function mode(label, kind = 'date') {
          section(kind).querySelector('[data-temporal-mode]').click()
          await demo.tick()
          const item = [
            ...doc.querySelectorAll('[role=menuitemcheckbox]'),
          ].find(
            (el) =>
              el.querySelector('[data-slot=itemLabel]')?.textContent.trim() ===
              label,
          )
          assert.ok(item, label)
          assert.ok(
            item.querySelector('[data-temporal-mode-icon]'),
            'menu items include mode icons',
          )
          item.click()
          await demo.tick()
        }
        await mode('End only')
        assert.equal(demo.date.field.state.input.start, null)
        assert.equal(
          section('date').querySelector('[data-temporal-native-range]'),
          null,
        )
        assert.ok(section('date').querySelector('[data-temporal-native]'))
        await mode('Unrestricted')
        assert.deepEqual(
          JSON.parse(JSON.stringify(demo.date.field.state.input)),
          {
            start: null,
            end: null,
          },
        )
        assert.ok(section('date').querySelector('[data-temporal-unrestricted]'))
        await mode('Both boundaries')
        assert.equal(demo.date.field.state.input.start, draft)
        demo.date.field.reset()
        await demo.tick()
        assert.equal(segment('date', 'start', 'day').textContent, '21')
        await mode('Start only')
        demo.date.field.reset()
        await demo.tick()
        await mode('End only')
        await mode('Both boundaries')
        assert.equal(
          demo.date.field.state.input.start,
          '2026-10-21',
          'reset never resurrects earlier malformed draft',
        )
        section('date').querySelector('[data-temporal-clear]').click()
        await demo.tick()
        assert.equal(demo.date.field.state.input, null)
        assert.ok(section('date').querySelector('[data-temporal-native-range]'))
        assert.ok(
          segment('date', 'start', 'day').hasAttribute('data-placeholder'),
        )
        demo.date.field.reset()
        await demo.tick()
        section('date').querySelector('[data-temporal-trigger]').click()
        await demo.tick()
        assert.ok(section('date').querySelector('[data-engaged]'))
        const cell = (value) =>
          doc.querySelector(
            `[data-reka-calendar-cell-trigger][data-value="${value}"]`,
          )
        assert.ok(cell('2026-10-24'))
        cell('2026-10-24').focus()
        await demo.tick()
        cell('2026-10-24').click()
        await demo.tick()
        assert.ok(cell('2026-10-24'))
        cell('2026-10-24').focus()
        await demo.tick()
        cell('2026-10-24').click()
        await demo.tick()
        assert.equal(await demo.date.field.validate(), true)
        assert.equal(demo.date.field.state.input.start, '2026-10-24')
        assert.equal(
          demo.date.field.state.input.end,
          '2026-10-24',
          'native calendar single day is inclusive',
        )
        assert.equal(
          segment('date', 'start', 'day').textContent,
          '24',
          'calendar synchronizes input segments',
        )
        assert.equal(segment('date', 'end', 'day').textContent, '24')
        section('datetime').querySelector('[data-temporal-trigger]').click()
        await demo.tick()
        for (const date of ['2026-10-25', '2026-10-26']) {
          cell(date).focus()
          await demo.tick()
          cell(date).click()
          await demo.tick()
        }
        assert.equal(demo.datetime.field.state.input.start, '2026-10-25T09:00')
        assert.equal(
          demo.datetime.field.state.input.end,
          '2026-10-26T17:00',
          'calendar retains end time through partial date selection',
        )
        assert.equal(await demo.datetime.field.validate(), true)
        section('datetime').querySelector('[data-temporal-trigger]').click()
        await demo.tick()
        await demo.datetime.field.set(null)
        await demo.tick()
        for (const date of ['2026-10-25', '2026-10-26']) {
          cell(date).focus()
          await demo.tick()
          cell(date).click()
          await demo.tick()
        }
        assert.equal(
          demo.datetime.field.state.input.end,
          '2026-10-26T',
          'external clear discards retained calendar time',
        )
        assert.equal(await demo.datetime.field.validate(), false)
        await demo.time.field.set({ start: '22:00', end: '50:00' })
        await demo.tick()
        assert.equal(
          section('time').querySelector('[data-temporal-native-range]'),
          null,
        )
        assert.ok(
          [...section('time').querySelectorAll('input')].some(
            (el) => el.value === '50:00',
          ),
          'overlong external draft remains visible',
        )
        assert.equal(await demo.time.field.validate(), false)
        demo.time.field.reset()
        await demo.tick()
        assert.ok(section('time').querySelector('[data-temporal-native-range]'))
        for (const kind of ['date', 'time', 'datetime']) {
          demo[kind].field.reset()
          await demo.tick()
          const frame = section(kind).querySelector('[data-ui-input-frame]')
          for (const [label, absent] of [
            ['Start only', ['end']],
            ['End only', ['start']],
            ['Unrestricted', ['start', 'end']],
          ]) {
            await mode(label, kind)
            assert.equal(
              section(kind).querySelector('[data-ui-input-frame]'),
              frame,
            )
            assert.equal(
              section(kind)
                .querySelector('[data-temporal-separator]')
                .textContent.trim(),
              '–',
            )
            assert.equal(
              section(kind).querySelectorAll('[data-temporal-infinity]').length,
              absent.length,
            )
            for (const side of absent) {
              const badge = section(kind).querySelector(
                `[data-temporal-side=${side}] [data-temporal-infinity]`,
              )
              assert.equal(badge.textContent.trim(), '∞')
              assert.match(badge.getAttribute('aria-label'), /Unbounded/)
              assert.equal(badge.getAttribute('role'), 'img')
              assert.equal(badge.hasAttribute('tabindex'), false)
            }
          }
          await mode('Both boundaries', kind)
          assert.ok(section(kind).querySelector('[data-temporal-native-range]'))
          assert.equal(
            section(kind).querySelectorAll('[data-temporal-infinity]').length,
            0,
          )
          assert.equal(await demo[kind].field.validate(), true)
        }
        const nextDay = section('time').querySelector(
          '[data-temporal-next-day]',
        )
        assert.equal(nextDay.getAttribute('aria-label'), 'Next day')
        assert.equal(
          nextDay.textContent.trim(),
          '',
          'next-day presentation uses a single custom calendar +1 icon',
        )
        assert.ok(nextDay.querySelector('svg'))
        await demo.time.field.set({ start: '09:00', end: '17:00' })
        await demo.tick()
        assert.equal(
          section('time')
            .querySelector('[data-temporal-next-day]')
            .getAttribute('aria-hidden'),
          'true',
        )
        assert.deepEqual(Array.from(demo.errors), [])
      } finally {
        demo.dispose()
      }
    },
  )
})
