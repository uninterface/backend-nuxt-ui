import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import type { Page } from '@playwright/test'
import { build } from './fixture-build.mjs'
import type { hydrateTable, TableSsrRequest } from './fixtures/table-ssr'
import type { renderTable } from './fixtures/table-ssr-server'

type NativeTablePage = Window & {
  NativeTableFixture: { hydrateTable: typeof hydrateTable }
  nativeTable: Awaited<ReturnType<typeof hydrateTable>>
}

export async function buildNativeTableFixture() {
  const output = new URL('../var/', import.meta.url)
  await mkdir(output, { recursive: true })
  const directory = await mkdtemp(
    fileURLToPath(new URL('native-table-', output)),
  )
  const define = {
    'process.env.NODE_ENV': '"development"',
    'process.env': '{}',
  }
  try {
    await build({
      logLevel: 'silent',
      define,
      ssr: { noExternal: true },
      build: {
        ssr: fileURLToPath(
          new URL('./fixtures/table-ssr-server.ts', import.meta.url),
        ),
        outDir: directory,
        rollupOptions: { output: { entryFileNames: 'entry.mjs' } },
      },
    })
    const { renderTable: render } = (await import(
      pathToFileURL(resolve(directory, 'entry.mjs')).href
    )) as { renderTable: typeof renderTable }
    const result = await build({
      logLevel: 'silent',
      define,
      build: {
        write: false,
        lib: {
          entry: fileURLToPath(
            new URL('./fixtures/table-ssr.ts', import.meta.url),
          ),
          formats: ['iife'],
          name: 'NativeTableFixture',
        },
      },
    })
    const assets = (Array.isArray(result) ? result : [result]).flatMap(
      (bundle) => ('output' in bundle ? bundle.output : []),
    )
    const script = assets.find(
      (asset) => asset.type === 'chunk' && asset.isEntry,
    )
    if (!script || !('code' in script))
      throw new Error('Missing native table fixture bundle')
    const css = assets
      .filter(
        (asset) => asset.type === 'asset' && asset.fileName.endsWith('.css'),
      )
      .map((asset) => ('source' in asset ? String(asset.source) : ''))
      .join('\n')

    const open = async (
      page: Page,
      request: TableSsrRequest,
      inspectServer?: () => Promise<void>,
    ) => {
      const { html, teleports, errors } = await render(request)
      if (errors.length) throw new Error(errors.join('\n'))
      const url = 'http://native-table-fixture.test/'
      await page.route(url, (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `<!doctype html><html lang="en"><head><style>${css}</style></head><body><div id="table-host" style="height:300px">${html}</div></body></html>`,
        }),
      )
      await page.goto(url)
      await inspectServer?.()
      await page.evaluate((teleports) => {
        for (const [target, html] of Object.entries(teleports)) {
          const container = document.querySelector(target)
          if (!container) throw new Error(`Missing teleport host ${target}`)
          container.insertAdjacentHTML('beforeend', html)
        }
      }, teleports)
      await page.addScriptTag({ content: script.code })
      await page.evaluate(async (request) => {
        const fixture = window as unknown as NativeTablePage
        fixture.nativeTable =
          await fixture.NativeTableFixture.hydrateTable(request)
      }, request)
    }
    return {
      open,
      dispose: () => rm(directory, { force: true, recursive: true }),
    }
  } catch (error) {
    await rm(directory, { force: true, recursive: true })
    throw error
  }
}
