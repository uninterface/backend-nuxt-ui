import { test, expect, type Locator } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/segmented-alignment.ts', import.meta.url),
)

function firstTextLineCenter(text: Locator) {
  return text.evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    // A wrapped label contributes a separate text rectangle for each line.
    const firstLine = [...range.getClientRects()].find((rect) => rect.width > 0)
    if (!firstLine) throw new Error(`No rendered text in ${element.outerHTML}`)
    return firstLine.top + firstLine.height / 2
  })
}

test('Nuxt beside segmented label follows the first caption row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1800, height: 1000 })
  await openFixture(page)
  await page.waitForFunction(() => Boolean((window as any).fieldAlignment))
  const field = page.locator('[data-alignment-field=segments]')
  const label = field.locator(':scope > [data-slot=wrapper] [data-slot=label]')
  const caption = field
    .locator(
      '[data-uninterface-segmented-select] [data-slot=item] [data-slot=label]',
    )
    .first()
  for (const direction of ['ltr', 'rtl']) {
    await page.evaluate((dir) => {
      document.documentElement.dir = dir
    }, direction)
    for (const size of [-1, 0, 1]) {
      for (const tall of [false, true]) {
        for (const help of [false, true]) {
          await page.evaluate(
            (options) => (window as any).fieldAlignment.update(options),
            { labels: 'beside', size, tall, help },
          )
          const [labelCenter, captionCenter] = await Promise.all([
            firstTextLineCenter(label),
            firstTextLineCenter(caption),
          ])
          expect(
            Math.abs(labelCenter - captionCenter),
            `${direction}, size ${size}, tall ${tall}, help ${help}`,
          ).toBeLessThanOrEqual(2)
        }
      }
    }
  }
})
