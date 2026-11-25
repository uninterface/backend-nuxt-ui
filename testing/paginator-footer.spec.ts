import { test, expect } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/paginator-footer.ts', import.meta.url),
)

test('compact footer pairs the jumper with pagination when it fits', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openFixture(page)
  const footer = page.getByTestId('paginator-footer')
  const paginator = footer.locator('.nuxt-paginator')
  const jumper = footer.locator('.nuxt-paginator-jumper')
  const input = jumper.getByRole('textbox', { name: 'Go to page' })
  await expect(input).toBeEnabled()
  await input.fill('3')
  for (const dir of ['ltr', 'rtl']) {
    await footer.evaluate((element, direction) => {
      element.style.inlineSize = '450px'
      element.setAttribute('dir', direction)
    }, dir)
    await expect(footer).toHaveAttribute('data-compact', '')
    await expect(footer.locator('[data-footer-part="info"]')).toHaveAttribute(
      'data-footer-row',
      '0',
    )
    await expect(footer.locator('[data-footer-part="size"]')).toHaveAttribute(
      'data-footer-row',
      '0',
    )
    await expect(footer.locator('[data-footer-part="jumper"]')).toHaveAttribute(
      'data-footer-row',
      '1',
    )
    await expect(
      footer.locator('[data-footer-part="paginator"]'),
    ).toHaveAttribute('data-footer-row', '1')
    await footer.evaluate((element) => {
      element.style.inlineSize = '320px'
    })
    await expect
      .poll(async () =>
        paginator.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      )
      .toBe(true)
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('3')
  }
  await input.press('Enter')
  await expect(footer).toContainText('11–15 of 137 records')
})
