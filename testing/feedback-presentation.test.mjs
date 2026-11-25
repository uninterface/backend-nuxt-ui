import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

const entry = new URL('./fixtures/feedback-presentation.ts', import.meta.url)
test('Nuxt feedback retains native ring, motion, close and authoritative progress', async () => {
  await withBuiltDomFixture(build, entry, async ({ mountFeedback }, window) => {
    let example
    const css = await readFile(
      new URL('../src/style.css', import.meta.url),
      'utf8',
    )
    const activeSurface =
      '.nuxt-feedback-item [data-ui-managed-feedback]:focus-visible, ' +
      '.nuxt-notification:has(> [data-slot="body"] > .nuxt-notification-content:focus-visible)'
    // JSDOM does not implement browser keyboard-modality heuristics. Check the
    // direct focus matching here; Playwright exercises actual :focus-visible paint.
    const focusedSurface = activeSurface.replaceAll(':focus-visible', ':focus')
    function verifyFocusSurface(surface, target, representsSurface = false) {
      target.focus()
      assert.equal(window.document.activeElement, target)
      assert.equal(
        surface.matches(focusedSurface),
        surface === target || representsSurface,
        'only the surface or its own scroll region activates the delivery cue',
      )
      assert.match(
        css,
        /\.nuxt-feedback-item \[data-ui-managed-feedback\]:focus-visible,\s*\.nuxt-notification:has\(\s*> \[data-slot='body'\] > \.nuxt-notification-content:focus-visible\s*\)\s*\{[^}]*outline: 3px solid color-mix\(in oklab, var\(--ui-primary\) 25%, transparent\);[^}]*outline-offset: 2px;/s,
      )
      target.blur()
      assert.equal(
        surface.matches(focusedSurface),
        false,
        'the item cue clears when focus leaves',
      )
    }
    try {
      example = await mountFeedback({ duration: 2000 }, 'toast')
      const handle = example.send('Native timed toast')
      await delay(120)
      const item = window.document.querySelector('[data-ui-feedback-item]')
      assert.ok(item.querySelector('[data-ui-footer-actions]'))
      const native = item.querySelector('[data-ui-managed-feedback]')
      assert.equal(native.getAttribute('aria-label'), 'Native timed toast')
      assert.equal(
        native.querySelector('[data-slot=title]').textContent,
        'Native timed toast',
        'toast preserves the native title region',
      )
      assert.equal(native.querySelector('[data-slot=description] strong'), null)
      assert.ok(native.classList.contains('ring'))
      assert.ok(native.classList.contains('ring-default'))
      assert.ok(native.classList.contains('shadow-lg'))
      verifyFocusSurface(native, native)
      verifyFocusSurface(native, item.querySelector('[data-slot="close"]'))
      verifyFocusSurface(
        native,
        item.querySelector('[data-ui-footer-actions] button'),
      )
      assert.match(
        native.className,
        /data-\[state=open\]:animate-\[toast-slide-in-from-bottom/,
      )
      assert.match(
        native.className,
        /data-\[state=closed\]:animate-\[toast-closed/,
      )
      assert.equal(native.style.getPropertyValue('--translate-factor'), '-1px')
      assert.equal(
        item.querySelector('[data-slot="close"]').getAttribute('aria-label'),
        'Close',
      )
      const progress = () =>
        Number(
          item
            .querySelector('[role="progressbar"]')
            .getAttribute('aria-valuenow'),
        )
      const first = progress()
      assert.ok(first > 0 && first < 100)
      await delay(120)
      assert.ok(progress() < first)
      item.dispatchEvent(new window.Event('pointerenter'))
      await delay(50)
      const paused = progress()
      await delay(120)
      assert.equal(
        progress(),
        paused,
        'hover pauses the native progress indicator',
      )
      item.dispatchEvent(new window.Event('focusin', { bubbles: true }))
      item.dispatchEvent(new window.Event('pointerleave'))
      await delay(120)
      assert.equal(
        progress(),
        paused,
        'focus keeps progress paused after hover leaves',
      )
      item.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true }))
      await delay(120)
      assert.ok(progress() < paused)
      handle.dismiss()
      await delay(80)
      assert.equal(handle.phase, 'closed')
      example.send('Persistent', false, null)
      await delay(80)
      assert.equal(
        window.document.querySelector(
          '[data-ui-feedback-item] [role="progressbar"]',
        ),
        null,
      )
      assert.deepEqual(Array.from(example.state.errors), [])
      example.dispose()
      example = await mountFeedback({ duration: null }, 'notification')
      example.host.querySelector('button').focus()
      const notification = example.send('Notification heading', true, 2000)
      await delay(80)
      assert.equal(
        window.document.querySelector(
          '[data-ui-managed-feedback] [data-slot=title]',
        ).textContent,
        'Notification heading',
      )
      const card = window.document.querySelector('.nuxt-notification')
      assert.ok(card.querySelector('[data-slot=header] [data-slot=close]'))
      assert.ok(card.querySelector('[data-slot=body] input'))
      assert.equal(card.querySelector('[data-slot=description]'), null)
      assert.ok(
        card.querySelector('[data-slot=footer] [data-ui-footer-actions]'),
      )
      const content = card.querySelector('.nuxt-notification-content')
      assert.equal(content.getAttribute('role'), 'region')
      assert.equal(content.getAttribute('aria-label'), 'Notification heading')
      assert.equal(content.tabIndex, 0)
      verifyFocusSurface(card, content, true)
      assert.equal(content.classList.contains('nuxt-focus-presentation'), false)
      verifyFocusSurface(card, card.querySelector('[data-slot="close"]'))
      verifyFocusSurface(card, content.querySelector('input'))
      verifyFocusSurface(
        card,
        card.querySelector('[data-ui-footer-actions] button'),
      )
      assert.ok(card.querySelector('[role=progressbar]'))
      const input = content.querySelector('input')
      notification.update({ title: 'Updated notification' })
      await example.flush()
      assert.equal(content.querySelector('input'), input)
      assert.equal(content.getAttribute('aria-label'), 'Updated notification')
      input.focus()
      input.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
      await delay(80)
      assert.equal(await notification.closed, 'dismissed')
      assert.equal(
        window.document.activeElement,
        example.host.querySelector('button'),
      )
      const persistent = example.send('Persistent notification', false, null)
      await delay(80)
      assert.equal(
        window.document.querySelector('.nuxt-notification [role=progressbar]'),
        null,
      )
      window.document
        .querySelector('.nuxt-notification [data-slot=close]')
        .click()
      await delay(80)
      assert.equal(await persistent.closed, 'dismissed')
      assert.deepEqual(Array.from(example.state.errors), [])
      assert.match(
        css,
        /\.nuxt-feedback-viewport\s*\{[^}]*padding: 1rem;/s,
        'scroll viewport leaves room for the native outside ring/shadow',
      )
    } finally {
      example?.dispose()
    }
  })
})
