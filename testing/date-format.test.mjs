import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'

test('private Nuxt date patterns retain native editing and independent calendar language', async () => {
  const result = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./date-format-fixture.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'DateFormat',
      },
    },
  })
  const code = (Array.isArray(result) ? result : [result])
    .flatMap((r) => r.output)
    .find((r) => r.type === 'chunk').code
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  let demo
  try {
    installDomEnvironment(dom.window)
    dom.window.eval(code)
    demo = await dom.window.DateFormat.mount()
    const doc = dom.window.document
    const section = (name) => demo.host.querySelector(`[data-case=${name}]`)
    const segments = (name, side) => [
      ...section(name).querySelectorAll(
        side
          ? `[data-reka-date-range-field-segment-type=${side}]`
          : '[data-slot=segment]',
      ),
    ]
    const dateText = (name, side) => {
      let count = 0
      return segments(name, side)
        .filter((el) => {
          if (count === 3) return false
          if (['year', 'month', 'day'].includes(el.dataset.segment)) count++
          return true
        })
        .map((el) => el.textContent)
        .join('')
    }
    const key = (el, key) => {
      el.focus()
      el.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        }),
      )
    }
    const formats = [
      [undefined, '2026-03-02', '2026-03-04'],
      ['DMY', '02/03/2026', '04/03/2026'],
      ['MDY', '03/02/2026', '03/04/2026'],
      ['YMD', '2026-03-02', '2026-03-04'],
    ]
    let calendarText
    for (const [format, start, end] of formats) {
      await demo.format(format)
      for (const name of ['date', 'datetime'])
        assert.equal(dateText(name), start, `${name} ${format}`)
      for (const name of ['range', 'datetimeRange']) {
        assert.equal(dateText(name, 'start'), start)
        assert.equal(dateText(name, 'end'), end)
      }
      for (const name of ['range', 'datetimeRange']) {
        section(name).querySelector('[data-temporal-mode]').click()
        await demo.tick()
        const item = [...doc.querySelectorAll('[role=menuitemcheckbox]')].find(
          (el) => el.textContent.trim() === '仅指定开始',
        )
        assert.ok(item)
        item.click()
        await demo.tick()
        assert.equal(
          dateText(name),
          start,
          'one-sided scalar retains the selected pattern',
        )
        demo.controls[name].field.reset()
        await demo.tick()
      }
      assert.ok(section('text').querySelector('input').value.startsWith(start))
      assert.equal(
        dateText('independent'),
        '03/02/2026',
        'format is instance-local',
      )
      assert.equal(demo.controls.date.field.state.input, '2026-03-02')
      assert.equal(
        demo.host.querySelector('[date-format-wish], [dateformatwish]'),
        null,
        'private prop never leaks into DOM',
      )
      for (const name of ['date', 'range']) {
        section(name).querySelector('[data-temporal-trigger]').click()
        await demo.tick()
        const popup = doc.querySelector('[data-temporal-popup]')
        assert.ok(popup)
        assert.match(popup.textContent, /2026年3月|2026年\s*3月|三月/)
        const heading = popup.querySelector('[data-slot=heading]')?.textContent
        if (heading) {
          if (calendarText) assert.equal(heading, calendarText)
          else calendarText = heading
        }
        popup.dispatchEvent(
          new dom.window.KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
          }),
        )
        await demo.tick()
      }
    }
    // Locale-driven reordering must preserve an unfinished endpoint, not restore its old model.
    for (const name of ['date', 'datetimeRange']) {
      const side = name === 'datetimeRange' ? 'start' : undefined
      const day = segments(name, side).find(
        (el) => el.dataset.segment === 'day',
      )
      key(day, 'Backspace')
      key(day, 'Backspace')
      await demo.tick()
      const draft = JSON.stringify(demo.controls[name].field.state.input)
      assert.ok(draft.includes('_'))
      await demo.format('DMY')
      assert.equal(JSON.stringify(demo.controls[name].field.state.input), draft)
      assert.equal(
        doc.activeElement?.getAttribute('data-segment'),
        'day',
        'format changes retain the focused part',
      )
      const targets = segments(name, side).filter(
        (el) => el.getAttribute('role') === 'spinbutton',
      )
      assert.equal(targets[0].dataset.segment, 'day')
      key(targets[0], 'ArrowRight')
      assert.equal(doc.activeElement, targets[1])
      demo.controls[name].field.reset()
      await demo.tick()
      assert.equal(dateText(name, side), '02/03/2026')
      await demo.format('YMD')
    }
    await demo.format('MDY')
    const day = segments('date').find((el) => el.dataset.segment === 'day')
    key(day, 'ArrowUp')
    await demo.tick()
    assert.equal(dateText('date'), '03/03/2026')
    assert.equal(demo.controls.date.field.state.input, '2026-03-03')
    await demo.readonly(true)
    key(day, 'ArrowUp')
    await demo.tick()
    assert.equal(dateText('date'), '03/03/2026')
    await demo.readonly(false)
    await demo.disabled(true)
    key(day, 'ArrowUp')
    await demo.tick()
    assert.equal(dateText('date'), '03/03/2026')
    await demo.disabled(false)
    // Text fallback parses the selected pattern, including fractional seconds.
    const input = section('text').querySelector('input')
    input.focus()
    input.dispatchEvent(new dom.window.FocusEvent('focus', { bubbles: true }))
    input.value = '03/05/2026 · 09:05:12.345'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await demo.tick()
    assert.equal(
      demo.controls.text.field.state.input,
      '2026-03-05T09:05:12.345',
    )
    await demo.format('DMY')
    input.value = '03/06/2026 · 09:05:12.345'
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    await demo.tick()
    assert.equal(
      demo.controls.text.field.state.input,
      '2026-03-06T09:05:12.345',
      'focused text keeps original grammar',
    )
    input.dispatchEvent(new dom.window.FocusEvent('blur', { bubbles: true }))
    await demo.tick()
    assert.ok(input.value.startsWith('06/03/2026'))
    for (const format of ['YMD', 'DMY', 'MDY']) {
      await demo.format(format)
      await demo.controls.date.field.set('0007-03-02')
      await demo.controls.text.field.set('0007-03-02T09:05:12.345')
      await demo.tick()
      const expected = {
        YMD: '0007-03-02',
        DMY: '02/03/0007',
        MDY: '03/02/0007',
      }[format]
      assert.equal(dateText('date'), expected)
      assert.ok(
        section('text').querySelector('input').value.startsWith(expected),
      )
    }
    demo.controls.date.field.reset()
    await demo.tick()
    await demo.language('en')
    section('date').querySelector('[data-temporal-trigger]').click()
    await demo.tick()
    assert.match(
      doc.querySelector('[data-temporal-popup]').textContent,
      /March/,
    )
    assert.equal(dateText('date'), '03/02/2026')
    assert.deepEqual(Array.from(demo.errors), [])
  } finally {
    demo?.dispose()
    dom.window.close()
  }
})
