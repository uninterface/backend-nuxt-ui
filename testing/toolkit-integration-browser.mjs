import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from '@playwright/test'
import { build } from './fixture-build.mjs'

const directory = 'var/ki-058/toolkit-browser'
mkdirSync(directory, { recursive: true })
const result = await build({
  logLevel: 'silent',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  build: {
    write: false,
    lib: {
      entry: fileURLToPath(
        new URL('./fixtures/toolkit-integration.ts', import.meta.url),
      ),
      formats: ['iife'],
      name: 'Toolkit',
    },
  },
})
const output = (Array.isArray(result) ? result : [result]).flatMap(
  (item) => item.output,
)
const code = output.find((item) => item.type === 'chunk').code
const css = output
  .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
  .map((item) => item.source)
  .join('\n')
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? '/usr/bin/chromium',
})
const records = []
let status = 'failed'
try {
  for (const context of [
    { width: 1280, direction: 'ltr', mode: 'light' },
    { width: 390, direction: 'rtl', mode: 'dark' },
  ]) {
    const page = await browser.newPage({
      viewport: { width: context.width, height: 900 },
      colorScheme: context.mode,
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/*', (route) =>
      route.request().url() === 'http://toolkit.test/'
        ? route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html lang="en" dir="${context.direction}" class="${context.mode}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body></body></html>`,
          })
        : route.abort(),
    )
    await page.goto('http://toolkit.test/')
    await page.addScriptTag({ content: code })
    async function mount(name) {
      await page.evaluate(async (name) => {
        window.fixture = await window.Toolkit[name]()
      }, name)
    }
    async function dispose() {
      const diagnostics = await page.evaluate(async () => {
        const errors = window.fixture.errors ?? window.fixture.state?.errors
        await window.fixture.dispose()
        return errors ?? []
      })
      assert.deepEqual(diagnostics, [])
    }

    await mount('mountAsyncChoice')
    const select = page.getByRole('combobox', { name: 'Contact' })
    await expect(select).toHaveText('saved')
    await select.press('ArrowDown')
    await expect(page.getByRole('option')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(select).toBeFocused()
    await page.evaluate(() => window.fixture.finish())
    await expect(select).toHaveText('Saved contact')
    await select.press('ArrowDown')
    const other = page.getByRole('option', { name: 'Other contact' })
    await expect(other).toBeVisible()
    await other.click()
    await expect(select).toHaveText('Other contact')
    await expect(select).toBeFocused()
    await page.evaluate(() => window.fixture.fail())
    await expect(select).toHaveText('Other contact')
    await dispose()
    records.push({
      ...context,
      scenario: 'select loading, selection, focus and retained value',
    })

    await mount('mountMultiSelect')
    await page.getByRole('button', { name: 'Load', exact: true }).click()
    await page.getByRole('button', { name: 'Resolve', exact: true }).click()
    const multiple = page.getByRole('combobox', { name: 'Membership' })
    await multiple.press('ArrowDown')
    await page.getByRole('option', { name: 'Second', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(multiple).toBeFocused()
    await expect(page.getByTestId('selected')).toHaveText(
      '["one","locked","two"]',
    )
    await dispose()
    records.push({
      ...context,
      scenario: 'multiple selection and Escape focus restoration',
    })

    await mount('mountMenuHost')
    const host = page.getByRole('button', { name: 'My host button' })
    await host.press('Enter')
    const branch = page.getByRole('menuitem', { name: 'Branch A', exact: true })
    await expect(branch).toBeVisible()
    await branch.focus()
    await branch.press(context.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
    const command = page.getByRole('menuitem', {
      name: 'A command',
      exact: true,
    })
    await expect(command).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(command).toHaveCount(0)
    await expect(branch).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(host).toBeFocused()
    await dispose()
    records.push({
      ...context,
      scenario: 'direction-aware submenu keyboard entry and scoped Escape',
    })

    await mount('mountOverlays')
    await page.locator('#panel-trigger').click()
    const retained = page.getByRole('textbox', { name: 'Retained draft' })
    await retained.fill('Retained through hiding')
    await page.locator('#panel-trigger').click()
    await expect(retained).toBeHidden()
    await page.locator('#panel-trigger').click()
    await expect(retained).toHaveValue('Retained through hiding')
    await page.locator('#panel-trigger').click()
    await page.locator('#drawer-trigger').click()
    const drawer = page.getByRole('dialog', {
      name: 'Edit record',
      exact: true,
    })
    await expect(drawer).toBeVisible()
    await drawer
      .getByRole('textbox', { name: 'Run draft' })
      .fill('Unsaved draft')
    await page.locator('#nested-trigger').click()
    await page.evaluate(() => {
      void window.fixture.nested.run()
    })
    const nested = page.getByRole('textbox', { name: 'Nested draft' })
    await expect(nested).toBeVisible()
    await nested.press('Escape')
    await expect(nested).toHaveCount(0)
    await expect(drawer).toBeVisible()
    await expect(
      drawer.getByRole('textbox', { name: 'Run draft' }),
    ).toHaveValue('Unsaved draft')
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect(page.locator('#drawer-trigger')).toBeFocused()
    await page.locator('#popover-trigger').click()
    const draft = page.getByRole('textbox', { name: 'Run draft' })
    await expect(draft).toBeVisible()
    await draft.press('Escape')
    await expect(draft).toHaveCount(0)
    await expect(page.locator('#popover-trigger')).toBeFocused()
    await dispose()
    records.push({
      ...context,
      scenario: 'retained panel, drawer, nested popup and popover lifetimes',
    })

    await page.evaluate(async (mode) => {
      window.fixture = await window.Toolkit.mountFloatingFeedback(
        {},
        'toast',
        mode,
      )
      window.fixture.send('Scoped toast', false, null)
    }, context.mode)
    const toast = page.locator('[data-ui-feedback-item]')
    await expect(toast).toBeVisible()
    await page.locator('[data-feedback-origin]').press('Escape')
    await expect(toast).toBeVisible()
    await toast
      .getByRole('button', { name: 'Action', exact: true })
      .press('Escape')
    await expect(toast).toHaveCount(0)
    await dispose()
    records.push({
      ...context,
      scenario: 'managed toast Escape stays scoped to its surface',
    })
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log(
    `Nuxt UI: ${records.length} toolkit integration browser scenarios passed`,
  )
  status = 'passed'
} finally {
  writeFileSync(
    `${directory}/results.json`,
    JSON.stringify({ status, browser: browser.version(), records }, null, 2),
  )
  await browser.close()
}
