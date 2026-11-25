import { expect, test, type Page } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import {
  createUiTest,
  expectContainedFocusPaint,
  waitForPresentation,
} from '@uninterface/testing/playwright'
import { build } from './fixture-build.mjs'
import { uiTestAdapter } from './index'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/native-conformance.ts', import.meta.url),
)
const uiTest = (page: Page) => createUiTest(page, uiTestAdapter)

test('Nuxt UI paints inset focus on each native radio item', async ({
  page,
}) => {
  await openFixture(page, { scenario: 'segmented-focus' })
  const group = uiTest(page).radioGroup({ name: 'Choices' })
  await expect(group.option('one')).toBeChecked()
  await page.keyboard.press('Tab')
  for (const key of ['one', 'two', 'three']) {
    const option = group.option(key)
    // Programmatic focus exercises unselected paint without changing the selection.
    await option.focus()
    await expect(option).toBeFocused()
    await expectContainedFocusPaint({
      target: option.locator('xpath=ancestor::*[@data-slot="item"][1]'),
      kind: 'outline',
      inset: true,
    })
  }
})

test('Nuxt UI command menu retains native grouping and focus highlighting', async ({
  page,
}) => {
  await openFixture(page, { scenario: 'commands' })
  await page.getByRole('button', { name: 'Open commands' }).click()
  const menu = page.getByRole('menu', { name: 'Commands', exact: true })
  const group = menu.locator('[data-slot="group"]')
  const copy = group.getByRole('menuitemcheckbox', {
    name: 'Copy',
    exact: true,
  })
  await expect(copy).toBeVisible()
  await copy.focus()
  await expect(copy).toHaveAttribute('data-highlighted', '')
})

test('Nuxt UI pointer-opened command submenu preserves keyboard entry and return', async ({
  page,
}) => {
  await openFixture(page, { scenario: 'commands' })
  await page.getByRole('button', { name: 'Open commands' }).click()
  const more = page.getByRole('menuitem', { name: 'More actions', exact: true })
  await more.click()
  const archive = page.getByRole('menuitem', { name: 'Archive', exact: true })
  await expect(archive).toBeVisible()
  await expect(more).toBeFocused()
  await waitForPresentation(archive)
  await page.keyboard.press('Escape')
  await expect(archive).toBeHidden()
  await expect(more).toBeFocused()

  await more.click()
  const organize = page.getByRole('menuitem', { name: 'Organize', exact: true })
  await organize.click()
  const tag = page.getByRole('menuitem', { name: 'Add tag', exact: true })
  await waitForPresentation(tag)
  await expect(organize).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(tag).toBeHidden()
  await expect(archive).toBeVisible()
  await expect(organize).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(archive).toBeHidden()
  await expect(more).toBeFocused()

  await page.keyboard.press('ArrowRight')
  await expect(archive).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: 'Last command' })).toHaveText(
    'archive',
  )
})

for (const width of [320, 390]) {
  test(`Nuxt UI drawer accommodates a vertical navigation tree at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 })
    await openFixture(page, { scenario: 'drawer' })
    await page.getByRole('button', { name: 'Open sections' }).click()
    const drawer = page.getByRole('dialog', { name: 'Sections', exact: true })
    await waitForPresentation(drawer)
    const body = drawer.getByRole('region', { name: 'Sections', exact: true })
    const surface = drawer.locator('[data-navigation-mode="vertical-tree"]')
    await expect(surface).toHaveAttribute('data-navigation-boundary', 'none')
    const ui = uiTest(page).within(drawer)
    const reports = ui.navigationEntry({ kind: 'submenu', name: 'Reports' })
    await reports.click()
    const summary = ui.navigationEntry({ kind: 'destination', name: 'Summary' })
    await expect(summary).toBeVisible()
    await waitForPresentation(surface)
    for (const link of await surface.getByRole('link').all()) {
      await expect(link).toHaveCSS('text-decoration-line', 'none')
    }
    const menu = (await surface.boundingBox())!
    const contentWidth = await body.evaluate((node) => {
      const style = getComputedStyle(node)
      return (
        node.clientWidth -
        parseFloat(style.paddingInlineStart) -
        parseFloat(style.paddingInlineEnd)
      )
    })
    expect(Math.abs(menu.width - contentWidth)).toBeLessThanOrEqual(1)
    const branch = (await reports.boundingBox())!
    const child = (await summary.boundingBox())!
    expect(child.x).toBeGreaterThan(branch.x)
    expect(child.x + child.width).toBeCloseTo(branch.x + branch.width, 0)
    expect(branch.width).toBeCloseTo(menu.width, 0)
    const closeButton = drawer.getByRole('button', {
      name: 'Close',
      exact: true,
    })
    const close = (await closeButton.boundingBox())!
    await expect(closeButton.locator('xpath=ancestor::header[1]')).toHaveCSS(
      'padding-block-end',
      '0px',
    )
    const first = (await ui
      .navigationEntry({ kind: 'submenu', name: 'Records' })
      .boundingBox())!
    expect(first.y).toBeGreaterThanOrEqual(close.y + close.height)
    expect(close.x).toBeGreaterThan(menu.x + menu.width / 2)
    expect(close.x + close.width).toBeLessThanOrEqual(menu.x + menu.width)
  })
}
