import { test, expect } from '@playwright/test'
import { createUiTest } from '@uninterface/testing/playwright'
import type { Locator, Page } from '@playwright/test'
import { uiTestAdapter } from './index'
import type { mount as mountProgress } from './fixtures/progress-bar'
import type { mount as mountSurfaces } from './fixtures/disabled-surfaces'
import { build } from './fixture-build.mjs'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import type { send } from './fixtures/feedback-actions'

const openProgress = createBrowserFixture(
  build,
  new URL('./fixtures/progress-bar.ts', import.meta.url),
)
const openSurfaces = createBrowserFixture(
  build,
  new URL('./fixtures/disabled-surfaces.ts', import.meta.url),
)
const openFeedback = createBrowserFixture(
  build,
  new URL('./fixtures/feedback-actions.ts', import.meta.url),
)
const openSuggestions = createBrowserFixture(
  build,
  new URL('./fixtures/suggestions.ts', import.meta.url),
)

type ProgressPage = Window & {
  Fixture: { mount: typeof mountProgress }
  fixture: Awaited<ReturnType<typeof mountProgress>>
}
type SurfacesPage = Window & {
  Fixture: { mount: typeof mountSurfaces }
  fixture: Awaited<ReturnType<typeof mountSurfaces>>
}

test('suggestion empty state uses Nuxt padding without an empty list gap', async ({
  page,
}) => {
  await openSuggestions(page)
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
  await openSuggestions(page)
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
  await openProgress(page)
  await page.evaluate(async () => {
    const surface = window as unknown as ProgressPage
    surface.fixture = await surface.Fixture.mount()
  })
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
  await openSurfaces(page)
  await page.evaluate(async () => {
    const surface = window as unknown as SurfacesPage
    surface.fixture = await surface.Fixture.mount()
  })
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
  await openSurfaces(page)
  await page.evaluate(async () => {
    const surface = window as unknown as SurfacesPage
    surface.fixture = await surface.Fixture.mount()
  })
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
  await openFeedback(page)
  for (const kind of ['toast', 'notification'] as const) {
    await page.evaluate((kind) => {
      return (
        window as unknown as { Fixture: { send: typeof send } }
      ).Fixture.send(kind)
    }, kind)
    await expect(page.locator('[data-ui-footer-actions]')).toHaveCSS(
      'flex-direction',
      'row',
    )
  }
})

/** Report actual surface paint after the fixture's normal focus transition. */
function measureSurfacePaint(surface: Locator) {
  return surface.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      tag: element.tagName,
      classes: element.className,
      backgroundColor: style.backgroundColor,
      color: style.color,
      borderColor: style.borderColor,
      opacity: style.opacity,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
    }
  })
}
