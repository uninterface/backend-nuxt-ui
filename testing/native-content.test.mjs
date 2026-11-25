import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { build } from './fixture-build.mjs'
import { installDomEnvironment } from '@uninterface/testing/jsdom'

test('native-content integration targets rendered navigation and custom feedback without claiming computed CSS', async () => {
  const result = await build({
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(
          new URL('./fixtures/native-content-browser.ts', import.meta.url),
        ),
        formats: ['iife'],
        name: 'NuxtNativeContent',
      },
    },
  })
  const output = (Array.isArray(result) ? result : [result]).flatMap(
    (item) => item.output,
  )
  const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })
  try {
    installDomEnvironment(dom.window)
    dom.window.eval(output.find((item) => item.type === 'chunk').code)
    const fixture = dom.window.NuxtNativeContent
    await fixture.ready
    const document = dom.window.document
    const navigation = document.querySelector(
      'nav[aria-label="Content navigation"]',
    )
    assert.ok(navigation)
    assert.ok(navigation.querySelector('ul.nuxt-navigation-list'))
    assert.ok(
      navigation.querySelector('a.nuxt-navigation-link[href="#overview"]'),
    )
    const help = document.querySelector('.nuxt-strategy-help')
    assert.equal(help.tagName, 'P')
    assert.equal(help.textContent, 'Use the recipient name.')
    const validate = [...document.querySelectorAll('button')].find(
      (element) => element.textContent.trim() === 'Validate',
    )
    validate.click()
    for (
      let i = 0;
      i < 30 && !document.querySelector('.nuxt-strategy-feedback > p');
      i++
    )
      await new Promise((resolve) => setTimeout(resolve, 10))
    assert.equal(
      document.querySelector('.nuxt-strategy-feedback > p')?.textContent,
      'Enter a name.',
    )
    assert.deepEqual(
      [...document.querySelectorAll('[data-numbering]')].map((element) =>
        element.getAttribute('type'),
      ),
      ['1', 'a', 'A', 'i', 'I'],
    )
    assert.equal(
      document.querySelector('[data-native-copy] p').hasAttribute('class'),
      false,
    )
    assert.deepEqual(Array.from(fixture.errors), [])
  } finally {
    dom.window.NuxtNativeContent?.dispose()
    dom.window.close()
  }
})
