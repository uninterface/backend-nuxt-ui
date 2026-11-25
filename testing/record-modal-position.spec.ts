import { test, expect, type Locator } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/record-modal-browser.ts', import.meta.url),
)

// Vertical centering is Nuxt's policy; horizontal centering follows shared modal allocation.
async function expectCentered(dialog: Locator) {
  await expect(dialog).toBeVisible()
  await expect
    .poll(() =>
      dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return Math.max(
          Math.abs(rect.x + rect.width / 2 - innerWidth / 2),
          Math.abs(rect.y + rect.height / 2 - innerHeight / 2),
        )
      }),
    )
    .toBeLessThan(2)
}

async function expectStable(dialog: Locator, action: () => Promise<void>) {
  const page = dialog.page()
  // Sample during mounting/positioning/exit as well as after settling:
  // checking only the final rectangle misses a transient shake.
  const monitor = await dialog.evaluateHandle((element) => {
    const samples: number[][] = []
    let frame = 0
    function sample() {
      const box = element.getBoundingClientRect()
      samples.push([box.x, box.y, box.width, box.height])
      frame = requestAnimationFrame(sample)
    }
    sample()
    return {
      stop() {
        cancelAnimationFrame(frame)
        return samples
      },
    }
  })
  try {
    await action()
    await page.waitForTimeout(350)
    const samples = await monitor.evaluate((value) => value.stop())
    for (const sample of samples) {
      sample.forEach((value, index) =>
        expect(Math.abs(value - samples[0][index])).toBeLessThan(0.25),
      )
    }
  } finally {
    await monitor.evaluate((value) => value.stop())
    await monitor.dispose()
  }
}

for (const width of [1280, 390]) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Nuxt modal stays centered at ${width}px in ${direction}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 720 })
      await openFixture(page)
      await page.evaluate((dir) => {
        document.documentElement.dir = dir
      }, direction)
      const opener = page.getByRole('button', {
        name: 'Edit record',
        exact: true,
      })
      const dialog = page.getByRole('dialog', {
        name: 'Record dialog',
        exact: true,
      })
      await opener.click()
      await expectCentered(dialog)
      await page.evaluate(() => document.fonts.ready)
      await dialog
        .locator(':scope > [data-slot="content"]')
        .evaluate(async (element) => {
          await Promise.allSettled(
            element.getAnimations().map((animation) => animation.finished),
          )
        })
      // This modal has action/footer regions as well as the owned selector.
      const category = dialog.getByRole('combobox')
      await category.focus()
      await expectStable(dialog, async () => {
        await page.keyboard.press('ArrowDown')
        await expect(dialog.getByRole('listbox')).toBeVisible()
      })
      await expectStable(dialog, async () => {
        await page.keyboard.press('Escape')
        await expect(dialog.getByRole('listbox')).toHaveCount(0)
        await expect(category).toBeFocused()
      })
      await page
        .getByRole('textbox', { name: 'Name', exact: true })
        .fill('Draft')
      await dialog.getByRole('button', { name: 'Close', exact: true }).click()
      const confirmation = page.getByRole('dialog', {
        name: 'Discard changes?',
        exact: true,
      })
      await expectCentered(confirmation)
      await confirmation
        .getByRole('button', { name: 'Discard', exact: true })
        .click()
      await expect(dialog).toHaveCount(0)
      await opener.click()
      await expectCentered(dialog)
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      await expect(dialog).toHaveCount(0)
      await page
        .getByRole('button', { name: 'Read long content', exact: true })
        .click()
      const longDialog = page.getByRole('dialog', {
        name: 'Read long content',
        exact: true,
      })
      await expectCentered(longDialog)
      await expect(
        longDialog.getByRole('button', { name: 'Done', exact: true }),
      ).toBeInViewport()
    })
  }
}
