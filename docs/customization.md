# Customize the Nuxt UI backend

[Documentation index](README.md) · [Application setup](setup.md)

This guide applies to the adapter using Nuxt UI 4.12.0 and Tailwind CSS 4.
Component presentation remains native; the backend also supplies its documented default fonts.
The source-consumption requirements in the setup guide still apply.

## Use a theme from the Nuxt UI website

A theme made at [ui.nuxt.com/theme](https://ui.nuxt.com/theme) is configuration
and styling for Nuxt UI, not an Uninterface backend package. Inspect the exported
files rather than assuming that copying a Nuxt application file activates it in
a Vue/Vite application. Export formats may change; compare their settings with
Nuxt UI 4.12.0 before applying them.

| Exported content | Use with this adapter today |
| --- | --- |
| CSS variables, light/dark rules and Tailwind `@theme` declarations | Put them in the application stylesheet described below. |
| Font declarations/assets | Include the assets or font stylesheet explicitly; choosing a family does not download it. |
| `app.config.ts` containing `ui.colors`, component slots, variants or defaults | Remove the Nuxt wrapper and pass its `ui` object to the backend Vite hook as shown below. |
| Nuxt module options in `nuxt.config.ts` | Not consumed by this Vue/Vite integration. |
| Page templates, native Vue components or layouts | Application code, not a transferable theme configuration. |

## Connect the exported app.config.ts

For Vue/Vite, replace `export default defineAppConfig({ ... })` with
`export default { ... }`. Retain the settings inside `ui`; the Nuxt-specific
wrapper is not available in an ordinary Vue application. Keep the resulting
`app.config.ts` at the application root, then explicitly import it in Vite:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import backendPlugins from '@uninterface/backend/vite'
import appConfig from './app.config'

export default defineConfig({
  plugins: [vue(), backendPlugins({ ui: appConfig.ui })],
  resolve: { dedupe: ['vue', '@uninterface/uninterface'] },
})
```

The backend accepts only an optional `ui` object and passes it to Nuxt UI's
native Vite plugin. Native configuration merging applies; omitted settings keep
native defaults. Configuration must be serializable, as the native plugin
writes it into generated modules. Unknown top-level backend options fail;
native nested settings remain subject to the pinned toolkit's supported schema.
No-options invocation retains the default presentation. Restart Vite after
changing build configuration.

This covers color mappings (including a custom neutral palette defined in CSS),
component theme recipes and native icon names. It does not expose native router,
automatic loading, component registration or color-mode ownership switches.
Explicit Uninterface props and adapter integration remain authoritative.

Keep this backend hook instead of installing a second Nuxt UI plugin or editing
generated `.nuxt-ui` files. It also supplies required locale isolation. Only `ui`
is forwarded; other Nuxt app configuration and module settings are not consumed.

## Supply the selected icons and fonts

An exported `ui.icons` map selects native internal glyphs. Install its Iconify
collection in the application build environment, where Nuxt's icon bundler can
resolve it. For `i-tabler-*` icons:

```sh
pnpm add -D @iconify-json/tabler
```

The backend Vite hook bundles the configured native icons, resolving collections
from the application first and the backend dependencies second. Missing configured
icons fail the build or development module load with an actionable error. Verify
the generated bundle and browser glyphs after changing the selected collection.
To retain bundled native defaults instead, omit the exported `ui.icons` property
when passing configuration. This changes only native internal icons: Uninterface's
semantic UiIcon catalogue has its own application override mechanism.

Temporal mode menus honor `ui.icons.arrowLeft` and `ui.icons.arrowRight`.
The bounded-range indicator additionally bundles Lucide `move-horizontal`;
this private adapter choice currently remains Lucide when the configured
native icon collection changes. The next-day indicator uses a custom calendar
+1 SVG.

A font-family declaration such as Outfit does not include the font. Supply its
licensed files with `@font-face`, or explicitly install/import an appropriate
font package. Without it, the declared fallback is used.

## One application stylesheet

Retain the Vite configuration from the setup guide. Create `src/ui.theme.css`
and make it the application's single import for backend styles:

```css
/* src/ui.theme.css */
@import '@uninterface/backend/style.css';

/* Put compatible exported @theme blocks and theme rules here. */
:root {
  --ui-radius: 0.375rem;
}
```

In `src/main.ts`, replace the direct backend stylesheet import with:

```ts
import './ui.theme.css'
```

Keep `createUiApplication` and the rest of setup unchanged. The imported backend
stylesheet already includes Tailwind, Nuxt UI, source scanning and adapter
integration rules. Remove duplicate Tailwind/Nuxt UI imports from the exported
CSS when combining it with this file; retain any necessary application-relative
asset paths and source declarations. Keep CSS `@import` rules before other rules.
Continue importing core's stylesheet separately if using core styling utilities.

Translate an exported `--font-sans` choice into the backend’s complete-stack override so it applies across language boundaries:

```css
:root {
  --uninterface-font-family: 'Your Application Font', sans-serif;
}
```

Supply that font through an application-owned `@font-face` declaration or font
stylesheet. This adapter's Vue setup does not install Nuxt's font module.

CSS semantic tokens such as `--ui-radius`, `--ui-text` and `--ui-bg` are native
Nuxt UI settings. If overriding light/dark-dependent tokens, supply the intended
`.light`/`:root` and `.dark` rules with appropriate cascade precedence. A single
unconditional override can suppress the native dark appearance. Use the shared
color-mode service; do not add another preference controller.

Changing only `--ui-primary` does not select a complete palette: native component
treatments can also consume shade tokens. Use the native `ui.colors` mapping together with the exported palette tokens;
do not treat a single-color replacement as equivalent to `ui.colors.primary`.

## Notification card elevation

Notification cards follow Nuxt's `--ui-border-accented` for their ring and use
`--ui-bg` in light mode and `--ui-bg-elevated` in dark mode. Opaque surface
colors keep page content from showing through a floating notification.
Set `--uninterface-notification-shadow` to one or more CSS shadow
layers to adjust their elevation. For example, add this rule after the backend
import in `src/ui.theme.css`:

```css
:root {
  --uninterface-notification-shadow: 0 6px 20px rgb(0 0 0 / 22%);
}
```

The default elevation is `0 10px 28px rgb(0 0 0 / 28%)`. The token applies to
notifications only. Set it at document level so teleported notifications
inherit it, and use `.dark` to tune dark mode separately. The theme ring and
keyboard focus outline are independent of this shadow setting.

## Scope and limitations

- Native variables affect controls and document-level teleported surfaces.
  Apply document-wide theme rules rather than putting them only on UiApp.
- `ui.modal.content` styles the inner modal surface, including native divider
  variants. The outer native dialog owns placement/width and receives owned
  popup portals. Header/body/footer are children of the surface; application
  selectors must respect this boundary. Use UiModal props for width and retain
  body scrolling and popup isolation. See [modal presentation](modals.md#owned-popups-and-region-isolation).
- The adapter uses native generated dropdown/navigation theme recipes. Their
  component configuration reads the native `ui.dropdownMenu` and
  `ui.navigationMenu` settings supplied through the hook. Integration-specific
  allocation and popup framing rules still apply; arbitrary structural theme
  overrides are not guaranteed compatible.
- `--spacing` participates in Tailwind spacing and the adapter's layout gaps,
  content insets and navbar spacing. Changing it is broad, not a dedicated
  compact-control strategy. Check actual controls and content before adopting it.
- The adapter explicitly maps Uninterface colors and all six button variants.
  Native defaults cannot override those semantic requests. Danger maps to error.
- Custom build-time tokens/classes require rebuilding. CSS variable changes can
  affect live presentation, but arbitrary runtime preset switching and independent
  themes for multiple apps in one document are not supported guarantees.
- Full replacement/unstyled themes are not a documented adapter setup path.
  Preserve the backend stylesheet and its interaction/allocation integration.

Native references: [Vue installation](https://ui.nuxt.com/docs/getting-started/installation/vue),
[design system](https://ui.nuxt.com/docs/getting-started/theme/design-system) and
[component theming](https://ui.nuxt.com/docs/getting-started/theme/components).
These describe toolkit facilities; the adapter limits above still apply.

## Verify a customized presentation

Check the same business components with and without your customization: filled
and outline buttons, disabled/loading states, field help/errors, select and menu
popups, icons, layout wrapping and scrolling. Confirm visible keyboard focus and
readable text. Check both supported color modes, including an already-open popup.
Do not infer whole-application coverage from a single button or claim WCAG
conformance from a theme's name. Customization must preserve Uninterface's model,
validation, selection and interaction contracts.

Keep theme authoring in application setup and styles; business views should not
need native toolkit props or per-component CSS to activate the theme. An existing
color role can be recolored without changing its meaning. Adding a role requires
backend implementation and capability support across all relevant components;
CSS alone does not extend Uninterface's theme vocabulary.

## Portable card hierarchy customization

For changes that should survive switching backends, configure a shared strategy in an application-owned Vue composition; no additional stylesheet is required:

```vue
<script setup lang="ts">
import { UiStrategy, uiCardPresentation } from '@uninterface/uninterface'
const cards = uiCardPresentation({
  [-2]: { color: 'primary', border: 'double' },
  [-1]: { color: 'primary', elevation: 'flat' },
  1: { header: 'band', density: 'compact' },
  2: { color: 'secondary', surface: 'tinted' },
})
</script>
<template><UiStrategy :use="cards"><slot /></UiStrategy></template>
```

Place the application's cards under this composition. Omitted properties retain the shared defaults. Each UiCard can override its effective role with color, or explicitly request neutral with :color="null". Customizing palette values remains an application theme task using the setup above; raw CSS/native variant names do not belong in this map. The same configuration works across conforming adapters, with each retaining its own concrete theme values. [Presentation mappings](presentation.md#cards-and-hierarchy) specify which native values are consumed. Test nested/peer cards, headerless units, both color modes and narrow layouts before adopting a custom profile.

## Default font delivery

Import a selected font.css or font-bundled.css entry first, then the stable backend style.css. Omit font imports for system or application-owned fonts, using --uninterface-font-family for a complete override. See [typography](typography.md) for all four choices, setup steps, CSP sources, licenses and limits.

The ordinary font setup offers four choices: backend or Uninterface default, each with Network or Bundled delivery. Import one font entry before the stable backend stylesheet, following [typography](typography.md); the Uninterface choices require the optional `@uninterface/fonts` package.

## Shared input frame coverage

Nuxt UI has no generic public input frame. This adapter applies the generated Input theme base slot and application ui.input configuration to one compound surface. Backend CSS extends Tailwind focus/focus-visible/disabled variants specifically for this surface so descendant focus and shared disabled state retain the generated theme utilities. Ordinary controls retain their native selectors. The adapter does not render a hidden UInput. Input color/variant defaults and the size strategy are consumed; input-specific icons, loading, fixed-width, native validation and arbitrary UInput props are not frame APIs. UFieldGroup is not used as a substitute.

The frame follows the input theme through the supported setup described above; private adapter selectors are not a stable public styling API. Check ordinary inputs beside the compound frame under the chosen light/dark theme, sizes, focus, invalid, disabled and readonly states. Interior part wrapping is adapter-owned and is not a global layout-spacing customization contract. See [presentation mappings](presentation.md#shared-input-frames) for limits.

## Upload-region native presentation

UiUploadRegion consumes `ui.fileUpload` slots/variants from the same application configuration, plus native default icon, color and size. Its native area/avatar and label presentation are retained. For example, `ui.fileUpload.defaultVariants.size = 'lg'` changes the ordinary upload presentation, subject to explicit size strategies. Avatar artwork also follows `ui.icons.upload`. No additional business-component props or styles are needed.

The adapter fixes the area variant and backend-owned arrangement to support optional progress, preview and independent actions; native file-list slots, native auto-acquisition and layout/variant defaults do not replace that composition. Extent/scrolling remain adapter policy, while actual theme tokens and artwork remain native. DOM regression tests verify the native area/avatar path; browser visual acceptance remains separate.


## Drawers and popovers

UiDrawer (modal and retained panel modes) and UiPopover consume this backend's normal surface, typography and color-mode setup. The adapter renders native-themed content over browser dialog/manual-popover hosting so Uninterface remains the only lifecycle and stacking owner. Application styles load after backend style.css; preserve hidden/inert behavior, bounded scrolling, focus treatment and core-owned stacking when customizing. Popups are teleported to body or the owning overlay; scope application theme variables accordingly. Toolkit snap-point/resizing and gesture-tuning options and docked/compact drawer allocation are not exposed. Layout peer spacing remains owned by the existing layout components.

UiDrawer uses Nuxt Drawer theme slots and Vaul's native gesture/handle primitives over the existing browser surface host. Both modes show a functional handle and direction-specific exposed corners by default. See [native dragging and adaptations](presentation.md#uidrawer-native-dragging). Upstream component props do not automatically become Uninterface props.

The application-owned Nuxt UI configuration accepts `ui.drawer` and `ui.popover` slot overrides through generated theme modules. UiDrawer consumes `content`, `handle`, `container`, `header`, `title`, `body` and `footer`; its explicit close button uses the configured close icon and ordinary Button theme. `ui.slideover` no longer configures UiDrawer. The adapter owns viewport bounds, edge positioning and focus lifecycle.

Drawer regions retain stable body `p-6` and header/footer `p-4 px-6` padding at all widths, before application slot overrides. For example, `ui.drawer.slots.body = 'p-5'`, `ui.drawer.slots.header = 'p-4 px-5'` and the same header value for `footer` customize all regions consistently. Avoid responsive overrides that reintroduce jumps at a fixed outer size. See [the adaptation rationale](presentation.md#stable-drawer-region-padding).

Native `ring ring-default` styles the surface; `ui.drawer.slots.content = 'ring-2 ring-primary'` changes that ring through application configuration. Docking has a separate adapter-owned edge using `--ui-border` and `--shadow-md`, and overlay drawers supplement the native ring with an inward line and depth. Ring slot overrides alone do not style the docking edge. See [drawer boundary and depth](floating-panels.md#drawer-boundary-and-depth); preserve visible depth wherever adjacent content remains visible.

The browser `::backdrop` uses adapter-owned opacity animations synchronized with accepted entry/exit. Native `ui.drawer.slots.overlay` classes are not applied to that pseudo-element. To customize its color, add `.nuxt-overlay[data-ui-overlay='drawer'][aria-modal='true']::backdrop { background: rgb(0 0 0 / 40%); }` after backend style.css. Keep opacity/motion phase rules and nonmodal transparency intact. The default matches native `bg-elevated/75`: `color-mix(in oklab, var(--ui-bg-elevated) 75%, transparent)`.

UiPopover keeps `ui.popover` for its outer content/arrow styling and uses the configured `ui.modal` header, body, footer and title slots for its inner arrangement. For example, `ui.modal.slots.footer = 'gap-3'` adjusts the action separation in both modals and popovers. `ui.drawer` owns drawer regions. The adapter stacks header additions below the title/close row and keeps header/footer outside the body scrollport. Popover-specific additional region slots can override those inherited region functions; preserve padding, action spacing and wrapping when replacing them. No modal visibility, positioning or focus behavior is inherited through these presentation slots.

UiPopover enables the native optional arrow by default. `ui.popover.arrow` theme classes participate in the existing application configuration merge. The adapter reuses Reka UI 2.11.0’s rounded Arrow SVG artwork/dimensions and Nuxt’s theme slot; its public PopoverArrow would require a separate positioning context, so attachment and rotation use the existing overlay owner. The bare native Arrow is not publicly exported. The artwork is retained under the [Reka MIT notice](../REKA-ARROW-LICENSE), with an installed-source upgrade regression. High-level `arrow` object/size options are not forwarded. Verify final direction, native theme fill/stroke and corner clearance in light/dark, RTL and narrow viewports.

## Remaining popup-arrow limits

The general UiPopover enables the native optional arrow by default. Scalar/range calendar popovers and UiSuggestions have not yet adopted this selected default. UiTooltip, the next-day temporal hint, select/multiselect, page-size selection, and dropdown/navigation compositions also leave native optional arrow facilities off in ordinary setup; those optional family defaults are distinct from the explicitly selected popover default. Field-failure tooltips already enable arrows. These limits do not imply that native arrows are unavailable.
