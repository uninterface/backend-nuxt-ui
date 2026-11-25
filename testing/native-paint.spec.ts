import { test, expect } from '@playwright/test'
import { createUiTest } from '@uninterface/testing/playwright'
import type { Locator, Page } from '@playwright/test'
import { uiTestAdapter } from './index'
import type { mount as mountProgress } from '../../../tests/fixtures/progress-bar'
import type { mount as mountSurfaces } from '../../../tests/fixtures/disabled-surfaces'
import { build } from './fixture-build.mjs'
import {
  openPresentationFixture,
  measureSurfacePaint,
} from '../../../tests/presentation-browser-fixture.mjs'

type ProgressPage = Window & {
  fixture: Awaited<ReturnType<typeof mountProgress>>
}
type SurfacesPage = Window & {
  fixture: Awaited<ReturnType<typeof mountSurfaces>>
}

test('suggestion empty state uses Nuxt padding without an empty list gap', async ({
  page,
}) => {
  await page.goto('/#/features/examples/search')
  await page
    .getByRole('combobox', { name: 'Suggested name', exact: true })
    .fill('zzz')
  const status = page.getByRole('status').filter({ hasText: 'No matches.' })
  await expect(status).toBeVisible()
  const layout = await status.evaluate((node) => {
    const popup = node.closest('.nuxt-ui-suggestions')!
    const style = getComputedStyle(node)
    return {
      topGap:
        node.getBoundingClientRect().top - popup.getBoundingClientRect().top,
      padding: [
        style.paddingInlineStart,
        style.paddingInlineEnd,
        style.paddingBlockStart,
        style.paddingBlockEnd,
      ].map(Number.parseFloat),
      alignment: style.textAlign,
    }
  })
  expect(layout.topGap).toBeLessThan(1)
  expect(Math.min(...layout.padding)).toBeGreaterThan(0)
  expect(layout.alignment).toBe('center')
})

test('highlighting adds no gap inside suggestion labels', async ({ page }) => {
  await page.goto('/#/features/examples/search')
  await page
    .getByRole('combobox', { name: 'Suggested name', exact: true })
    .fill('Oak Ridg')
  const option = page.getByRole('option', { name: 'Oak Ridge', exact: true })
  const match = option.locator('mark')
  await expect(match).toHaveText('Oak Ridg')
  const gap = await match.evaluate((mark) => {
    const range = mark.ownerDocument.createRange()
    range.setStartAfter(mark)
    range.setEndAfter(mark.parentNode!.lastChild!)
    return (
      range.getBoundingClientRect().left - mark.getBoundingClientRect().right
    )
  })
  expect(Math.abs(gap)).toBeLessThan(1)
})

test('progress colors use the native semantic palette', async ({ page }) => {
  await openPresentationFixture(
    page,
    build,
    new URL('../../../tests/fixtures/progress-bar.ts', import.meta.url),
    'ProgressBars',
  )
  const ui = createUiTest(page, uiTestAdapter)
  const bar = page.locator('#standalone')
  for (const color of [
    'primary',
    'success',
    'danger',
    'warning',
    'info',
    'secondary',
  ] as const) {
    await page.evaluate(async (color) => {
      const { fixture } = window as unknown as ProgressPage
      fixture.color.value = color
      await fixture.tick()
    }, color)
    const token = '--ui-' + (color === 'danger' ? 'error' : color)
    const expected = await bar.evaluate(
      (root, cssColor) => {
        const sample = document.createElement('span')
        sample.style.backgroundColor = cssColor
        root.append(sample)
        const paint = getComputedStyle(sample).backgroundColor
        sample.remove()
        return paint
      },
      'var(' + token + ')',
    )
    expect(
      await ui
        .progressBar(bar)
        .fill.evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe(expected)
  }
})

async function focusedPaint(
  page: Page,
  name: 'frame' | 'upload',
  surface: Locator,
) {
  expect(
    await page.evaluate(
      (name) => (window as unknown as SurfacesPage).fixture.focus(name),
      name,
    ),
  ).toBe(true)
  await page.evaluate(async () => {
    await (window as unknown as SurfacesPage).fixture.flush()
    for (const animation of document.getAnimations())
      if (Number.isFinite(animation.effect?.getComputedTiming().endTime))
        animation.finish()
  })
  return measureSurfacePaint(surface)
}

test('upload and input frame use coordinated native focus paint', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPresentationFixture(
    page,
    build,
    new URL('../../../tests/fixtures/disabled-surfaces.ts', import.meta.url),
    'Surfaces',
  )
  const ui = createUiTest(page, uiTestAdapter)
  const frameRoot = page.locator('[data-surface=frame] [data-ui-input-frame]')
  const uploadRoot = page.locator(
    '[data-surface=upload] [data-ui-upload-region]',
  )
  const frameSurface = ui.inputFrame(frameRoot).surface
  for (const mode of ['light', 'dark'] as const)
    for (const retained of [false, true]) {
      await page.evaluate(
        async ({ mode, retained }) => {
          const { fixture } = window as unknown as SurfacesPage
          fixture.mode(mode)
          await fixture.retained(retained)
        },
        { mode, retained },
      )
      const frame = await focusedPaint(page, 'frame', frameSurface)
      const upload = await focusedPaint(
        page,
        'upload',
        (await ui.uploadRegion(uploadRoot)).surface,
      )
      for (const key of [
        'outlineColor',
        'outlineWidth',
        'outlineStyle',
        'outlineOffset',
      ] as const)
        expect(upload[key]).toBe(frame[key])
    }
})

test('native upload chooser switches its focus treatment during recovery', async ({
  page,
}) => {
  await openPresentationFixture(
    page,
    build,
    new URL('../../../tests/fixtures/disabled-surfaces.ts', import.meta.url),
    'Surfaces',
  )
  const host = page.locator('[data-surface=upload]')
  const region = host.locator('[data-ui-upload-region]')
  const ui = createUiTest(page, uiTestAdapter)
  for (const mode of ['light', 'dark'] as const)
    for (const recovery of [false, true]) {
      await page.evaluate(
        async ({ mode, recovery }) => {
          const { fixture } = window as unknown as SurfacesPage
          fixture.mode(mode)
          await fixture.retained(false)
          if (recovery) await fixture.reject()
        },
        { mode, recovery },
      )
      const { chooser } = await ui.uploadRegion(region)
      await host.locator('[data-before]').focus()
      await page.keyboard.press('Tab')
      await expect(chooser).toBeFocused()
      if (recovery) {
        await expect(chooser).toHaveCSS('outline-style', 'solid')
      } else {
        await expect(chooser).toHaveCSS('outline-style', 'none')
        await expect(region).toHaveAttribute('data-upload-phase', 'ready')
        expect(
          await region.evaluate((node) => node.matches(':focus-within')),
        ).toBe(true)
        await expect(region).toHaveCSS('outline-style', 'solid')
      }
      await page.emulateMedia({ forcedColors: 'active' })
      await expect(recovery ? chooser : region).toHaveCSS(
        'outline-style',
        'solid',
      )
      await page.emulateMedia({ forcedColors: 'none' })
    }
})

test('feedback footer uses its native action direction', async ({ page }) => {
  await page.goto('/tests/fixtures/floating-feedback.html')
  for (const kind of ['toast', 'notification'] as const) {
    await page.evaluate(async (kind) => {
      window.floating.dispose()
      window.floating = await window.mountFloatingFeedback(
        { duration: null },
        kind,
      )
      window.floating.route.send({
        message: 'Action check',
        actions: [
          { key: 'first', label: 'First' },
          { key: 'next', label: 'Next' },
        ],
      })
    }, kind)
    await expect(page.locator('[data-ui-footer-actions]')).toHaveCSS(
      'flex-direction',
      'row',
    )
  }
})
