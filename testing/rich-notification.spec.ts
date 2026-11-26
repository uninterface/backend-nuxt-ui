import { test, expect } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/rich-notification-browser.ts', import.meta.url),
)

test('rich notification gives its body full width and sizes labels to content', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openFixture(page)
  await page
    .getByRole('button', { name: 'Open report notification', exact: true })
    .click()
  const card = page.locator('.nuxt-notification')
  await expect(card).toBeVisible()
  const list = card.locator('dl')
  const labels = list.locator('dt')
  const geometry = await labels.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect()
      return {
        x: rect.x,
        width: rect.width,
        height: rect.height,
        line: parseFloat(getComputedStyle(node).lineHeight),
      }
    }),
  )
  expect(geometry).toHaveLength(3)
  for (const label of geometry) {
    expect(label.x).toBeCloseTo(geometry[0].x, 0)
    expect(label.height).toBeLessThanOrEqual(label.line + 1)
  }
  expect(await card.locator('[data-slot=description]').count()).toBe(0)

  // Narrow the containing surface while leaving the desktop viewport wide.
  await card.evaluate((node) => {
    ;(node as HTMLElement).style.width = '17rem'
  })
  const firstLabel = await labels.first().boundingBox()
  const firstValue = await list.locator('dd').first().boundingBox()
  expect(firstValue!.y).toBeGreaterThanOrEqual(
    firstLabel!.y + firstLabel!.height,
  )
  expect(firstValue!.x).toBeCloseTo(firstLabel!.x, 0)

  // Long content scrolls inside the card, leaving the header operable.
  await card.evaluate((node) => {
    const body = node.querySelector('.nuxt-notification-content')!
    const long = document.createElement('p')
    long.textContent = 'Long notification content. '.repeat(500)
    body.append(long)
  })
  const content = card.locator('.nuxt-notification-content')
  expect(
    await content.evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true)
  const headerBefore = await card.locator('[data-slot=header]').boundingBox()
  await content.focus()
  await page.keyboard.press('End')
  await expect
    .poll(() => content.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0)
  expect((await card.locator('[data-slot=header]').boundingBox())!.y).toBe(
    headerBefore!.y,
  )
  await card.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(card).toHaveCount(0)
})
