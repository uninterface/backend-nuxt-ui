import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'

test('Nuxt overlay regions retain native layout and panels retain their native ring', async () => {
  const built = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./fixtures/overlay-regions.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'OverlayDemo',
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
  let demo
  try {
    installDomEnvironment(dom.window)
    dom.window.HTMLDialogElement.prototype.showModal = function () {
      this.open = true
    }
    dom.window.HTMLDialogElement.prototype.close = function () {
      this.open = false
    }
    dom.window.eval(code)
    demo = await dom.window.OverlayDemo.mountOverlayRegions()
    const doc = dom.window.document
    doc.querySelector('[data-testid="open-popover"]').click()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assert.deepEqual(Array.from(demo.errors), [])
    const surface = doc.querySelector('[data-ui-overlay="popover"]')
    assert.equal(
      surface.getAttribute('aria-modal'),
      null,
      'region theming does not add modality',
    )
    assert.ok(
      surface.classList.contains('rounded-md'),
      'native popover surface remains',
    )
    const header = surface.querySelector('header')
    const body = surface.querySelector('[role="region"]')
    const footer = surface.querySelector('footer')
    assert.ok(header.classList.contains('p-4'), 'native header insets')
    assert.ok(
      header.classList.contains('flex-col'),
      'header additions follow the title row',
    )
    assert.ok(body.classList.contains('p-4'), 'native body insets')
    assert.ok(footer.classList.contains('p-4'), 'native footer insets')
    assert.ok(
      footer.classList.contains('gap-1.5'),
      'actions inherit a supplied native footer gap',
    )
    const buttons = [...footer.querySelectorAll('button')]
    assert.deepEqual(
      buttons.map((button) => button.textContent.trim()),
      ['Save note', 'Cancel'],
    )
    assert.equal(buttons[0].form, body.querySelector('form'))
    doc.querySelector('[data-testid="toggle-panel-drawer"]').click()
    await new Promise((resolve) => setTimeout(resolve, 100))
    const panel = doc.querySelector('[data-ui-overlay="drawer"][data-panel]')
    assert.ok(
      panel.classList.contains('ring'),
      'retained panels keep the native ring below sm',
    )
    assert.ok(
      panel.classList.contains('ring-default'),
      'native ring color is retained',
    )
    assert.equal(panel.getAttribute('aria-modal'), null)
    doc.querySelector('[data-testid="open-modal-drawer"]').click()
    await new Promise((resolve) => setTimeout(resolve, 100))
    const modal = doc.querySelector(
      '[data-ui-overlay="drawer"][aria-modal="true"]',
    )
    assert.ok(modal.classList.contains('ring'), 'native Drawer ring')
    for (const drawer of [panel, modal]) {
      assert.ok(
        drawer.querySelector('[data-vaul-handle]'),
        'native functional handle',
      )
      assert.ok(drawer.hasAttribute('data-vaul-drawer'))
      assert.ok(drawer.className.includes('rounded-'), 'native exposed corners')
      const drawerBody = drawer.querySelector('[role="region"]')
      assert.ok(
        drawerBody.classList.contains('p-6'),
        'drawer body retains the native desktop inset below sm',
      )
      assert.equal(drawerBody.classList.contains('p-4'), false)
      for (const region of drawer.querySelectorAll('header, footer')) {
        assert.ok(
          region.classList.contains('px-6'),
          'drawer header/footer keep their desktop horizontal inset below sm',
        )
        assert.ok(
          region.classList.contains('p-4'),
          'native header/footer vertical inset is retained',
        )
      }
    }
    assert.deepEqual(Array.from(demo.errors), [])
  } finally {
    demo?.dispose()
    dom.window.close()
  }
})
