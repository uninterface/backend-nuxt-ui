# Modal presentation

UiModal uses the browser dialog top layer for masking and background interaction blocking. The shared optional presentation helper wraps Tab/Shift+Tab at the dialog boundaries while retaining native traversal within the surface. This adapter supplies Nuxt UI modal theme slots and Button primitives. Core owns run results and close policy; native presentation cannot decide whether hosted business work succeeded.

The close affordance uses Nuxt UI UButton with the configured ui.icons.close, neutral/ghost treatment and generated modal close theme. Native absolute placement is retained in a relative header.

The adapter implements `modal.v1`. Header/footer remain outside the bounded body scrollport. The initial focus target is the visible dialog title with backend focus presentation. The mask uses a conventional translucent backdrop; the surface uses native theme values. Existing application-owned theme configuration and stylesheet ordering apply; see [customization](customization.md).

Owned toolkit select/menu portals target the nearest dialog so they remain operable inside its top layer. Nested modals establish separate native dialog scopes, and shared scroll locks are reference counted. Unmount cleanup is independent of whether a business close policy would have permitted a user dismissal.

No global modal registry, vendor instance or numeric stacking value is exposed to business code. See the core package’s modal guide (`docs/guides/modals.md`) for the public contract. Browser HTMLDialogElement.showModal support is required. Verify focus containment and return to the opener, viewport bounds and pointer dismissal in the browser. Check announcements and navigation with assistive technology.

## Modal surface and action placement

The modal surface now consumes the generated Nuxt modal content/header/wrapper/title/body/footer/close slots, replacing UCard. Native shadow, header height, typography, absolute close placement and state animation apply. Native-dialog positioning and shared width allocation are adapted; vertical centering and no translation are retained. The header reserves room for its close control so long titles remain readable. The browser backdrop uses Nuxt's elevated-background token at the native 75% opacity; arbitrary ui.modal.overlay class overrides are not translated to the browser pseudo-element. Content/header/body/footer/title/close theme overrides are consumed through the backend Vite hook. Actions follow inline reading order and native footer spacing; RTL mirrors placement. No arbitrary footer child sorting occurs.

The native HTML dialog host retains the tested top-layer nesting, owned popup target and core cancellation reasons. This avoids introducing a second uncontrolled modal lifecycle or forcing native components with conflated dismissal events to decide close policy. It is an explicit hosting adaptation, not a claim that the complete native dialog API is exposed. DOM checks establish structure and behavior; compare computed typography, backdrop, spacing and motion against the installed toolkit using the native reference before claiming visual parity.

## Owned popups and region isolation

The outer native `dialog` owns top-layer hosting, accessible naming, width and centering. An inner `div[data-slot="content"]` receives the complete generated `ui.modal.content` theme and contains only header, body and optional footer. The adapter replaces that theme's positioning/width utilities with relative positioning, no translation/margin, full host width and no separate max-width. Native height bounds, overflow, background, rounding, shadow, divider variants and configured theme overrides remain on the inner surface. The dialog host is transparent with visible overflow; the surface's bounded body remains the content scrollport.

Nuxt's default Tailwind `divide-y` draws a border on each direct child except the last. Applying it to the popup host included Reka's empty closed-select placeholder in that child set. Appending the Help tooltip in Examples > Stacking made the placeholder gain a border, changing the centered modal's height. Keeping all presentation on the inner surface prevents popup mounts from changing region dividers. Classes are not parsed or split into a separate divider vocabulary, so responsive/dark divider variants stay together with the native theme.

Owned select/tooltip portals still target the outer dialog. This is an HTML/presentation boundary only: it creates no new registered Uninterface surface, layer or group, and preserves the existing modal/popup z-order relationships. Business consumers need no wrapper, additional props or CSS. Motion hooks set open/closed state on the inner surface and await its finite animations before core releases native modality; popup animations do not control modal lifetime.

When customizing, `ui.modal.content` and `[data-slot="content"]` address the inner surface. Selectors assuming that content is the `dialog` itself, or that header/body/footer are its direct children, must be updated. Use UiModal width props for allocation. Custom structural overrides still must preserve scrolling, focus and popup isolation; see [customization](customization.md).

Verify stable dividers, owned tooltip/select hosting and focus return in the browser. Compare dialog centering and bounds at desktop and mobile widths in LTR and RTL, including nested dialogs and long action labels.

## Shared modal width

The adapter implements modal.width.v1. UiModal width=auto uses preferredWidth or a shared 32rem fallback; width=available fills the available width. Positive px numbers and px/rem/em lengths are accepted; preferredWidth also accepts percentages up to 100% of the available viewport. minWidth/maxWidth constrain preference, but the viewport after safe-area insets and backend clearance is always the hard cap. This replaces native toolkit default width and max-width behavior. Native surfaces/insets, vertical placement and scrolling remain intact. Application width customization should use UiModal props; native toolkit width tokens/classes no longer determine modal allocation.

The actual dialog receives the helper's widthStyle and backend-owned edge clearance. Reactive props and viewport changes preserve content identity. Automatic nested-content width negotiation is not implemented. Check viewport clearance and content identity when resizing in the browser.

## Content-owned scrolling

`UiModal bodyScroll="content"` keeps the native viewport cap, header and footer while making the body a shrinking flex allocation for its content. Short content remains naturally sized. The default `body` mode retains ordinary body scrolling. `UiForm height="full"` uses a shrinking grid boundary for one authored full-height layout root; ordinary forms retain their native field arrangement. Both optional capabilities are declared as `modal.content-scroll.v1` and `form.height.v1`.

Keep the actual body and any native intermediate wrappers shrinkable. The body retains overflow fallback when fixed supporting regions cannot fit at extreme sizes. Verify the actual invoice dialog with short/many rows, narrow/short viewports and keyboard focus: Reference and modal actions remain reachable, the line table scrolls, its summary stays visible and Add remains outside row scrolling. This is allocation support, not a promise that arbitrary default bodies supply a definite full height.

The native generated modal body theme receives `min-h-0 flex flex-col` in content-owned mode. Native modal surface/theme and viewport clearance are retained.
