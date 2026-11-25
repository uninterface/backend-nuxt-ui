import { test, expect } from '@playwright/test'
import type { hydrateTable } from './fixtures/table-ssr'
import { buildNativeTableFixture } from './table-ssr-fixture'

type NativeTablePage = Window & {
  nativeTable: Awaited<ReturnType<typeof hydrateTable>>
}

test('native table caption stays visually hidden through hydration and name changes', async ({
  browser,
}) => {
  test.setTimeout(300_000)
  const fixture = await buildNativeTableFixture()
  try {
    const { open } = fixture
    for (const entry of ['table', 'collection'] as const)
      for (const empty of [false, true]) {
        const page = await browser.newPage({
          viewport: { width: 1200, height: 800 },
        })
        try {
          const caption = page.locator('table > caption')
          const expectHiddenCaption = async (name: string) => {
            await expect(caption).toHaveText(name)
            await expect(
              page.getByRole('table', { name, exact: true }),
            ).toHaveCount(1)
            await expect(caption).toHaveCSS('position', 'absolute')
            const bounds = await caption.boundingBox()
            expect(bounds?.width).toBeLessThanOrEqual(1)
            expect(bounds?.height).toBeLessThanOrEqual(1)
          }
          await open(page, { entry, empty, idPrefix: 'native-caption' }, () =>
            expectHiddenCaption('SSR records'),
          )
          await expectHiddenCaption('SSR records')
          await page.evaluate(() =>
            (window as unknown as NativeTablePage).nativeTable.rename(
              'Updated records',
            ),
          )
          await expectHiddenCaption('Updated records')
        } finally {
          await page.close()
        }
      }
  } finally {
    await fixture.dispose()
  }
})
