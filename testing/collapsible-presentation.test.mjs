import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

const entry = new URL('./fixtures/presentation.ts', import.meta.url)

test('collapsible uses native presentation and indicator', async () => {
  await withBuiltDomFixture(build, entry, async (fixture) => {
    const example = await fixture.mountExpandedCollapsible()
    try {
      const root = example.host.querySelector('[data-fixture="collapsible"]')
      assert.ok(root)
      assert.ok(root.querySelector('[data-slot="trigger"][data-state="open"]'))
      assert.ok(
        root.querySelector('[data-slot="trailingIcon"].iconify--lucide'),
      )
      assert.ok(root.querySelector('[data-slot="body"]'))
      const trigger = root.querySelector('[data-slot="trigger"]')
      const content = root.querySelector('[data-slot="content"]')
      assert.equal(trigger.getAttribute('aria-controls'), content.id)
      assert.equal(content.getAttribute('aria-labelledby'), trigger.id)
      assert.ok(trigger.classList.contains('py-3.5'))
      assert.match(content.className, /accordion-down/)
      assert.equal(trigger.className.includes('nuxt-disclosure'), false)
      assert.deepEqual(Array.from(example.errors), [])
    } finally {
      example.dispose()
    }
  })
})

test('adjacent panels use native sibling boundaries and application overrides', async () => {
  await withBuiltDomFixture(
    build,
    new URL('./fixtures/collapsible.ts', import.meta.url),
    async (fixtures, window) => {
      let example
      try {
        for (const override of [
          undefined,
          'border-b-0',
          'border-b-2 border-primary',
          'last:border-b-2',
        ]) {
          fixtures.configureItem(override)
          example = await fixtures.mountSiblingCollapsibles()
          const items = [
            ...example.host.querySelectorAll(
              '[data-testid="standalone-collapsible"], [data-testid="coordinated-panels"] [data-slot="item"]',
            ),
          ]
          assert.equal(
            items.length,
            4,
            'standalone plus three coordinated panels',
          )
          assert.equal(new Set(items.map((item) => item.parentElement)).size, 2)
          assert.equal(
            items.filter((item) => item.matches(':last-child')).length,
            2,
          )
          function inspectBoundaries() {
            for (const item of items) {
              assert.equal(
                item.classList.contains('last:border-b-0'),
                override !== 'last:border-b-2',
              )
              for (const token of (override ?? 'border-b border-default').split(
                ' ',
              )) {
                assert.ok(
                  item.classList.contains(token),
                  `${token}: ${item.className}`,
                )
              }
              if (
                override === 'border-b-0' ||
                override?.split(' ').includes('border-b-2')
              ) {
                assert.equal(item.classList.contains('border-b'), false)
              }
            }
          }
          inspectBoundaries()
          for (const item of items) {
            item.querySelector('[data-slot="trigger"]').click()
            await example.tick()
            inspectBoundaries()
          }
          assert.deepEqual(Array.from(example.errors), [])
          example.dispose()
          example = undefined
          const comparison = await fixtures.mountComparison()
          try {
            const nativeItems = () => [
              ...comparison.host.querySelectorAll(
                '[data-native-group] [data-slot="item"]',
              ),
            ]
            const adapterItems = () => [
              ...comparison.host.querySelectorAll(
                '[data-adapter-group] [data-slot="item"]',
              ),
            ]
            function compare() {
              assert.equal(adapterItems().length, nativeItems().length)
              adapterItems().forEach((item, index) => {
                const native = nativeItems()[index]
                assert.deepEqual(
                  [...item.classList]
                    .filter((token) => token !== 'w-full')
                    .sort(),
                  [...native.classList].sort(),
                )
                assert.equal(
                  item.matches(':last-child'),
                  native.matches(':last-child'),
                )
                assert.equal(
                  item.querySelector('[data-slot="trigger"]').className,
                  native.querySelector('[data-slot="trigger"]').className,
                )
                assert.ok(
                  item
                    .querySelector('[data-slot="trigger"]')
                    .classList.contains('font-medium'),
                )
              })
            }
            compare()
            const triggers = adapterItems().map((item) =>
              item.querySelector('[data-slot="trigger"]'),
            )
            for (const trigger of triggers) trigger.click()
            await comparison.tick()
            const draft = comparison.host.querySelector(
              '[aria-label="Adapter billing draft"]',
            )
            draft.value = 'Retained'
            draft.focus()
            comparison.host.querySelector('[data-reorder]').click()
            await comparison.tick()
            compare()
            assert.equal(
              adapterItems()[0].querySelector('[data-slot="trigger"]'),
              triggers[2],
            )
            assert.equal(
              comparison.host.querySelector(
                '[aria-label="Adapter billing draft"]',
              ),
              draft,
            )
            draft.focus()
            assert.equal(window.document.activeElement, draft)
            comparison.host.querySelector('[data-remove]').click()
            await comparison.tick()
            compare()
            assert.equal(draft.value, 'Retained')
            comparison.host.querySelector('[data-disable]').click()
            await comparison.tick()
            compare()
            assert.deepEqual(Array.from(comparison.errors), [])
          } finally {
            comparison.dispose()
          }
        }
      } finally {
        example?.dispose()
      }
    },
  )
})
