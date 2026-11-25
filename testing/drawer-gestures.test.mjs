import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'

test('Nuxt native drawer gestures respect guards, ownership, direction and retained identity', async () => {
  const built = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./fixtures/drawer-gestures.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'Overlays',
      },
    },
  })
  const code = (Array.isArray(built) ? built : [built])
    .flatMap((entry) => entry.output)
    .find((entry) => entry.type === 'chunk').code
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  const win = dom.window,
    doc = win.document
  let example
  const tick = () => new Promise((resolve) => setTimeout(resolve, 30))
  try {
    installDomEnvironment(win)
    win.HTMLDialogElement.prototype.showModal = function () {
      this.open = true
    }
    win.HTMLDialogElement.prototype.close = function () {
      this.open = false
    }
    win.HTMLElement.prototype.showPopover = function () {
      this.dataset.shown = ''
    }
    win.HTMLElement.prototype.hidePopover = function () {
      delete this.dataset.shown
    }
    // Model layout/time for native Vaul pointer handlers. This checks interaction
    // wiring, not painted geometry, browser pointer capture or touch scrolling.
    let time = Date.now()
    const NativeDate = win.Date
    win.Date = class extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [time]))
      }
      static now() {
        return time
      }
    }
    const nativeStyle = win.getComputedStyle.bind(win)
    win.getComputedStyle = (node) => {
      const style = nativeStyle(node)
      const translation = node.style.transform.match(
        /translate3d\(([-\d.]+)(?:px)?,\s*([-\d.]+)(?:px)?,\s*0(?:px)?\)/,
      )
      if (translation)
        Object.defineProperty(style, 'transform', {
          value: `matrix(1, 0, 0, 1, ${translation[1]}, ${translation[2]})`,
        })
      if (!style.transform)
        Object.defineProperty(style, 'transform', { value: 'none' })
      return style
    }
    win.DOMMatrixReadOnly = class {
      constructor(value) {
        const parts = value
          ?.match(/matrix\((.*)\)/)?.[1]
          .split(',')
          .map(Number)
        this.m41 = parts?.[4] ?? 0
        this.m42 = parts?.[5] ?? 0
      }
    }
    win.eval(code)
    example = await win.Overlays.mountOverlays()
    const drawer = (name) =>
      [...doc.querySelectorAll('[data-ui-overlay="drawer"]')].find(
        (node) =>
          doc.getElementById(node.getAttribute('aria-labelledby'))
            ?.textContent === name,
      )
    function drag(surface, distance = 150, duration = 1000, cancel = false) {
      surface.getBoundingClientRect = () => ({
        width: 400,
        height: 600,
        x: 0,
        y: 0,
        left: 0,
        right: 400,
        top: 0,
        bottom: 600,
      })
      const direction = surface.dataset.vaulDrawerDirection
      const vertical = ['top', 'bottom'].includes(direction)
      const sign = ['top', 'left'].includes(direction) ? -1 : 1
      const target =
        surface.querySelector('[data-vaul-handle]') ??
        surface.querySelector('header')
      const pointer = (type, amount) =>
        target.dispatchEvent(
          new win.PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            buttons: type === 'pointerup' ? 0 : 1,
            clientX: 300 + (vertical ? 0 : amount * sign),
            clientY: 400 + (vertical ? amount * sign : 0),
          }),
        )
      time += 600 // native vertical drag cooldown after opening
      pointer('pointerdown', 0)
      time += duration
      pointer('pointermove', distance)
      const moved = surface.style.transform
      if (cancel) pointer('pointercancel', distance)
      pointer('pointerup', distance)
      return moved
    }
    let reason,
      guardCalls = 0
    const guarded = example.drawer.run({
      beforeClose: async (request) => {
        reason = request.reason
        guardCalls++
        const decision = await example.confirmation.run()
        return decision.status === 'completed' && decision.value
      },
    })
    await tick()
    const modal = drawer('Edit record'),
      input = modal.querySelector('input')
    input.value = 'Retained during guard'
    assert.match(
      drag(modal),
      /translate3d/,
      'real native pointer handlers move the surface',
    )
    await tick()
    assert.equal(reason, 'drag')
    assert.equal(example.drawer.state.pendingClose, true)
    assert.equal(modal.open, true)
    assert.equal(
      modal.dataset.state,
      'open',
      'Vaul stays open while the owner decides',
    )
    assert.equal(doc.documentElement.style.overflowY, 'hidden')
    drag(modal)
    await tick()
    assert.equal(guardCalls, 1, 'pending drag does not duplicate guard')
    await example.confirmation.state.session.complete(false)
    await tick()
    assert.equal(example.drawer.state.phase, 'open')
    assert.equal(modal.querySelector('input'), input)
    assert.equal(input.value, 'Retained during guard')
    drag(modal)
    await tick()
    await example.confirmation.state.session.complete(true)
    assert.equal((await guarded).reason, 'drag')
    assert.equal(modal.isConnected, false)

    for (const dir of ['ltr', 'rtl']) {
      doc.documentElement.dir = dir
      for (const edge of ['start', 'end', 'top', 'bottom']) {
        example.drawerEdge.value = edge
        const result = example.drawer.run()
        await tick()
        const surface = drawer('Edit record')
        const physical =
          edge === 'start'
            ? dir === 'rtl'
              ? 'right'
              : 'left'
            : edge === 'end'
              ? dir === 'rtl'
                ? 'left'
                : 'right'
              : edge
        assert.equal(surface.dataset.vaulDrawerDirection, physical)
        drag(surface, 20, 1000)
        await tick()
        assert.equal(
          example.drawer.state.phase,
          'open',
          'small slow drag snaps back',
        )
        drag(surface, 180, 1000, true)
        await tick()
        assert.equal(
          example.drawer.state.phase,
          'open',
          'pointer cancellation never dismisses',
        )
        drag(surface, 180, 1000)
        assert.equal(
          (await result).reason,
          'drag',
          `${dir} ${edge}: slow outward drag uses the correct signed axis`,
        )
      }
    }
    const flick = example.drawer.run()
    await tick()
    drag(drawer('Edit record'), 30, 10)
    assert.equal(
      (await flick).reason,
      'drag',
      'native velocity-based dismissal remains',
    )

    example.drawerCloseOn.value = ['escape']
    const explicit = example.drawer.run()
    await tick()
    const limited = drawer('Edit record')
    assert.equal(limited.querySelector('[data-vaul-handle]'), null)
    assert.equal(
      drag(limited),
      '',
      'excluded drag route disables native movement',
    )
    await tick()
    assert.equal(example.drawer.state.phase, 'open')
    await example.drawer.state.session.cancel()
    await explicit

    doc.querySelector('#panel-trigger').click()
    await tick()
    const panel = drawer('Filters'),
      draft = panel.querySelector('input')
    draft.value = 'Retained panel'
    draft.focus()
    const tab = new win.KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    draft.dispatchEvent(tab)
    assert.equal(tab.defaultPrevented, false, 'nonmodal panel never loops Tab')
    assert.equal(
      doc.activeElement,
      draft,
      'native wrapper does not redirect focus',
    )
    example.disabled.value = true
    await tick()
    assert.equal(drag(panel), '')
    assert.equal(example.panels.state.expandedKeys.includes('filters'), true)
    example.disabled.value = false
    await tick()
    drag(panel, 180)
    await tick()
    assert.equal(example.panels.state.expandedKeys.includes('filters'), false)
    doc.querySelector('#panel-trigger').click()
    await tick()
    assert.equal(panel.querySelector('input'), draft)
    assert.equal(draft.value, 'Retained panel')
    example.panels.collapse('filters')
    await tick()
    doc.querySelector('#model-panel-trigger').click()
    await tick()
    const controlled = drawer('Controlled panel')
    drag(controlled, 180)
    await tick()
    assert.equal(
      example.modelExpanded.value,
      true,
      'owner can deny native drag collapse',
    )
    assert.equal(controlled.dataset.state, 'open')
    example.acceptCollapse.value = true
    drag(controlled, 180)
    await tick()
    assert.equal(example.modelExpanded.value, false)
    assert.deepEqual(Array.from(example.errors), [])
  } finally {
    await example?.dispose()
    dom.window.close()
  }
})
