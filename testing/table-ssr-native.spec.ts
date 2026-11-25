import { test, expect, type Page } from '@playwright/test'
import { runTableSsrBaseline } from '../../../tests/table-ssr-baseline.mjs'

test('native table caption stays visually hidden through hydration and name changes', async ({
  browser,
}) => {
  test.setTimeout(300_000)
  const { failures } = await runTableSsrBaseline({
    browser,
    heights: [undefined],
    async inspectServer(page: Page, record) {
      record.checks.serverCaptionHidden = await page
        .locator('table > caption')
        .evaluate((caption) => {
          const rect = caption.getBoundingClientRect()
          return (
            caption.textContent.trim() === 'SSR records' &&
            getComputedStyle(caption).position === 'absolute' &&
            rect.width <= 1 &&
            rect.height <= 1
          )
        })
    },
    async inspectHydration(page: Page, record) {
      record.checks.reactiveCaption =
        (await page.locator('table > caption').textContent()) ===
        'Updated records'
    },
  })
  expect(failures).toEqual([])
})
