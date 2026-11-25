import { expect } from '@playwright/test'
import ui from '@nuxt/ui/vite'
import { createBrowserFixture } from '@uninterface/testing/fixture-build'
import { testReferenceFixture } from '@uninterface/testing/fixtures/reference-playwright'
import vue from '@vitejs/plugin-vue'
import { build as viteBuild, mergeConfig } from 'vite'
import { build } from './fixture-build.mjs'
import { uiTestAdapter } from './index'
import { browserControlParts } from './browser-control-parts'

const openFixture = createBrowserFixture(
  build,
  new URL('./fixtures/native-reference.ts', import.meta.url),
)

const openNativeModalFixture = createBrowserFixture(
  (options) =>
    viteBuild(
      mergeConfig(
        {
          configFile: false,
          plugins: [
            vue(),
            ui({
              components: false,
              autoImport: false,
              dts: false,
              router: false,
              colorMode: false,
            }),
          ],
        },
        options,
      ),
    ),
  new URL('./fixtures/upstream-modal.ts', import.meta.url),
)

testReferenceFixture(openFixture, uiTestAdapter, {
  collapsibleTrigger: browserControlParts.collapsibleTrigger,
  nativeModal: true,
  openNativeModalFixture,
  nestedNavigation: true,
  async verifyLoading(page) {
    // Reka hides the triggers from the accessibility tree while the popup
    // is open. The native loading artwork remains painted on each trigger.
    for (const name of ['Uninterface adapter', 'Native reference']) {
      const trigger = page.locator(`[aria-label="${name}"] [role="combobox"]`)
      await expect(
        trigger.locator('[data-slot="leadingIcon"].animate-spin'),
      ).toBeVisible()
    }
  },
})
