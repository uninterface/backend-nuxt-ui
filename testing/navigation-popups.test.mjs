import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'

test('Nuxt travel popups support hover traversal, dismissal and activation through exit animations', async () => {
  const result = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./fixtures/navigation-popups.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'NavigationPopups',
      },
    },
  })
  const code = (Array.isArray(result) ? result : [result])
    .flatMap((result) => result.output)
    .find((item) => item.type === 'chunk').code
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  const { window } = dom
  installDomEnvironment(window)
  // jsdom does not run CSS animations. Supply distinct names so Reka Presence
  // retains closing surfaces, then explicitly finish them after state checks.
  // This exercises lifecycle ordering, not animation timing or geometry.
  const style = window.document.createElement('style')
  style.textContent =
    '[data-state="open"] { animation-name: navigation-enter; animation-duration: .15s; } [data-state="closed"] { animation-name: navigation-exit; animation-duration: .15s; }'
  window.document.head.append(style)
  let example
  try {
    window.eval(code)
    example = await window.NavigationPopups.mount()
    const document = window.document
    const preview = example.host.querySelector(
      '[data-testid="navigation-preview"]',
    )
    const content = preview.querySelector('[data-testid="navigation-content"]')
    const byKey = (key) =>
      [...document.querySelectorAll(`[data-entry-key="${key}"]`)].find(
        (node) =>
          !node.closest(
            '[hidden], [inert], [data-state="closed"][role="menu"]',
          ),
      )
    const click = (node) => {
      for (const type of [
        'pointerdown',
        'mousedown',
        'pointerup',
        'mouseup',
        'click',
      ])
        node.dispatchEvent(
          new window.MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        )
    }
    const pointer = (node, type, relatedTarget = null) => {
      const event = new window.MouseEvent(type, {
        bubbles: type === 'pointermove',
        cancelable: true,
        relatedTarget,
      })
      Object.defineProperty(event, 'pointerType', { value: 'mouse' })
      node.dispatchEvent(event)
    }
    const waitForHover = async () => {
      await new Promise((resolve) => setTimeout(resolve, 220))
      await example.tick()
    }
    async function finishAnimations() {
      for (let i = 0; i < 3; i++) {
        for (const node of document.querySelectorAll('[data-state="closed"]')) {
          const event = new window.Event('animationend', { bubbles: true })
          Object.defineProperty(event, 'animationName', {
            value: 'navigation-exit',
          })
          node.dispatchEvent(event)
        }
        await example.tick()
      }
    }
    for (const mode of ['horizontal', 'vertical-popup', 'icon-popup']) {
      if (mode !== 'horizontal') {
        await example.setPresentation(mode)
        await finishAnimations()
      }
      const trigger = () =>
        preview.querySelector('[data-entry-key="destinations"]')
      click(trigger())
      await example.tick()
      assert.equal(
        trigger().getAttribute('aria-expanded'),
        'true',
        `${mode}: opens`,
      )
      assert.ok(byKey('asia'))
      assert.ok(byKey('europe'))
      assert.ok(byKey('americas'))
      click(trigger())
      await example.tick()
      assert.equal(
        trigger().getAttribute('aria-expanded'),
        'false',
        `${mode}: toggle dismisses`,
      )
      await finishAnimations()

      click(trigger())
      await example.tick()
      click(byKey('allDestinations'))
      await example.tick()
      assert.equal(
        content.querySelector('h3').textContent.trim(),
        'All destinations',
        `${mode}: popup item navigates`,
      )
      assert.equal(trigger().getAttribute('aria-expanded'), 'false')
      await finishAnimations()

      click(trigger())
      await example.tick()
      pointer(byKey('asia'), 'pointermove')
      await waitForHover()
      assert.equal(byKey('asia').getAttribute('aria-expanded'), 'true')
      const submenu = byKey('singapore').closest('[role="menu"]')
      const rootSurface =
        mode === 'horizontal'
          ? document.getElementById(trigger().getAttribute('aria-controls'))
          : byKey('asia').closest('[role="menu"]')
      // Exercise outer content/viewport ownership here; native submenu pointer
      // grace needs layout geometry and is covered by the browser path test.
      pointer(rootSurface, 'pointerleave', submenu)
      // Reka's horizontal viewport also schedules dismissal on pointer leave.
      if (mode === 'horizontal')
        pointer(rootSurface.parentElement, 'pointerleave', submenu)
      pointer(submenu, 'pointerenter', rootSurface)
      await waitForHover()
      assert.equal(
        trigger().getAttribute('aria-expanded'),
        'true',
        `${mode}: moving into the teleported third level keeps its root open`,
      )
      pointer(byKey('singapore'), 'pointermove')
      byKey('singapore').focus()
      await waitForHover()
      assert.equal(
        trigger().getAttribute('aria-expanded'),
        'true',
        `${mode}: focusing the third level remains inside navigation`,
      )
      if (mode === 'horizontal') {
        pointer(submenu, 'pointerleave', rootSurface)
        pointer(rootSurface, 'pointerenter', submenu)
        await waitForHover()
        assert.equal(
          trigger().getAttribute('aria-expanded'),
          'true',
          'Returning to the parent popup cancels descendant leave dismissal',
        )
        pointer(rootSurface, 'pointerleave', submenu)
        pointer(submenu, 'pointerenter', rootSurface)
        await waitForHover()
      }
      click(byKey('singapore'))
      await example.tick()
      assert.equal(
        content.querySelector('h3').textContent.trim(),
        'Singapore',
        `${mode}: third level navigates`,
      )
      assert.equal(
        content.querySelector('[aria-current="page"]').textContent.trim(),
        'Singapore',
      )
      assert.equal(trigger().getAttribute('aria-expanded'), 'false')
      await finishAnimations()

      click(trigger())
      await example.tick()
      const item = byKey('allDestinations')
      item.focus()
      item.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
      await example.tick()
      assert.equal(
        content.querySelector('h3').textContent.trim(),
        'All destinations',
        `${mode}: keyboard activates`,
      )
      await finishAnimations()

      click(trigger())
      await example.tick()
      byKey('allDestinations').focus()
      byKey('allDestinations').dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
      await example.tick()
      assert.equal(
        trigger().getAttribute('aria-expanded'),
        'false',
        `${mode}: Escape dismisses`,
      )
      await finishAnimations()

      if (mode === 'horizontal') {
        click(trigger())
        await example.tick()
        pointer(byKey('asia'), 'pointermove')
        await waitForHover()
        const child = byKey('singapore').closest('[role="menu"]')
        pointer(child, 'pointerenter')
        pointer(child, 'pointerleave', content)
        await waitForHover()
        assert.equal(
          trigger().getAttribute('aria-expanded'),
          'false',
          'Leaving the descendant for content still dismisses the navigation',
        )
        await finishAnimations()
      }

      click(trigger())
      await example.tick()
      pointer(byKey('asia'), 'pointermove')
      await waitForHover()
      click(content.querySelector('h3'))
      await example.tick()
      assert.equal(
        trigger().getAttribute('aria-expanded'),
        'false',
        `${mode}: outside pointer dismisses`,
      )
      await finishAnimations()
      assert.deepEqual(Array.from(example.errors), [], mode)
      assert.deepEqual(Array.from(example.warnings), [], mode)
    }
  } finally {
    example?.dispose()
    window.close()
  }
})
