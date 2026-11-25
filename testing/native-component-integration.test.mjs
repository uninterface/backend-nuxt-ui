import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withBuiltDomFixture } from '@uninterface/testing/jsdom'
import { build } from './fixture-build.mjs'

test('native button variants and indicators follow the declared treatments', () =>
  withBuiltDomFixture(
    build,
    new URL('./fixtures/buttons.ts', import.meta.url),
    async ({ mountButton }) => {
      const treatment = (value) =>
        ({
          filled: 'bg-secondary',
          outline: 'ring',
          soft: 'bg-secondary/10',
          text: 'hover:bg-secondary/10',
          icon: 'hover:bg-secondary/10',
        })[value]
      const strategies = await mountButton({}, { strategy: 'text', icon: true })
      const strategyButton = strategies.host.querySelector('button')
      try {
        assert.ok(strategyButton.classList.contains(treatment('text')))
        await strategies.update({ variant: 'outline' })
        assert.ok(strategyButton.classList.contains(treatment('outline')))
        await strategies.update({ variant: undefined })
        await strategies.updateContent({ strategy: 'soft' })
        assert.ok(strategyButton.classList.contains(treatment('soft')))
      } finally {
        strategies.dispose()
      }
      const example = await mountButton()
      const button = example.host.querySelector('button')
      try {
        for (const color of [
          'primary',
          'success',
          'danger',
          'warning',
          'info',
          'secondary',
        ]) {
          await example.update({ color, variant: 'filled' })
          const nativeColor = color === 'danger' ? 'error' : color
          assert.ok(button.classList.contains(`hover:bg-${nativeColor}/75`))
          assert.ok(button.classList.contains(`active:bg-${nativeColor}/75`))
          assert.equal(
            button.classList.contains(`hover:bg-${nativeColor}/90`),
            false,
          )
        }
      } finally {
        example.dispose()
      }
    },
  ))

test('segmented fields keep native radio slots and field spacing', () =>
  withBuiltDomFixture(
    build,
    new URL('./fixtures/field-alignment.ts', import.meta.url),
    async ({ mountFieldAlignment }) => {
      const fixture = await mountFieldAlignment()
      const field = fixture.host.querySelector(
        '[data-alignment-field=segments]',
      )
      const editor = field.querySelector('[data-uninterface-segmented-select]')
      await fixture.update({ labels: 'show', size: 1, tall: true, help: true })
      try {
        const items = editor.querySelectorAll('[data-slot=item]')
        assert.equal(items.length, 3)
        for (const item of items) {
          assert.ok(item.classList.contains('items-baseline'))
          assert.ok(!item.classList.contains('items-start'))
          assert.ok(item.querySelector('[data-slot=base][role=radio]'))
        }
        const ordinary = fixture.host.querySelector(
          '.nuxt-strategy-field > div:last-child',
        )
        const segmentedContent = field.querySelector(':scope > div:last-child')
        assert.equal(
          segmentedContent.classList.contains('mt-1'),
          ordinary.classList.contains('mt-1'),
        )
        assert.equal(field.classList.contains('space-y-2'), false)
      } finally {
        fixture.dispose()
      }
    },
  ))

test('full height toggles the native fixed-header presentation', () =>
  withBuiltDomFixture(
    build,
    new URL('./fixtures/collection-scrolling.ts', import.meta.url),
    async ({ mountCollectionScrolling }) => {
      const example = await mountCollectionScrolling()
      try {
        for (const [full, horizontal] of [
          [false, false],
          [false, true],
          [true, false],
          [true, true],
          [false, false],
        ]) {
          await example.configure(full, horizontal)
          assert.equal(
            example.host.querySelector('thead').classList.contains('sticky'),
            full,
          )
        }
      } finally {
        example.dispose()
      }
    },
  ))

test('layout density uses the native spacing at each strategy scope', () =>
  withBuiltDomFixture(
    build,
    new URL('./fixtures/layout-density.ts', import.meta.url),
    async ({ mountDensity }) => {
      const expected = [
        'calc(var(--spacing) * 2)',
        'calc(var(--spacing) * 6)',
        'calc(var(--spacing) * 8)',
      ]
      const example = await mountDensity()
      try {
        const root = (name) =>
          example.host.querySelector(`[data-density=${name}]`)
        const spacing = (name, level) => {
          const element = root(name)
          assert.ok(element, name)
          assert.equal(element.style.gap, expected[level + 1], name)
        }

        for (const level of [-1, 1, 0, -1]) {
          await example.update([level])
          for (const name of ['linear', 'flow', 'grid', 'parent', 'nested'])
            spacing(name, level)
          spacing('blocked', 0)
          spacing('reset', 0)
          assert.equal(root('regions').style.gap, '0')
        }
        await example.update([-1, 1])
        for (const name of ['linear', 'flow', 'grid', 'nested'])
          spacing(name, 0)
        await example.update([-1], { depth: 1 })
        for (const name of ['linear', 'flow', 'grid', 'parent'])
          spacing(name, -1)
        spacing('nested', 0)
        await example.update([1], { targets: ['grid-layout'] })
        spacing('grid', 1)
        spacing('linear', 0)
        spacing('flow', 0)
        await example.update([-1], { stopAt: ['layout'] })
        spacing('linear', 0)
        spacing('nested', 0)
        spacing('grid', -1)
        await example.update([])
        for (const name of ['linear', 'flow', 'grid', 'nested'])
          spacing(name, 0)
      } finally {
        example.dispose()
      }
    },
  ))

test('collection footer slots follow the native DOM order', () =>
  withBuiltDomFixture(
    build,
    new URL('./fixtures/collection-footer.ts', import.meta.url),
    async ({ mountCollectionFooter }) => {
      const example = await mountCollectionFooter()
      try {
        const parts = [
          ...example.host.querySelectorAll('#order-footer [data-part]'),
        ]
        assert.deepEqual(
          parts.map((part) => part.dataset.part),
          ['info', 'size', 'paginator', 'jumper'],
        )
      } finally {
        example.dispose()
      }
    },
  ))

test('temporal pickers use their native parts and date format', () =>
  withBuiltDomFixture(
    build,
    new URL('./fixtures/temporal-pickers.ts', import.meta.url),
    async ({ mount }, window) => {
      const demo = await mount()
      const { document } = window
      try {
        const triggers = [
          ...demo.host.querySelectorAll('[data-temporal-trigger]'),
        ]
        const inline = demo.host.querySelector('[data-temporal-inline-time]')
        assert.equal(Boolean(inline), true)
        assert.equal(triggers.length, 2)
        for (const trigger of triggers) {
          assert.ok(
            trigger.closest('[data-slot=leading]'),
            'picker uses the native leading slot',
          )
        }
        await demo.date.field.set('2024-02-15')
        await demo.tick()
        const input = demo.host.querySelector('input[aria-label=Date]')
        if (input) assert.equal(input.value, '02/15/2024')
        else
          assert.ok(
            triggers[0]
              .closest('[data-temporal-native]')
              ?.querySelector('[data-segment=day]'),
            'the toolkit renders the date in its native segmented editor',
          )
      } finally {
        demo.dispose()
      }
    },
  ))

test('table cell alignment uses physical direction after RTL changes', () =>
  withBuiltDomFixture(
    build,
    new URL('./fixtures/table-sizing.ts', import.meta.url),
    async ({ mountSizing }, window) => {
      Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
        get: () => 800,
      })
      const example = await mountSizing()
      try {
        const cells = () => [
          ...example.host.querySelectorAll(
            'table[aria-label="Sized table"] tbody td',
          ),
        ]
        const matches = (cell, align) => cell.style.textAlign === align
        assert.ok(matches(cells()[1], 'right'))
        assert.ok(matches(cells()[2], 'center'))
        example.host.setAttribute('dir', 'rtl')
        example.align.value = 'left'
        await example.flush()
        assert.ok(matches(cells()[1], 'left'))
      } finally {
        example.dispose()
      }
    },
  ))
