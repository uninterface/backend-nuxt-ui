# Set up the Nuxt UI backend

This guide owns the application integration requirements for `@uninterface/backend-nuxt-ui`. Business components use `@uninterface/uninterface`; toolkit configuration stays at application assembly.

## Requirements

Use Vue compatible with core's `^3.5.43` peer dependency, Vue-aware TypeScript checking, and Vite with `@vitejs/plugin-vue`. Keep one runtime copy of Vue and core.

The adapter pins Nuxt UI 4.12.0 and Reka UI 2.11.0. Nuxt UI, the adapter's direct primitive imports and vaul-vue must resolve the same Reka implementation so their injected contexts agree. Keep the lockfile and these pins coordinated when upgrading; do not independently replace the native primitives.

## Select the backend

The release package ships compiled ES modules and TypeScript declarations.
Install `@uninterface/backend-nuxt-ui` under the alias `@uninterface/backend`.

```sh
npm install @uninterface/uninterface @uninterface/backend@npm:@uninterface/backend-nuxt-ui@4.12.0-alpha1
```

Choose a Core version that satisfies the selected backend release's peer dependency.

Use TypeScript's `Bundler` module resolution to resolve the package's type
exports. See [package build](package-build.md) for a source checkout.

## Configure Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import backendPlugins from '@uninterface/backend/vite'

export default defineConfig({
  plugins: [vue(), backendPlugins()],
  resolve: { dedupe: ['vue', '@uninterface/uninterface'] },
})
```

## Initialize the application

```ts
// src/main.ts
import { createUiApplication } from '@uninterface/uninterface/setup'
import '@uninterface/backend/font.css'
import '@uninterface/backend/style.css'
import App from './App.vue'

const app = createUiApplication(App, { document })
await app.ui.ready
app.mount('#app')
```

Both integration points are required: `./vite` supplies Tailwind processing, generated themes and guarded native locale/field-identity integration; the `./integration` descriptor is consumed automatically by createUiApplication to create Nuxt UI's per-application context and plugin. Do not pass that descriptor to app.use or install the native plugin separately. The adapter declares Nuxt UI 4.12.0 and its supporting build/icon dependencies. No Nuxt application or router is required. The build hook disables automatic component registration, composable imports, routing integration and automatic color-mode management; views import components explicitly. The stylesheet includes Tailwind and Nuxt UI theme styles, including their global effects. Do not replace this hook with an independently configured toolkit plugin for the same views.

The integration descriptor is loaded by core through the selected alias; business components need no backend imports. Import the stylesheet once. The top-level `document` option grants ownership of document language attributes; omit it for an embedded application. Await readiness before mounting. For SSR/hydration, supply the same explicit `idPrefix` on both sides, create a fresh application per request and call `app.ui.dispose()` in `finally`. The core application-isolation guide defines the verified editing baseline and request-owned business-session cleanup.

The adapter root installs Nuxt UI's locale, tooltip, portal, and overlay providers. Uninterface mounts its own toast and notification views, so adapter startup needs only these providers from the Nuxt UI application shell. When upgrading the pinned toolkit, review the provider setup alongside Nuxt UI's `App.vue`.

Create a minimal `App.vue` to verify the configured application:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UiApp, UiButton, UiContent } from '@uninterface/uninterface'

const acknowledged = ref(false)
</script>

<template>
  <UiApp>
    <UiContent>
      <h1>Application ready</h1>
      <UiButton
        :disabled="acknowledged"
        @click="acknowledged = true"
      >
        Acknowledge
      </UiButton>
      <p v-if="acknowledged" role="status">Acknowledged.</p>
    </UiContent>
  </UiApp>
</template>
```

Mount into the existing Vue application's `#app` element. Use its configured Vite and Vue type-check commands to build/check the source. Confirm that the button responds, becomes disabled and displays the status. This verifies a basic interaction, not every backend capability or browser.

## Scope and verification

The [presentation reference](presentation.md) documents native mappings and limitations; [exports](exports.md) documents assembly modules. Capability declarations describe supported contracts; they do not certify accessibility. Browser keyboard, focus, popup, contrast and scrolling checks remain necessary in addition to builds and DOM simulation.

## Localization and icons

Use `createUiApplication` to install this backend's `integration` alongside core resources. Do not separately install a native toolkit plugin. Core's application-localization service owns language selection and synchronizes the native resources supplied by this backend.

The initial full message set is English, Simplified Chinese, Traditional Chinese and Arabic. The integration declares native resource aliases; core exposes the effective native locale through `app.ui.i18n.state.value.resolved.backend`. Additional native resources can be supplied by extending the selected integration at assembly through the `backend` option; core/business components need no backend-name branch. Additional languages and full RTL require acceptance before support claims.

The catalogue supplies 58 semantic icon names. Application overrides affect UiIcon and menu entry icons; native internal glyphs retain their toolkit defaults. The semantic catalogue and configured native internal glyphs are bundled locally without an external icon service. The Vite hook resolves native collections from the application first, then the backend dependencies, and rejects unresolved configured icons instead of relying on a runtime download. The backend uses a bounded Lucide subset; see [Lucide license](icon-licenses/Lucide.txt).

The build hook also guards a Nuxt UI 4.12.0 locale isolation limitation: its client locale composable shares the first injected context. The adapter preserves the native translator but resolves context per caller, enabling multiple applications with independent languages. The transformation checks the pinned declaration and fails on an incompatible toolkit change so upgrades require review. The hook is required for localization isolation as well as native themes.

Arabic (`ar`, العربية) uses script-derived RTL direction. The integration lazily loads the toolkit’s native Arabic pack. Some upstream native strings may remain untranslated. `resolved.backend` reports `ar`, including for compatible regional requests. Message and direction support do not certify full RTL layout or browser acceptance.

Request a language through the installed service; do not install another native locale manager:

```ts
await app.ui.i18n.setLocale('zh-Hans')
```

Register your own headings, field labels and business messages through `i18n.resources` at createUiApplication setup. Core/native packs translate library-owned text, not arbitrary strings in your application. Resource failures retain the previous language; handle the rejected request. Additional catalogue definitions use the setup `icons` option. Exact resource and icon contracts are documented by `@uninterface/uninterface` under `docs/guides/localization-and-icons.md`.

## Color mode

This backend supports `theme.color-mode.v1`. To let a top-level application own document mode, include `colorMode` in application setup:

```ts
const app = createUiApplication(App, {
  document,
  colorMode: {
    document,
    preference: 'system',
    storageKey: 'application-appearance', // Optional persistence.
  },
})
await app.ui.ready
app.mount('#app')
```

Core manages preference, system detection and optional persistence; the backend maps the result to native `light`/`dark` classes on html, covering teleported surfaces as well as the app. Do not independently toggle toolkit classes or enable another preference controller. The top-level `document` option for language is separate from `colorMode.document`.

Embedded applications omit colorMode to observe the host document without mutating it. For SSR, emit the native html selector matching the resolved server mode and hydrate with the same initial resolution. Independent simultaneous modes in one document are unsupported. Palette changes and accessible contrast still require browser verification; see [presentation](presentation.md#color-mode).

## Customize presentation

See [customization](customization.md) for supported application-owned styling,
native configuration possibilities and adapter limitations.

See [strategy support](strategies.md) for optional regional preferences, control-size mappings and unsupported values.

The pinned native FormField bridge reads the explicit input identity before rendering its label; its generated feedback namespace remains separate. Checkbox integrated-label coordination activates after mount so initial server/client output agrees. Native source changes fail the build guard and require adapter review. The verified editing baseline and its exclusions are documented by core; a successful Nuxt UI installation does not establish general Nuxt application or arbitrary-component SSR support.

## Typography: fonts first, backend styles second

| Choice | First import: fonts |
|---|---|
| **Backend default · Network** (recommended starting setup) | `@uninterface/backend/font.css` |
| **Backend default · Bundled** | `@uninterface/backend/font-bundled.css` |
| **Uninterface default · Network** | `@uninterface/fonts/font.css` |
| **Uninterface default · Bundled** | `@uninterface/fonts/font-bundled.css` |

Import one selected font entry before the stable `@uninterface/backend/style.css`, as shown in the setup example. The Uninterface choices require the optional `@uninterface/fonts` package. Omitting the font import uses system fonts without downloads. See [typography and fonts](typography.md) for installation, CSP, deployment, language coverage and verification steps.

[Native HTML content defaults](native-html.md): supported element baseline, toolkit mappings, setup, spacing and verification limits.


### Common icon assets

The common catalogue supplies 58 semantic names with independent override keys. The artwork includes Lucide icons from `@iconify-json/lucide` 1.2.144. Setup imports the catalogue as local Vue components. Applications should budget for the whole catalogue in the bundle. Native internal glyphs are separate from the override catalogue. For semantic names and overrides, see `docs/api/constants/uiIconNames.md` and `docs/guides/localization-and-icons.md` in the Core package. See [asset sources and mappings](icon-licenses/SOURCES.md).
