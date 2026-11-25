import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'
import { test, expect } from '@playwright/test'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/temporal-browser.ts', import.meta.url),
)

test('shared temporal frames own error and focus highlights for native range editors', async ({
  page,
}) => {
  await openFixture(page)
  for (const kind of ['date', 'time', 'datetime']) {
    const range = page.locator(`[data-range=${kind}]`)
    const target = range
      .locator(kind === 'time' ? '[data-segment=minute]' : '[data-segment=day]')
      .first()
    await target.focus()
    await target.press('Backspace')
    await target.press('Backspace')
    await page.getByLabel('Password', { exact: true }).focus()
    const frame = range.locator('[data-ui-input-frame]')
    await expect(frame).toHaveAttribute('aria-invalid', 'true')
    const bases = range.locator(
      '[data-ui-control-frame=parent][data-slot=base]',
    )
    await expect(bases).toHaveCount(1)
    for (const base of await bases.all()) {
      expect(await base.evaluate((el) => getComputedStyle(el).boxShadow)).toBe(
        'none',
      )
    }
    await target.focus()
    await expect(frame).toHaveAttribute('data-focused', '')
    expect(
      await bases.first().evaluate((el) => getComputedStyle(el).boxShadow),
    ).toBe('none')
    expect(
      await frame.evaluate((el) => getComputedStyle(el).boxShadow),
    ).not.toBe('none')
    if (kind !== 'time') {
      expect(
        await target.evaluate((el) => getComputedStyle(el).backgroundColor),
      ).not.toBe('rgba(0, 0, 0, 0)')
    }
  }
})

test('range modes retain both endpoint positions and explain next-day icons', async ({
  page,
}) => {
  await openFixture(page)
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const kind of ['date', 'time', 'datetime']) {
      const range = page.locator(`[data-range=${kind}]`)
      for (const [name, count] of [
        ['Start only', 1],
        ['End only', 1],
        ['Unrestricted', 2],
      ] as const) {
        await range.locator('[data-temporal-mode]').click()
        const item = page.getByRole('menuitemcheckbox', { name, exact: true })
        await expect(item.locator('[data-temporal-mode-icon]')).toBeVisible()
        await item.click()
        await expect(range.locator('[data-temporal-infinity]')).toHaveCount(
          count,
        )
        const separator = range.locator('[data-temporal-separator]')
        await expect(separator).toBeVisible()
        const start = await range
          .locator('[data-temporal-side=start]')
          .boundingBox()
        const end = await range
          .locator('[data-temporal-side=end]')
          .boundingBox()
        const dash = await separator.boundingBox()
        if (kind === 'datetime' && width === 390) {
          expect(end!.y).toBeGreaterThanOrEqual(start!.y + start!.height)
          expect(Math.abs(start!.x - end!.x)).toBeLessThan(2)
        } else {
          expect(start!.x + start!.width).toBeLessThanOrEqual(dash!.x + 1)
          expect(
            Math.abs(start!.y + start!.height / 2 - end!.y - end!.height / 2),
          ).toBeLessThan(2)
        }
        expect(dash!.x + dash!.width).toBeLessThanOrEqual(end!.x + 1)
        for (const badge of await range
          .locator('[data-temporal-infinity]')
          .all()) {
          const badgeWidth = await badge.evaluate(
            (el) => el.getBoundingClientRect().width,
          )
          const endpointWidth = await badge.evaluate(
            (el) => el.parentElement!.getBoundingClientRect().width,
          )
          expect(Math.abs(endpointWidth - badgeWidth)).toBeLessThan(2)
        }
        const spacer = await range
          .locator('.nuxt-ui-temporal-spacer')
          .boundingBox()
        expect(spacer!.x).toBeGreaterThanOrEqual(end!.x + end!.width)
        const frame = await range.locator('[data-ui-input-frame]').boundingBox()
        expect(frame!.x + frame!.width).toBeLessThanOrEqual(width)
      }
      await range.locator('[data-temporal-mode]').click()
      await page
        .getByRole('menuitemcheckbox', { name: 'Both boundaries', exact: true })
        .click()
      await expect(range.locator('[data-temporal-native-range]')).toBeVisible()
    }
  }
  const nextDay = page.locator('[data-range=time] [data-temporal-next-day]')
  await expect(nextDay).toHaveAccessibleName('Next day')
  await expect(nextDay.locator('svg')).toBeVisible()
  await nextDay.hover()
  await expect(nextDay).toHaveAttribute('aria-describedby', /.+/)
  const description = page.locator(
    `[id="${await nextDay.getAttribute('aria-describedby')}"]`,
  )
  await expect(description).toHaveText('Next day')
  // Reka separates its hidden description from the visible popup panel.
  const popup = description.locator('xpath=..')
  await expect(popup).toHaveAttribute('data-slot', 'content')
  await expect(popup.locator('[data-slot=text]')).toBeVisible()
  await expect(popup.locator('[data-slot=text]')).toHaveText('Next day')
})

test('datetime range reflows at container width without losing native draft or focus', async ({
  page,
}) => {
  await openFixture(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  const section = page.locator('[data-range=datetime]')
  const base = section.locator('[data-temporal-native-range]')
  const start = base.locator(
    '[data-reka-date-range-field-segment-type=start][role=spinbutton]',
  )
  const end = base.locator(
    '[data-reka-date-range-field-segment-type=end][role=spinbutton]',
  )
  const target = base.locator(
    '[data-reka-date-range-field-segment-type=end][data-segment=minute]',
  )
  await target.focus()
  await target.press('Backspace')
  await target.press('Backspace')
  const handle = await target.elementHandle()
  await expect(target).toHaveAttribute('data-placeholder', '')
  // Narrow allocation in a desktop viewport exercises the container decision.
  await section.evaluate((el) => {
    el.style.width = '340px'
  })
  await expect(base).toHaveCSS('display', 'grid')
  const rowY = async (targets: typeof start) =>
    Promise.all(
      (await targets.all()).map(async (el) => (await el.boundingBox())!.y),
    )
  const firstRow = await rowY(start)
  const secondRow = await rowY(end)
  expect(Math.max(...firstRow) - Math.min(...firstRow)).toBeLessThan(2)
  expect(Math.max(...secondRow) - Math.min(...secondRow)).toBeLessThan(2)
  expect(Math.min(...secondRow)).toBeGreaterThan(Math.max(...firstRow))
  await expect(target).toBeFocused()
  expect(await target.evaluate((el, original) => el === original, handle)).toBe(
    true,
  )
  await start.last().focus()
  await start.last().press('ArrowRight')
  await expect(end.first()).toBeFocused()
  await end.first().press('ArrowLeft')
  await expect(start.last()).toBeFocused()
  const frame = section.locator('[data-ui-input-frame]')
  const height = (await frame.boundingBox())!.height
  for (const name of [
    'Start only',
    'End only',
    'Unrestricted',
    'Both boundaries',
  ]) {
    await section.locator('[data-temporal-mode]').click()
    await page.getByRole('menuitemcheckbox', { name, exact: true }).click()
    // Native menu exit restores trigger focus asynchronously. Finish that
    // interaction before the next mode change or the independent reflow check.
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(section.locator('[data-temporal-mode]')).toBeFocused()
    expect(Math.abs((await frame.boundingBox())!.height - height)).toBeLessThan(
      2,
    )
  }
  await expect(target).toHaveAttribute('data-placeholder', '')
  const restoredHandle = await target.elementHandle()
  await target.focus()
  await section.evaluate((el) => {
    el.style.width = ''
  })
  await expect(base).not.toHaveCSS('display', 'grid')
  await expect(target).toBeFocused()
  expect(
    await target.evaluate((el, original) => el === original, restoredHandle),
  ).toBe(true)
  await expect(target).toHaveAttribute('data-placeholder', '')
  await expect(section.locator('[data-temporal-trigger]')).toBeVisible()
})
