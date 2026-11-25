import { test, expect } from '@playwright/test'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { build } from './fixture-build.mjs'
import { waitForPresentation } from '@uninterface/testing/playwright'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/floating-feedback-browser.ts', import.meta.url),
)

test('native toast ring, motion and progress survive managed delivery', async ({
  page,
}) => {
  await openFixture(page)
  await page.waitForFunction(() => Boolean(window.nuxtFeedback))
  await page.evaluate(async () => {
    window.nuxtFeedback.current.dispose()
    window.nuxtFeedback.current = await window.nuxtFeedback.mount(
      { placement: 'top-end' },
      'toast',
    )
    window.nuxtFeedback.current.send('Timed feedback', false, 4000)
  })
  const item = page.locator('[data-ui-feedback-item]')
  const native = item.locator('[data-ui-managed-feedback]')
  await expect(native).toBeVisible()
  await expect(native).toHaveCSS('animation-name', 'toast-slide-in-from-top')
  expect(
    await native.evaluate((node) => getComputedStyle(node).boxShadow),
  ).not.toBe('none')
  const bounds = await native.boundingBox()
  const viewport = await page.locator('[data-feedback-target]').boundingBox()
  expect(bounds!.x - viewport!.x).toBeGreaterThan(1)
  expect(
    viewport!.x + viewport!.width - bounds!.x - bounds!.width,
  ).toBeGreaterThan(1)
  const progress = item.getByRole('progressbar')
  await expect(progress).toBeVisible()
  await expect
    .poll(async () => Number(await progress.getAttribute('aria-valuenow')))
    .toBeLessThan(95)
  await native.hover()
  const paused = await progress.getAttribute('aria-valuenow')
  await page.waitForTimeout(200)
  expect(await progress.getAttribute('aria-valuenow')).toBe(paused)
  await page.evaluate(() => {
    const item = document.querySelector('[data-ui-managed-feedback]')!
    item.addEventListener('animationstart', (event) => {
      if ((event as AnimationEvent).animationName === 'toast-closed')
        document.body.dataset.feedbackExit = 'observed'
    })
    window.nuxtFeedback.current.route.reset()
  })
  await expect(page.locator('body')).toHaveAttribute(
    'data-feedback-exit',
    'observed',
  )
  await expect(item).toHaveCount(0)
})

test('notification separation follows the active theme with backend styles alone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 640 })
  await openFixture(page)
  await page.waitForFunction(() => Boolean(window.nuxtFeedback))
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    window.nuxtFeedback.current.send('Theme-aware notification')
  })
  const card = page.locator('.nuxt-notification')
  const defaultShadow = /0px 0px 0px 1px, .*0px 10px 28px 0px/
  await expect(card).toBeVisible()
  await expect(card).toHaveCSS('box-shadow', defaultShadow)

  await page.addStyleTag({
    content: `
      :root {
        --ui-bg: rgb(250 249 248);
        --ui-bg-elevated: rgb(45 56 67);
        --ui-border-accented: rgb(123 145 167);
      }
      .dark { --uninterface-notification-shadow: 0 4px 12px rgb(0 0 0 / 50%); }
    `,
  })
  await expect(card).toHaveCSS('background-color', 'rgb(250, 249, 248)')
  await expect(card).toHaveCSS(
    'box-shadow',
    /^rgb\(123, 145, 167\) 0px 0px 0px 1px, .*0px 10px 28px 0px$/,
  )

  await page.evaluate(() => {
    document.documentElement.classList.replace('light', 'dark')
  })
  await expect(card).toHaveCSS('background-color', 'rgb(45, 56, 67)')
  await expect(card).toHaveCSS(
    'box-shadow',
    /^rgb\(123, 145, 167\) 0px 0px 0px 1px, .*0px 4px 12px 0px$/,
  )
})

for (const kind of ['toast', 'notification'] as const) {
  for (const mode of ['light', 'dark'] as const) {
    test(`${kind} exposes keyboard focus in ${mode} mode in both tab directions`, async ({
      page,
    }) => {
      await openFixture(page)
      await page.waitForFunction(() => Boolean(window.nuxtFeedback))
      await page.evaluate(
        async ({ kind, mode }) => {
          window.nuxtFeedback.current.dispose()
          document.documentElement.classList.remove('light', 'dark')
          document.documentElement.classList.add(mode)
          window.nuxtFeedback.current = await window.nuxtFeedback.mount(
            { duration: null },
            kind,
          )
          window.nuxtFeedback.current.send('Keyboard feedback', true)
        },
        { kind, mode },
      )
      const item = page.locator('[data-ui-feedback-item]')
      const surface = item.locator('[data-ui-managed-feedback]')
      await expect(surface).toBeVisible()
      const origin = page.locator('[data-feedback-origin]')
      await page.evaluate(() => {
        const after = document.createElement('button')
        after.dataset.feedbackFocusAfter = ''
        after.textContent = 'After feedback'
        document.body.append(after)
      })
      for (const key of ['Tab', 'Shift+Tab']) {
        await (
          key === 'Tab' ? origin : page.locator('[data-feedback-focus-after]')
        ).focus()
        const visited = new Set<string>()
        for (let step = 0; step < 20; step++) {
          await page.keyboard.press(key)
          const focused = await item.evaluate((node) => {
            const active = document.activeElement as HTMLElement | null
            if (!active || !node.contains(active)) return null
            const bounds = active.getBoundingClientRect()
            return {
              surface: active.hasAttribute('data-ui-managed-feedback'),
              body: active.classList.contains('nuxt-notification-content'),
              name:
                active.tagName +
                ':' +
                (active.getAttribute('data-slot') ?? active.className),
              width: bounds.width,
              height: bounds.height,
              visible: active.matches(':focus-visible'),
            }
          })
          if (!focused) {
            if (visited.size) break
            continue
          }
          expect(focused.visible).toBe(true)
          expect(focused.width).toBeGreaterThan(1)
          expect(focused.height).toBeGreaterThan(1)
          visited.add(focused.name)
          if (focused.surface || focused.body) {
            await expect(surface).toHaveCSS('outline-style', 'solid')
            await expect(surface).toHaveCSS('outline-width', '3px')
            await expect(surface).toHaveCSS('outline-offset', '2px')
            expect(
              await surface.evaluate(
                (node) => getComputedStyle(node).outlineColor,
              ),
            ).not.toBe('rgba(0, 0, 0, 0)')
          } else {
            await expect(surface).toHaveCSS('outline-style', 'none')
          }
          if (focused.body) {
            const body = item.locator('.nuxt-notification-content')
            await expect(body).toHaveCSS('outline-style', 'none')
          }
          await waitForPresentation(surface)
          const inner = await surface.boundingBox()
          const outer = await page
            .locator('[data-feedback-target]')
            .boundingBox()
          expect(inner!.x - outer!.x).toBeGreaterThanOrEqual(5)
          expect(
            outer!.x + outer!.width - inner!.x - inner!.width,
          ).toBeGreaterThanOrEqual(5)
        }
        expect(visited.size).toBeGreaterThanOrEqual(4)
      }
      await page.emulateMedia({ forcedColors: 'active' })
      await origin.focus()
      await page.keyboard.press('Tab')
      const focusHost =
        kind === 'toast' ? surface : item.locator('.nuxt-notification-content')
      await focusHost.focus()
      await expect(surface).toHaveCSS('outline-style', 'solid')
      await expect(surface).toHaveCSS('outline-width', '2px')
      if (kind === 'notification') {
        await expect(focusHost).toHaveCSS('outline-style', 'none')
      }
    })
  }
}
