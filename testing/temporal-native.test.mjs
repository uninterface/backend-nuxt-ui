import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

test('native temporal segments own edits, partial drafts, reset and calendar selection', async () => {
  await withBuiltDomFixture(
    build,
    new URL('./fixtures/temporal-native.ts', import.meta.url),
    async ({ mountNativeTemporal }, window) => {
      const demo = await mountNativeTemporal()
      try {
        assert.equal(
          demo.host.querySelectorAll('[unbounded], [extendedhours]').length,
          0,
          'Internal temporal flags must not leak into HTML (unbounded is a native attribute)',
        )
        const roots = () => [
          ...demo.host.querySelectorAll('[data-temporal-native]'),
        ]
        assert.equal(roots().length, 3, demo.host.innerHTML.slice(0, 4000))
        const segment = (index, part) =>
          roots()[index].querySelector(`[data-segment=${part}]`)
        const key = (node, value) => {
          node.focus()
          node.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              key: value,
              bubbles: true,
              cancelable: true,
            }),
          )
        }
        assert.equal(segment(0, 'day').textContent.trim(), '29')
        assert.equal(segment(1, 'second').textContent.trim(), '12')
        assert.ok(
          segment(1, 'dayPeriod'),
          '12-hour presentation uses native period segment',
        )
        assert.ok(segment(2, 'minute'), 'datetime has inline clock segments')
        assert.equal(
          roots()[1].querySelector('[data-temporal-trigger]'),
          null,
          'no duplicate time popup',
        )
        key(segment(1, 'minute'), 'ArrowUp')
        await demo.tick()
        assert.equal(demo.time.field.state.input, '09:31:12')
        key(segment(1, 'dayPeriod'), 'p')
        await demo.tick()
        assert.equal(demo.time.field.state.input, '21:31:12')
        let minute = segment(1, 'minute')
        key(minute, 'Backspace')
        key(minute, 'Backspace')
        assert.equal(
          demo.time.field.state.input,
          '21:__:12',
          'partial edit reaches core synchronously',
        )
        segment(0, 'day').focus()
        await demo.tick()
        assert.equal(
          roots()[1].getAttribute('aria-invalid'),
          'true',
          'leaving a partially edited native control validates without submission',
        )
        let saves = 0
        await assert.rejects(
          demo.form.submit(async () => {
            saves++
          }),
        )
        assert.equal(
          saves,
          0,
          'partial edit cannot submit the previous complete time',
        )
        await demo.tick()
        assert.equal(
          segment(1, 'minute'),
          minute,
          'partial edit retains the native segment and focus',
        )
        assert.equal(roots()[1].getAttribute('aria-invalid'), 'true')
        const timeEditor = roots()[1]
        await demo.setLocale('zh-TW')
        assert.equal(
          demo.time.field.state.input,
          '21:__:12',
          'locale changes retain partial state',
        )
        assert.equal(
          roots()[1],
          timeEditor,
          'locale changes retain the native editor',
        )
        minute = segment(1, 'minute')
        key(minute, '4')
        key(minute, '5')
        await demo.tick()
        assert.equal(demo.time.field.state.input, '21:45:12')
        demo.time.field.reset()
        await demo.tick()
        assert.equal(segment(1, 'minute').textContent.trim(), '30')
        await demo.setLocale('en-US')
        key(segment(0, 'day'), 'Backspace')
        key(segment(0, 'day'), 'Backspace')
        await demo.tick()
        assert.equal(demo.date.field.state.input, '2024-02-__')
        demo.date.field.reset()
        await demo.tick()
        assert.equal(segment(0, 'day').textContent.trim(), '29')
        const trigger = roots()[0].querySelector('[data-temporal-trigger]')
        assert.ok(trigger.closest('[data-slot=leading]'))
        trigger.click()
        await demo.tick()
        window.document
          .querySelector(
            '[data-reka-calendar-cell-trigger][data-value="2024-02-15"]',
          )
          .click()
        await demo.tick()
        assert.equal(demo.date.field.state.input, '2024-02-15')
        assert.equal(segment(0, 'day').textContent.trim(), '15')
        await demo.datetime.bindings.dateTimeInput.set(null)
        await demo.tick()
        assert.match(segment(2, 'day').textContent.trim(), /^\D+$/)
        const datetimeTrigger = roots()[2].querySelector(
          '[data-temporal-trigger]',
        )
        datetimeTrigger.focus()
        datetimeTrigger.click()
        await demo.tick()
        window.document
          .querySelector(
            '[data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-outside-view])',
          )
          .click()
        await demo.tick()
        assert.equal(
          window.document.activeElement,
          roots()[2].querySelector('[data-temporal-trigger]'),
          'empty datetime selection returns focus to its trigger',
        )
        assert.match(demo.datetime.field.state.input, /^\d{4}-\d{2}-\d{2}T$/)
        assert.equal(
          roots().length,
          3,
          'empty datetime calendar selection retains native editor',
        )
        assert.ok(segment(2, 'day').getAttribute('aria-valuenow'))
        assert.match(segment(2, 'minute').textContent.trim(), /^\D+$/)
        key(segment(2, 'hour'), '1')
        await demo.tick()
        await demo.datetime.bindings.dateTimeInput.set(null)
        await demo.tick()
        assert.match(
          segment(2, 'hour').textContent.trim(),
          /^\D+$/,
          'external clear discards partial segments',
        )
        await demo.date.field.set('2023-02-29')
        await demo.tick()
        assert.equal(
          demo.host.querySelector('input[aria-label=Date]').value,
          '2023-02-29',
          'external invalid values remain visible in the text fallback',
        )
        demo.date.field.reset()
        await demo.tick()
        assert.equal(roots().length, 3)
        await demo.setReadonly(true)
        const before = demo.time.field.state.input
        key(segment(1, 'minute'), 'ArrowUp')
        await demo.tick()
        assert.equal(demo.time.field.state.input, before)
        await demo.setReadonly(false)
        await demo.setDisabled(true)
        key(segment(1, 'minute'), 'ArrowUp')
        await demo.tick()
        assert.equal(demo.time.field.state.input, before)
        assert.deepEqual(Array.from(demo.errors), [])
      } finally {
        demo.dispose()
      }
    },
  )
})
