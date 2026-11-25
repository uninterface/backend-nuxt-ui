import { test, expect, type Locator } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/collapsible-browser.ts', import.meta.url),
)

async function presentation(group: Locator) {
  return group.locator('[data-slot="item"]').evaluateAll((items) =>
    items.map((item) => {
      const trigger = item.querySelector<HTMLElement>('[data-slot="trigger"]')!
      const label = item.querySelector<HTMLElement>('[data-slot="label"]')!
      const body = item.querySelector<HTMLElement>('[data-slot="body"]')!
      const text = getComputedStyle(trigger)
      const labelStyle = getComputedStyle(label)
      const boundary = getComputedStyle(item)
      const content = getComputedStyle(body)
      const rect = item.getBoundingClientRect()
      return {
        weight: text.fontWeight,
        labelWeight: labelStyle.fontWeight,
        family: text.fontFamily,
        labelFamily: labelStyle.fontFamily,
        size: text.fontSize,
        lineHeight: text.lineHeight,
        paddingTop: text.paddingTop,
        paddingBottom: text.paddingBottom,
        focusWidth: text.outlineWidth,
        focusColor: text.outlineColor,
        border: boundary.borderBottomWidth,
        borderColor: boundary.borderBottomColor,
        bodySize: content.fontSize,
        bodyPadding: content.paddingBottom,
        height: rect.height,
        gapBefore: item.previousElementSibling
          ? rect.top -
            item.previousElementSibling.getBoundingClientRect().bottom
          : 0,
      }
    }),
  )
}

for (const width of [1100, 390]) {
  for (const direction of ['ltr', 'rtl']) {
    for (const mode of ['light', 'dark']) {
      test(`Nuxt adjacent collapsibles align with native accordion at ${width}px ${direction} ${mode}`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 })
        await openFixture(page)
        const native = page.locator('[data-native-group]')
        const adapter = page.locator('[data-adapter-group]')
        await expect(adapter.locator('[data-slot="trigger"]')).toHaveCount(3)
        await page.evaluate(() => document.fonts.ready)
        await page.evaluate(
          ({ direction, mode }) => {
            document.documentElement.dir = direction
            document.documentElement.classList.toggle('dark', mode === 'dark')
          },
          { direction, mode },
        )
        const compare = async () => {
          await expect
            .poll(() =>
              page
                .locator('[data-native-group], [data-adapter-group]')
                .evaluateAll(
                  (groups) =>
                    groups
                      .flatMap((group) =>
                        group.getAnimations({ subtree: true }),
                      )
                      .filter((animation) => animation.playState === 'running')
                      .length,
                ),
            )
            .toBe(0)
          await expect
            .poll(async () => presentation(adapter))
            .toEqual(await presentation(native))
          for (const item of await presentation(adapter)) {
            expect(item.weight).toBe('500')
            expect(item.labelWeight).toBe('500')
            expect(item.gapBefore).toBe(0)
          }
          const items = await presentation(adapter)
          expect(items.at(-1)!.border).toBe('0px')
          for (const item of items.slice(0, -1)) expect(item.border).toBe('1px')
        }
        await compare()
        for (const index of [0, 1, 2]) {
          await native.locator('[data-slot="trigger"]').nth(index).click()
          await adapter.locator('[data-slot="trigger"]').nth(index).click()
          // Compare after both native transitions settle, without pointer focus.
          await page.locator('[data-reorder]').focus()
          await compare()
        }
        const draft = adapter.getByRole('textbox', {
          name: 'Adapter billing draft',
        })
        await draft.fill('Retained draft')
        await page.locator('[data-reorder]').click()
        await compare()
        await expect(draft).toHaveValue('Retained draft')
        await page.locator('[data-remove]').click()
        await expect(adapter.locator('[data-slot="trigger"]')).toHaveCount(2)
        await compare()
        await page.locator('[data-disable]').click()
        await expect(
          adapter.locator('[data-slot="trigger"]').first(),
        ).toBeDisabled()
        await compare()
        await testInfo.attach('native-and-adapter', {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        })
      })
    }
  }
}
