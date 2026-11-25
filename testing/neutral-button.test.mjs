import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

const entry = new URL('./fixtures/presentation.ts', import.meta.url)

test('nuxt-ui: neutral button retains native treatment and semantic interaction color', async () => {
  await withBuiltDomFixture(build, entry, async (fixture) => {
    const example = await fixture.mountNeutralButton()
    try {
      const button = example.host.querySelector('button')
      assert.ok(button)
      for (const color of example.colors) {
        await example.update({ color })
        const native = color === 'danger' ? 'error' : color
        assert.ok(button.classList.contains('ring'))
        assert.ok(button.classList.contains('text-' + native))
        assert.ok(button.classList.contains('hover:bg-' + native + '/10'))
      }
      assert.deepEqual(Array.from(example.errors), [])
    } finally {
      example.dispose()
    }
  })
})
