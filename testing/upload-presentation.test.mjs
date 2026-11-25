import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

test('upload region preserves native acquisition presentation and independent controls', async () => {
  await withBuiltDomFixture(
    build,
    new URL('./fixtures/upload-presentation.ts', import.meta.url),
    async ({ mountUpload }) => {
      const example = await mountUpload()
      try {
        const { root } = example
        assert.ok(root)
        assert.ok(
          root.matches('.border.rounded-lg.bg-default'),
          'native upload area theme',
        )
        assert.ok(
          root.querySelector(
            '[data-upload-choose] [data-slot=avatar] .iconify',
          ),
          'native avatar includes upload artwork',
        )
        assert.ok(
          root.querySelector('[data-upload-choose] .font-medium'),
          'native label styling',
        )
        assert.equal(root.getAttribute('role'), 'group')
        assert.equal(root.querySelectorAll('input[type=file]').length, 1)
        assert.deepEqual(Array.from(example.errors), [])
      } finally {
        example.dispose()
      }
    },
  )
})
