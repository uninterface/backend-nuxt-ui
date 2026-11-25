import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'
import backendPlugins from '../src/vite.mjs'

async function bundledIcons(ui, root) {
  const plugins = backendPlugins({ ui }).flat(Infinity)
  const plugin = plugins.find(
    ({ name }) => name === 'uninterface-nuxt-native-icons',
  )
  plugin.configResolved({ root })
  const code = await plugin.load('virtual:nuxt-ui-icons')
  const { init } = await import(
    `data:text/javascript,${encodeURIComponent(code)}`
  )
  const icons = new Map()
  init((name, data) => icons.set(name, data))
  return icons
}

test('native icons resolve from backend dependencies, respect overrides and reject missing assets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uninterface-icons-'))
  try {
    const icons = await bundledIcons(undefined, root)
    assert.ok(icons.get('lucide:check')?.body)
    assert.ok(icons.get('lucide:loader-circle')?.body)
    assert.ok(icons.get('lucide:move-horizontal')?.body)
    assert.ok(
      icons.size < 100,
      'bundle configured icons, not the full collection',
    )
    const override = await bundledIcons(
      { icons: { check: 'i-lucide-alarm-clock' } },
      root,
    )
    assert.ok(override.get('lucide:alarm-clock')?.body)
    assert.equal(override.has('lucide:check'), false)
    const collection = join(root, 'node_modules/@iconify-json/local-test')
    await mkdir(collection, { recursive: true })
    await writeFile(
      join(collection, 'package.json'),
      JSON.stringify({ name: '@iconify-json/local-test', version: '1.0.0' }),
    )
    await writeFile(
      join(collection, 'icons.json'),
      JSON.stringify({
        prefix: 'local-test',
        width: 24,
        height: 24,
        icons: { mark: { body: '<path d="M0 0h24v24H0z"/>' } },
      }),
    )
    const custom = await bundledIcons(
      { icons: { check: 'local-test:mark' } },
      root,
    )
    assert.ok(custom.get('local-test:mark')?.body)
    assert.ok(custom.get('lucide:loader-circle')?.body)

    await assert.rejects(
      bundledIcons({ icons: { check: 'i-lucide-not-a-real-icon' } }, root),
      /Cannot bundle Nuxt UI native icons/,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('native icon components render local artwork without fetching', async () => {
  const result = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./fixtures/native-icons.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'NativeIcons',
      },
    },
  })
  const code = (Array.isArray(result) ? result : [result])
    .flatMap((item) => item.output)
    .find((item) => item.type === 'chunk').code
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  try {
    installDomEnvironment(dom.window)
    const requests = []
    dom.window.fetch = async (url) => {
      requests.push(String(url))
      throw new Error('No network in native icon acceptance')
    }
    dom.window.eval(code)
    const fixture = await dom.window.NativeIcons.mountIcons()
    try {
      const icons = [...fixture.host.querySelectorAll('[data-native-icon]')]
      assert.ok(icons.length > 0)
      for (const icon of icons) {
        assert.equal(icon.tagName.toLowerCase(), 'svg', icon.dataset.nativeIcon)
        assert.ok(icon.children.length > 0, icon.dataset.nativeIcon)
      }
      assert.ok(fixture.host.querySelector('svg[data-native-icon=check]'))
      assert.ok(fixture.host.querySelector('svg[data-native-icon=loading]'))
      for (const mode of ['start', 'end', 'bounded', 'next-day']) {
        const artwork = fixture.host.querySelector(
          `[data-temporal-artwork=${mode}]`,
        )
        assert.ok(artwork.querySelector('svg path, svg rect'), mode)
        assert.equal(artwork.getAttribute('aria-hidden'), 'true')
      }
      assert.equal(
        fixture.host
          .querySelector('[data-temporal-artwork=unrestricted]')
          .textContent.trim(),
        '∞',
      )
      await new Promise((resolve) => setTimeout(resolve, 100))
      assert.deepEqual(requests, [])
      assert.deepEqual(Array.from(fixture.errors), [])
    } finally {
      fixture.dispose()
    }
  } finally {
    dom.window.close()
  }
})
