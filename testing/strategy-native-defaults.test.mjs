import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

test('native theme defaults survive field sizing and editor barriers', async () => {
  await withBuiltDomFixture(
    build,
    new URL('./fixtures/strategy-native-defaults.ts', import.meta.url),
    async ({ mount }) => {
      const example = await mount()
      try {
        const input = (attribute) => {
          const surface = example.host.querySelector(`[${attribute}]`)
          return surface.matches('input')
            ? surface
            : surface.querySelector('input')
        }
        const ordinary = input('data-native-default')
        const blocked = input('data-native-blocked')

        assert.equal(
          ordinary
            .closest('.nuxt-strategy-field')
            .getAttribute('data-orientation'),
          'horizontal',
          'omission preserves configured native label arrangement',
        )
        assert.equal(
          input('data-native-show')
            .closest('.nuxt-strategy-field')
            .getAttribute('data-orientation'),
          'horizontal',
          'show preserves configured native label arrangement',
        )
        assert.ok(
          ordinary
            .closest('.nuxt-strategy-field')
            .classList.contains('text-base'),
        )
        assert.ok(
          ordinary.classList.contains('py-2'),
          'native input defaults retain precedence over field defaults',
        )
        assert.ok(ordinary.classList.contains('text-base/5'))
        assert.ok(
          blocked.closest('.nuxt-strategy-field').classList.contains('text-xs'),
        )
        assert.ok(blocked.classList.contains('py-2'))
        assert.ok(
          blocked.classList.contains('text-base/5'),
          'barrier restores configured native input size',
        )
        assert.ok(
          blocked
            .closest('.nuxt-strategy-field')
            .querySelector('.nuxt-strategy-help')
            .classList.contains('font-semibold'),
          'custom feedback retains native scoped theme slots',
        )
        const checkable = example.host.querySelector('[data-native-checkable]')
        const checkableShow = example.host.querySelector(
          '[data-native-checkable-show]',
        )
        const checkableFallback = example.host.querySelector(
          '[data-native-checkable-fallback]',
        )
        const retained = checkable.querySelector('input')
        for (const orientation of ['horizontal', 'vertical', 'horizontal']) {
          await example.setOrientation(orientation)
          assert.equal(
            ordinary
              .closest('.nuxt-strategy-field')
              .getAttribute('data-orientation'),
            orientation,
          )
          for (const owner of [checkable, checkableShow, checkableFallback])
            assert.equal(
              owner.dataset.uiCheckable,
              orientation === 'horizontal' ? 'control-aligned' : 'flushed',
              'omission, show and unsupported floating resolve reactive native placement before adapt',
            )
          assert.equal(checkable.querySelector('input'), retained)
        }
      } finally {
        example.dispose()
      }
    },
  )
})
