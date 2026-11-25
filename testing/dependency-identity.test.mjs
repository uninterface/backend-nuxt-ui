import { test } from 'node:test'
import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'

test('adapter, Nuxt UI and Vaul share the same Reka context implementation', () => {
  const adapter = createRequire(new URL('../package.json', import.meta.url))
  const nuxt = createRequire(
    realpathSync(
      new URL('../node_modules/@nuxt/ui/package.json', import.meta.url),
    ),
  )
  const vaul = createRequire(adapter.resolve('vaul-vue'))
  const reka = realpathSync(adapter.resolve('reka-ui'))
  assert.equal(realpathSync(nuxt.resolve('reka-ui')), reka)
  assert.equal(realpathSync(vaul.resolve('reka-ui')), reka)
})
