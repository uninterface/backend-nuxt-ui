import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'

test('breadcrumbs retain native link, label, current and separator themes with app overrides', async () => {
  const result = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./fixtures/breadcrumbs.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'BreadcrumbComparison',
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
  try {
    installDomEnvironment(dom.window)
    dom.window.eval(code)
    for (const customized of [false, true]) {
      const demo =
        await dom.window.BreadcrumbComparison.mountComparison(customized)
      try {
        const native = demo.host.querySelector('[data-native]')
        const adapter = demo.host.querySelector('[data-adapter]')
        for (const slot of [
          'root',
          'list',
          'item',
          'link',
          'linkLabel',
          'separator',
          'separatorIcon',
        ]) {
          const nodes = (root) =>
            slot === 'root'
              ? [root]
              : [...root.querySelectorAll(`[data-slot="${slot}"]`)]
          assert.deepEqual(
            nodes(adapter).map((node) => node.className),
            nodes(native).map((node) => node.className),
            slot,
          )
        }
        const links = adapter.querySelectorAll('[data-slot=link]')
        assert.equal(links[0].tagName, 'A')
        assert.equal(links[0].getAttribute('href'), '/home')
        assert.ok(links[0].classList.contains('hover:text-default'))
        assert.equal(links[0].classList.contains('hover:underline'), customized)
        assert.equal(links[1].tagName, 'SPAN')
        assert.equal(links[1].getAttribute('tabindex'), null)
        assert.equal(links[2].getAttribute('aria-disabled'), 'true')
        assert.equal(links[3].getAttribute('aria-current'), 'page')
        assert.equal(links[3].tagName, 'SPAN')
        assert.equal(adapter.querySelectorAll('a a, button').length, 0)
        // Isolate the actual base-layer rules on rendered markup. jsdom does
        // not model cascade layers/Tailwind; the browser suite checks the full CSS.
        const baseline = readFileSync(
          new URL('../src/native-content.css', import.meta.url),
          'utf8',
        )
        const rules = [
          /a\[href\] \{[^}]+\}/,
          /\[data-uninterface-breadcrumbs\] > \[data-slot='list'\] \{[^}]+\}/,
          /\[data-uninterface-breadcrumbs\] a\[data-slot='link'\] \{[^}]+\}/,
        ].map((pattern) => {
          const rule = baseline.match(pattern)?.[0]
          assert.ok(rule, String(pattern))
          return rule
        })
        const style = dom.window.document.createElement('style')
        style.textContent = rules.join('\n')
        dom.window.document.head.append(style)
        try {
          assert.equal(
            dom.window.getComputedStyle(links[0]).textDecoration,
            'none',
          )
          assert.equal(
            dom.window.getComputedStyle(native.querySelector('a'))
              .textDecoration,
            'underline',
            'ordinary unscoped anchors keep prose defaults',
          )
          const listStyle = dom.window.getComputedStyle(
            adapter.querySelector('ol'),
          )
          assert.equal(listStyle.paddingLeft, '0px')
          assert.equal(listStyle.marginBottom, '0px')
        } finally {
          style.remove()
        }
        assert.deepEqual(Array.from(demo.errors), [])
      } finally {
        demo.dispose()
      }
    }
  } finally {
    dom.window.close()
  }
})
