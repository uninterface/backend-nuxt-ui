# Native HTML content defaults

This backend declares `native.content.v1`. Business authors use the native set defined by Uninterface core; `dl`/`dt`/`dd` and quotation elements are outside that set. UiKeyValueList/Item remain the preferred name–value presentation; quotation components are still to be designed.

## Setup and ownership

Follow [setup](setup.md), including the ordinary `@uninterface/backend/style.css` import. That entry includes the private `src/native-content.css`; do not import private files directly. No content wrapper, provider or per-element class is needed. The document baseline applies outside UiApp, including teleported content. Font delivery remains the separate choice documented in [typography](typography.md).

Tailwind Preflight resets heading scale/weight, list markers and links. The adapter restores these in `@layer base`, using Tailwind text-size/weight tokens and Nuxt `--ui-text-highlighted`, `--ui-text`, `--ui-primary`, `--ui-border` and `--ui-bg-accented`. Component and utility layers retain precedence. Native emphasis, monospace and script positioning remain with Preflight/browser behavior. Explicit ordered-list `type` hints (numeric, alphabetic and Roman) are preserved with `revert-layer`; `start`, `reversed` and item values retain browser numbering behavior. Forced-color link focus uses the system Highlight color.

Bare `pre` preserves authored whitespace with `pre-wrap`; long lines and unbroken prose wrap within the available width. A lone native prose block allocated by an ordinary UiLayout/UiFlowLayout item uses the layout gap instead of adding its own outer block margins. Nested prose retains its margins; content insets are unaffected.

Native navigation lists keep zero margins/padding and no prose markers; navigation/menu links keep their native decoration. Private field help/errors do not gain paragraph-bottom margins, and modal titles retain their native inherited size. These narrowly targeted base-layer rules preserve application utility overrides and leave authored prose inside components intact.

## Customization and limits

Use application-owned theme configuration and styles after backend styles, following [customization](customization.md). The native/theme values above are consumed inputs; use them within the backend’s supported theme configuration instead of copying a second content stylesheet into business components. Application selector overrides can change native presentation and require their own acceptance.

Mode changes use the same native document/theme integration as other content; no content-only palette or teleport wrapper is introduced. `lang`/`dir`, bdi/bdo, time/data and abbreviation attributes retain HTML behavior. They do not translate, format or validate business data.

## Verification

Check representative headings, links, list markers, annotations and long values at narrow and wide widths in both directions and color modes. Include wrapping, dialog focus return and application utility overrides where used. DOM checks cover markup and identity but cannot establish browser geometry or accessibility conformance.

Backend regression coverage in `testing/native-content.spec.ts` exercises typed lists, application utility overrides, navigation/menu decoration, custom field feedback, modal titles versus authored headings, and forced-color focus.
