import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'

test('Stacking modal dividers exclude owned popup infrastructure and exit awaits the themed surface', async () => {
  const result = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./fixtures/modal-popups.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'ModalPopups',
      },
    },
  })
  const code = (Array.isArray(result) ? result : [result])
    .flatMap((entry) => entry.output)
    .find((entry) => entry.type === 'chunk').code
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  let demo
  try {
    const { window } = dom
    installDomEnvironment(window)
    window.HTMLDialogElement.prototype.showModal = function () {
      this.open = true
    }
    window.HTMLDialogElement.prototype.close = function () {
      this.open = false
    }
    window.eval(code)
    demo = await window.ModalPopups.mountModalPopups()
    const doc = window.document
    const tick = () => new Promise((resolve) => setTimeout(resolve, 100))
    doc.querySelector('[data-testid="stacking-open"]').click()
    await tick()
    const dialog = doc.querySelector('dialog[open]')
    const surface = dialog.querySelector(':scope > [data-slot="content"]')
    assert.ok(surface)
    const regions = [...surface.children]
    assert.deepEqual(
      regions.map((element) => element.dataset.slot),
      ['header', 'body'],
    )
    // Match the actual Tailwind divide-y child selector. This is DOM/CSS
    // integration evidence; browser tests measure the resulting geometry.
    const divided = () => [
      ...dialog.querySelectorAll('.divide-y > :not(:last-child)'),
    ]
    assert.deepEqual(divided(), [regions[0]])
    const help = [...dialog.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === 'Help',
    )
    help.focus()
    await tick()
    const tooltip = dialog.querySelector('[role="tooltip"]')
    assert.ok(tooltip)
    assert.equal(surface.contains(tooltip), false)
    assert.equal(doc.activeElement, help)
    assert.ok(doc.getElementById(help.getAttribute('aria-describedby')))
    assert.deepEqual(divided(), [regions[0]])
    const select = dialog.querySelector('[role="combobox"]')
    select.focus()
    await tick()
    assert.equal(dialog.querySelector('[role="tooltip"]'), null)
    select.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    )
    await tick()
    const choices = dialog.querySelector('[role="listbox"]')
    assert.ok(choices)
    assert.equal(surface.contains(choices), false)
    assert.deepEqual(divided(), [regions[0]])
    choices.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await tick()
    assert.equal(dialog.querySelector('[role="listbox"]'), null)
    assert.deepEqual(divided(), [regions[0]])

    // The helper receives the dialog, but Nuxt's animation now belongs to
    // its inner surface. Closing must retain native modality until it settles.
    let finishExit
    const finished = new Promise((resolve) => {
      finishExit = resolve
    })
    surface.getAnimations = () =>
      surface.dataset.state === 'closed'
        ? [
            {
              effect: { getComputedTiming: () => ({ iterations: 1 }) },
              playState: 'running',
              playbackRate: 1,
              finished,
            },
          ]
        : []
    dialog.querySelector('button[data-slot="close"]').click()
    await tick()
    assert.equal(surface.dataset.state, 'closed')
    assert.equal(dialog.open, true)
    assert.equal(dialog.isConnected, true)
    finishExit()
    await tick()
    assert.equal(dialog.isConnected, false)
    assert.deepEqual(Array.from(demo.errors), [])
  } finally {
    demo?.dispose()
    dom.window.close()
  }
})
