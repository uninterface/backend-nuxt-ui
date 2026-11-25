import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

test('nuxt-ui: native pagination is used for bounded numbered sources', async () => {
  await withBuiltDomFixture(
    build,
    new URL('./fixtures/paginator-presentation.ts', import.meta.url),
    async ({ mountNumberedPaginator }) => {
      const fixture = await mountNumberedPaginator()
      try {
        const nav = fixture.host.querySelector('nav[aria-label="Pages"]')
        assert.ok(nav)
        assert.ok(nav.querySelector('[data-slot="list"] [data-type="page"]'))
        assert.equal(
          nav.querySelector('input[type="number"]'),
          null,
          'native page buttons replace the custom page input',
        )
        assert.deepEqual(Array.from(fixture.errors), [])
      } finally {
        fixture.dispose()
      }
    },
  )
})
