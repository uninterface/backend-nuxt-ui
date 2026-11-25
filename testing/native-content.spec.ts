import { test, expect } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/native-content-browser.ts', import.meta.url),
)

for (const mode of ['light', 'dark']) {
  test(`Nuxt native content preserves toolkit parts and HTML semantics in ${mode} mode`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await openFixture(page)
    await expect(
      page.getByRole('heading', { name: 'Native content' }),
    ).toBeVisible()
    await page.evaluate(
      (value) =>
        document.documentElement.classList.toggle('dark', value === 'dark'),
      mode,
    )
    const native = page.locator('[data-native-copy]')
    for (const [type, expected] of Object.entries({
      '1': 'decimal',
      a: 'lower-alpha',
      A: 'upper-alpha',
      i: 'lower-roman',
      I: 'upper-roman',
    })) {
      await expect(native.locator(`[data-numbering="${type}"]`)).toHaveCSS(
        'list-style-type',
        expected,
      )
    }
    await expect(native.locator('ul')).toHaveCSS('list-style-type', 'disc')
    await expect(native.locator('a')).toHaveCSS(
      'text-decoration-line',
      'underline',
    )
    expect(
      await native
        .locator('p')
        .first()
        .evaluate((element) =>
          parseFloat(getComputedStyle(element).marginBottom),
        ),
    ).toBeGreaterThan(0)
    expect(
      await native
        .locator('pre')
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(1)
    const overrides = page.locator('[data-native-overrides]')
    await expect(overrides.locator('ol')).toHaveCSS('list-style-type', 'disc')
    await expect(overrides.locator('a')).toHaveCSS(
      'text-decoration-line',
      'none',
    )
    await expect(overrides.locator('h2')).toHaveCSS('font-weight', '400')
    const navigation = page.getByRole('navigation', {
      name: 'Content navigation',
    })
    const list = navigation.locator('ul').first()
    await expect(list).toHaveCSS('list-style-type', 'none')
    await expect(list).toHaveCSS('padding-inline-start', '0px')
    await expect(list).toHaveCSS('margin-bottom', '0px')
    await expect(navigation.getByRole('link', { name: 'Overview' })).toHaveCSS(
      'text-decoration-line',
      'none',
    )
    await navigation.getByRole('button', { name: 'More' }).click()
    await expect(
      page.getByRole('menuitem', { name: 'Details', exact: true }),
    ).toHaveCSS('text-decoration-line', 'none')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Validate', exact: true }).click()
    await expect(page.getByText('Enter a name.', { exact: true })).toHaveCSS(
      'margin-bottom',
      '0px',
    )
    await expect(
      page.getByText('Use the recipient name.', { exact: true }),
    ).toHaveCSS('margin-bottom', '0px')
    await page.getByRole('button', { name: 'Open dialog' }).click()
    const dialog = page.getByRole('dialog', { name: 'Native title' })
    await expect(dialog).toBeVisible()
    const titleSize = await dialog
      .locator('[data-slot="title"]')
      .evaluate((element) => ({
        own: getComputedStyle(element).fontSize,
        parent: getComputedStyle(element.parentElement!).fontSize,
      }))
    expect(titleSize.own).toBe(titleSize.parent)
    expect(
      await dialog
        .locator('[data-dialog-heading]')
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBeGreaterThan(parseFloat(titleSize.own))
    await page.keyboard.press('Escape')
  })
}

test('Nuxt native links use the forced-colors focus palette', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await openFixture(page)
  const link = page.locator('[data-native-copy] a')
  await expect(link).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  // Keep forced-color adjustment enabled; resolve Highlight in the same browser.
  const colors = await link.evaluate((element) => {
    const probe = document.createElement('span')
    probe.style.color = 'Highlight'
    document.body.append(probe)
    const result = {
      expected: getComputedStyle(probe).color,
      actual: getComputedStyle(element).outlineColor,
    }
    probe.remove()
    return result
  })
  expect(colors.actual).toBe(colors.expected)
})

test('Nuxt breadcrumbs retain native undecorated links and reset list spacing', async ({
  page,
}) => {
  await openFixture(page)
  const trail = page.getByRole('navigation', {
    name: 'Multi-level trail',
    exact: true,
  })
  const link = trail.getByRole('link', { name: 'Home', exact: true })
  await expect(link).toHaveCSS('text-decoration-line', 'none')
  await link.hover()
  await expect(link).toHaveCSS('text-decoration-line', 'none')
  await link.focus()
  await expect(link).toBeFocused()
  await expect(trail.locator('ol')).toHaveCSS('padding-inline-start', '0px')
  await expect(trail.locator('ol')).toHaveCSS('margin-bottom', '0px')
  // Prose/standalone links retain their ordinary underline.
  await expect(
    page.getByRole('link', { name: 'Example link', exact: true }),
  ).toHaveCSS('text-decoration-line', 'underline')
})
