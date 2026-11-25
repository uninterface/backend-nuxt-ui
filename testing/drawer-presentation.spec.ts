import { test, expect, type Locator } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/overlay-regions-browser.ts', import.meta.url),
)

async function expectStableRegionsAcrossBreakpoint(drawer: Locator) {
  const page = drawer.page()
  const viewport = page.viewportSize()!
  const measure = () =>
    drawer.evaluate((node) => {
      const regions = [...node.querySelector('.nuxt-overlay-content')!.children]
      return {
        width: node.getBoundingClientRect().width,
        regions: regions.map((region) => {
          const style = getComputedStyle(region)
          return {
            padding: [
              style.paddingTop,
              style.paddingRight,
              style.paddingBottom,
              style.paddingLeft,
            ],
            contentWidth:
              region.clientWidth -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight),
          }
        }),
      }
    })
  await page.setViewportSize({ width: 700, height: viewport.height })
  const wide = await measure()
  await page.setViewportSize({ width: 600, height: viewport.height })
  const narrow = await measure()
  expect(narrow.width).toBeCloseTo(wide.width, 1)
  expect(narrow.regions).toHaveLength(3)
  narrow.regions.forEach((region, index) => {
    expect(region.padding).toEqual(wide.regions[index].padding)
    expect(region.contentWidth).toBeCloseTo(wide.regions[index].contentWidth, 1)
  })
  await page.setViewportSize(viewport)
}

test('Nuxt modal drawer fades its backdrop and retains modality until exit motion finishes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await openFixture(page)
  const selector = '.nuxt-overlay[data-ui-overlay="drawer"][aria-modal="true"]'
  await page.evaluate((selector) => {
    document.addEventListener('animationstart', (event) => {
      if (
        event.pseudoElement !== '::backdrop' ||
        !(event.target instanceof HTMLElement) ||
        !event.target.matches(selector)
      )
        return
      const fade = event.target
        .getAnimations({ subtree: true })
        .find(
          (animation) =>
            (animation as CSSAnimation).animationName === event.animationName,
        )
      if (!fade) return
      fade.pause()
      fade.currentTime = Number(fade.effect!.getComputedTiming().duration) / 2
    })
  }, selector)
  const trigger = page.getByTestId('open-modal-drawer')
  const drawer = page.locator(selector)
  const backdrop = (phase: 'in' | 'out', finish = false) =>
    drawer.evaluate(
      (node, { phase, finish }) => {
        const fade = node
          .getAnimations({ subtree: true })
          .find(
            (animation) =>
              (animation as CSSAnimation).animationName ===
              `nuxt-drawer-backdrop-${phase}`,
          )
        const paused = fade?.playState === 'paused'
        if (finish) fade?.finish()
        return {
          paused,
          opacity: Number(getComputedStyle(node, '::backdrop').opacity),
        }
      },
      { phase, finish },
    )
  const expectMidpoint = async (phase: 'in' | 'out') => {
    await expect.poll(async () => (await backdrop(phase)).paused).toBe(true)
    const { opacity } = await backdrop(phase)
    expect(opacity).toBeGreaterThan(0)
    expect(opacity).toBeLessThan(1)
  }
  await trigger.click()
  await expectMidpoint('in')
  await backdrop('in', true)
  await expect.poll(async () => (await backdrop('in')).opacity).toBe(1)
  // A content animation can still be running when the drawer closes.
  await drawer
    .getByRole('heading', { name: 'Edit note' })
    .evaluate((node) => node.animate([{ opacity: 1 }, { opacity: 1 }], 10_000))
  await drawer.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expectMidpoint('out')
  await drawer.evaluate(async (node) => {
    // Settle the surface slide with the backdrop still paused at its midpoint.
    await Promise.allSettled(
      node
        .getAnimations()
        .filter((motion) => !(motion.effect as KeyframeEffect)?.pseudoElement)
        .map((motion) => motion.finished),
    )
    await new Promise(requestAnimationFrame)
  })
  await expectMidpoint('out')
  expect(await drawer.evaluate((node) => node.matches(':modal'))).toBe(true)
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden')
  await backdrop('out', true)
  await expect(drawer).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Nuxt drawer mask matches native elevated overlay (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await openFixture(page)
    await page.getByTestId('open-modal-drawer').click()
    const drawer = page.getByRole('dialog', { name: 'Edit note', exact: true })
    await expect(drawer).toBeVisible()
    const matchesNative = () =>
      drawer.evaluate((node) => {
        const reference = document.createElement('span')
        reference.style.background =
          'color-mix(in oklab, var(--ui-bg-elevated) 75%, transparent)'
        node.append(reference)
        const expected = getComputedStyle(reference).backgroundColor
        const actual = getComputedStyle(node, '::backdrop').backgroundColor
        reference.remove()
        return actual === expected
      })
    expect(await matchesNative()).toBe(true)
    await drawer.evaluate((node) => {
      node.style.setProperty('--ui-bg-elevated', 'rgb(20, 60, 100)')
    })
    expect(await matchesNative()).toBe(true)
    await drawer.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(drawer).not.toBeVisible()
  })
}

test('Nuxt reduced-motion drawer skips surface and backdrop animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openFixture(page)
  const trigger = page.getByTestId('open-modal-drawer')
  await trigger.click()
  const drawer = page.getByRole('dialog', { name: 'Edit note', exact: true })
  await expect(drawer).toBeVisible()
  expect(await drawer.evaluate((node) => node.getAnimations().length)).toBe(0)
  expect(
    await drawer.evaluate((node) => {
      const backdrop = getComputedStyle(node, '::backdrop')
      return { animation: backdrop.animationName, opacity: backdrop.opacity }
    }),
  ).toEqual({ animation: 'none', opacity: '1' })
  await expectStableRegionsAcrossBreakpoint(drawer)
  await drawer.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(drawer).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

for (const width of [600, 1000]) {
  for (const direction of ['ltr', 'rtl']) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`Nuxt retained panel keeps its native boundary (${width}px, ${direction}, ${colorScheme})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 })
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
        await openFixture(page)
        await page.evaluate((dir) => {
          document.documentElement.dir = dir
        }, direction)
        const trigger = page.getByTestId('toggle-panel-drawer')
        await trigger.click()
        const panel = page.getByRole('dialog', {
          name: 'Scratchpad',
          exact: true,
        })
        const input = panel.getByRole('textbox', { name: 'Notes', exact: true })
        await input.fill('Retained panel draft')
        if (width === 600 && direction === 'ltr' && colorScheme === 'light')
          await expectStableRegionsAcrossBreakpoint(panel)
        const original = await input.elementHandle()
        await expect(panel).not.toHaveAttribute('aria-modal', 'true')
        for (const edge of ['start', 'end', 'top', 'bottom']) {
          // Exercise all logical attachment styles on the retained surface.
          await panel.evaluate((node, edge) => {
            node.setAttribute('data-edge', edge)
          }, edge)
          const paint = await panel.evaluate((node) => {
            const style = getComputedStyle(node)
            const backdrop = getComputedStyle(node, '::backdrop')
            return {
              ring: style.getPropertyValue('--tw-ring-shadow'),
              shadow: style.boxShadow,
              backdrop: backdrop.backgroundColor,
              pointer: backdrop.pointerEvents,
            }
          })
          expect(paint.ring).toContain('1px')
          expect(paint.shadow).not.toBe('none')
          expect(paint.backdrop).toBe('rgba(0, 0, 0, 0)')
          expect(paint.pointer).toBe('none')
          const box = (await panel.boundingBox())!
          expect(box.x).toBeGreaterThanOrEqual(-1)
          expect(box.y).toBeGreaterThanOrEqual(-1)
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
          expect(box.y + box.height).toBeLessThanOrEqual(845)
        }
        // Application-owned tokens still control the boundary color.
        await panel.evaluate((node) => {
          node.style.setProperty('--ui-border', 'rgb(17, 34, 51)')
        })
        await expect(panel).toHaveCSS('box-shadow', /rgb\(17, 34, 51\)/)
        await panel.getByRole('button', { name: 'Close', exact: true }).click()
        await trigger.click()
        await expect(input).toHaveValue('Retained panel draft')
        expect(
          await input.evaluate((node, original) => node === original, original),
        ).toBe(true)
        await original?.dispose()
      })
    }
  }
}

async function dragNativeHandle(drawer: Locator) {
  const page = drawer.page()
  const handle = drawer.locator('[data-vaul-handle]')
  await expect(handle).toBeVisible()
  await expect(handle).not.toHaveAttribute('data-disabled', '')
  const box = (await handle.boundingBox())!
  const bounds = (await drawer.boundingBox())!
  const direction = await drawer.getAttribute('data-vaul-drawer-direction')
  const vertical = direction === 'top' || direction === 'bottom'
  const sign = direction === 'top' || direction === 'left' ? -1 : 1
  const distance = (vertical ? bounds.height : bounds.width) * 0.4 * sign
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(
    x + (vertical ? 0 : distance),
    y + (vertical ? distance : 0),
    { steps: 10 },
  )
  await page.mouse.up()
}

for (const dir of ['ltr', 'rtl']) {
  test(`Nuxt handle drag preserves dirty confirmation and retained panel drafts (${dir})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFixture(page)
    await page.evaluate((dir) => {
      document.documentElement.dir = dir
    }, dir)
    await page.getByTestId('open-modal-drawer').click()
    const drawer = page.getByRole('dialog', { name: 'Edit note', exact: true })
    const input = drawer.getByRole('textbox', { name: 'Notes', exact: true })
    await input.fill('Draft before dragging')
    const original = await input.elementHandle()
    await dragNativeHandle(drawer)
    const confirmation = page.getByRole('dialog', {
      name: 'Discard changes?',
      exact: true,
    })
    await expect(confirmation).toBeVisible()
    expect(await drawer.evaluate((node) => node.matches(':modal'))).toBe(true)
    await confirmation
      .getByRole('button', { name: 'Keep editing', exact: true })
      .click()
    await expect(confirmation).toBeHidden()
    await expect(input).toHaveValue('Draft before dragging')
    expect(
      await input.evaluate((node, original) => node === original, original),
    ).toBe(true)
    await dragNativeHandle(drawer)
    await expect(confirmation).toBeVisible()
    await confirmation
      .getByRole('button', { name: 'Discard', exact: true })
      .click()
    await expect(drawer).not.toBeVisible()
    await original?.dispose()

    const trigger = page.getByTestId('toggle-panel-drawer')
    await trigger.click()
    const panel = page.getByRole('dialog', { name: 'Scratchpad', exact: true })
    const note = panel.getByRole('textbox', { name: 'Notes', exact: true })
    await note.fill('Retained after dragging')
    await note.press('Tab')
    expect(
      await panel.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(false)
    await dragNativeHandle(panel)
    await expect(panel).not.toBeVisible()
    await trigger.click()
    await expect(note).toHaveValue('Retained after dragging')
    const radii = await panel.evaluate((node) => {
      const style = getComputedStyle(node)
      return [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ].map(parseFloat)
    })
    expect(radii.filter((radius) => radius > 0)).toHaveLength(2)
  })
}
