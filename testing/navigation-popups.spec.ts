import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'
import { test, expect } from '@playwright/test'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/navigation-popups-browser.ts', import.meta.url),
)

for (const mode of ['horizontal', 'vertical-popup', 'icon-popup']) {
  test(`Nuxt ${mode} dismisses and navigates without reactive errors`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning')
        errors.push(message.text())
    })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await openFixture(page, { mode })
    const preview = page.getByTestId('navigation-preview')
    const trigger = preview.locator('[data-entry-key="destinations"]')
    const content = page.getByTestId('navigation-content')
    const clickTrigger = async () => {
      if (
        mode === 'horizontal' &&
        (await trigger.getAttribute('aria-expanded')) === 'true'
      ) {
        // Reka ignores clicks for 300ms after pointermove opens a trigger.
        // Settle that native hover guard, then click without another move.
        await trigger.hover()
        await page.waitForTimeout(350)
        await page.mouse.down()
        await page.mouse.up()
      } else await trigger.click()
    }
    await clickTrigger()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await clickTrigger()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await clickTrigger()
    await page.locator('[data-entry-key="allDestinations"]:visible').click()
    await expect(content.getByRole('heading', { level: 3 })).toHaveText(
      'All destinations',
    )
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await clickTrigger()
    const asia = page.locator('[data-entry-key="asia"]:visible')
    const singapore = page.locator('[data-entry-key="singapore"]:visible')
    await asia.hover()
    await expect(singapore).toBeVisible()
    // Move across the real popup boundaries, including Reka's pointer-grace
    // region. Dwell beyond both the navbar close and submenu grace timers.
    const childBox = await singapore.boundingBox()
    const parentBox = await asia.boundingBox()
    expect(childBox).not.toBeNull()
    expect(parentBox).not.toBeNull()
    const child = {
      x: childBox!.x + childBox!.width / 2,
      y: childBox!.y + childBox!.height / 2,
    }
    const parent = {
      x: parentBox!.x + parentBox!.width / 2,
      y: parentBox!.y + parentBox!.height / 2,
    }
    for (let visit = 0; visit < 2; visit++) {
      await page.mouse.move(child.x, child.y, { steps: 16 })
      await page.waitForTimeout(350)
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(singapore).toBeVisible()
      if (visit === 0) {
        await page.mouse.move(parent.x, parent.y, { steps: 16 })
        await page.waitForTimeout(350)
        await expect(trigger).toHaveAttribute('aria-expanded', 'true')
        await expect(singapore).toBeVisible()
      }
    }
    await singapore.click()
    await expect(content.getByRole('heading', { level: 3 })).toHaveText(
      'Singapore',
    )
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await clickTrigger()
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await clickTrigger()
    await content.getByRole('heading', { level: 3 }).click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await page.mouse.move(0, 0)
    await expect(page.locator('[role="menu"]:visible')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
