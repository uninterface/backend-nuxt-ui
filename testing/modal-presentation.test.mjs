import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

test('modal close uses native presentation', async () => {
  await withBuiltDomFixture(
    build,
    new URL('./fixtures/modal-presentation.ts', import.meta.url),
    async ({ mountModal }, window) => {
      window.HTMLDialogElement.prototype.showModal = function () {
        this.open = true
      }
      window.HTMLDialogElement.prototype.close = function () {
        this.open = false
      }
      const example = await mountModal()
      try {
        const run = example.control.run()
        await delay(100)
        const dialog = window.document.querySelector('dialog[open]')
        assert.ok(dialog)
        const surface = dialog.querySelector(':scope > [data-slot="content"]')
        assert.ok(surface)
        assert.ok(surface.classList.contains('shadow-lg'))
        assert.ok(surface.classList.contains('max-w-none'))
        assert.ok(surface.classList.contains('divide-y'))
        assert.equal(dialog.classList.contains('divide-y'), false)
        assert.deepEqual(
          [...surface.children].map((element) => element.dataset.slot),
          ['header', 'body', 'footer'],
        )
        assert.equal(surface.dataset.state, 'open')
        assert.ok(
          dialog
            .querySelector('[data-slot="title"]')
            .classList.contains('font-semibold'),
        )
        assert.equal(
          dialog
            .querySelector('[data-slot="title"]')
            .classList.contains('text-lg'),
          false,
        )
        const close = dialog.querySelector('button[data-slot="close"]')
        assert.ok(close)
        assert.ok(
          close.querySelector(
            'svg.iconify--lucide[data-slot="leadingIcon"] path',
          ),
          'native configured close icon',
        )
        assert.ok(
          close.classList.contains('absolute'),
          'native modal close placement',
        )
        assert.ok(
          close.classList.contains('top-4'),
          'native modal close theme is applied',
        )
        assert.equal(close.getAttribute('aria-label'), 'Close')
        assert.equal(
          close.textContent.trim(),
          '',
          'no text cross substitutes for native artwork',
        )
        const dividers = () => [
          ...dialog.querySelectorAll('.divide-y > :not(:last-child)'),
        ]
        const initialDividers = dividers()
        assert.deepEqual(initialDividers, [...surface.children].slice(0, 2))
        const select = dialog.querySelector('[role="combobox"]')
        assert.ok(select)
        select.dispatchEvent(
          new window.KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
          }),
        )
        await delay(100)
        const choices = dialog.querySelector('[role="listbox"]')
        assert.ok(choices)
        assert.equal(surface.contains(choices), false)
        assert.deepEqual(
          dividers(),
          initialDividers,
          'footer boundaries ignore the popup',
        )
        choices.dispatchEvent(
          new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        )
        await delay(100)
        assert.equal(select.getAttribute('aria-expanded'), 'false')
        assert.deepEqual(
          dividers(),
          initialDividers,
          'footer boundaries ignore the closed placeholder',
        )
        await example.control.state.session.cancel()
        await run
        assert.deepEqual(Array.from(example.errors), [])
      } finally {
        await example.dispose()
      }
    },
  )
})
