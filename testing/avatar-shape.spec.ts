import { expect, test, type Locator } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const fixture = new URL('./fixtures/avatar-shape.ts', import.meta.url)

function hitsCorner(surface: Locator) {
  return surface.evaluate((element) => {
    const { left, top } = element.getBoundingClientRect()
    return element.contains(document.elementFromPoint(left + 4, top + 4))
  })
}

for (const theme of ['default', 'square-corner'] as const) {
  const openFixture = createBrowserFixture(
    (options) =>
      build(
        options,
        theme === 'square-corner'
          ? { ui: { avatar: { slots: { root: 'rounded-none' } } } }
          : undefined,
      ),
    fixture,
  )

  test(`avatar clips fallback and image to its requested shape under the ${theme} theme`, async ({
    page,
  }) => {
    await openFixture(page)
    await page.addStyleTag({ content: ':root { --ui-radius: 9px; }' })
    const round = page.getByRole('img', { name: 'Round avatar' })
    const square = page.getByRole('img', { name: 'Square avatar' })
    const roundSurface = round.locator('[data-slot="root"]')
    const squareSurface = square.locator('[data-slot="root"]')
    if (theme === 'square-corner')
      await expect(roundSurface).toHaveClass(/\brounded-none\b/)

    await expect(round.getByText('RA')).toBeVisible()
    await expect(square.getByText('SA')).toBeVisible()
    await expect(squareSurface).toHaveCSS('border-radius', '9px')
    await expect(roundSurface).toHaveCSS('overflow', 'hidden')
    await expect(squareSurface).toHaveCSS('overflow', 'hidden')
    await expect.poll(() => hitsCorner(roundSurface)).toBe(false)
    await expect.poll(() => hitsCorner(squareSurface)).toBe(true)

    await page.getByRole('button', { name: 'Load portraits' }).click()
    await expect(round.locator('img')).toBeVisible()
    await expect(square.locator('img')).toBeVisible()
    await expect(round.getByText('RA')).toBeHidden()
    await expect(square.getByText('SA')).toBeHidden()
    await expect.poll(() => hitsCorner(roundSurface)).toBe(false)
    await expect.poll(() => hitsCorner(squareSurface)).toBe(true)
  })
}
