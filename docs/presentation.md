# Nuxt UI presentation and native integration

## UiDrawer native dragging

UiDrawer uses [Nuxt Drawer](https://ui.nuxt.com/docs/components/drawer) theme slots and its Vaul DrawerRoot, DrawerContent, DrawerHandle and DrawerTitle primitives. Both modal and retained-panel modes show the functional native handle by default and retain the native rounded exposed corners. Native title associations provide naming; name-only panels use a contained visually hidden span without adding a visible heading. Start/end resolve to physical directions from inherited LTR/RTL. Application `ui.drawer` configuration supplies the content, handle, container, header, title, body and footer slots; `ui.slideover` no longer supplies UiDrawer presentation.

Dragging the handle or header requests the `drag` close route. Modal requests pass through `beforeClose`; panel requests pass through their expansion owner. A pending or denied request keeps the same content mounted, restores the surface position and retains modality when applicable. Disabled panels and explicit `closeOn` lists excluding `drag` disable gesture dismissal; excluding the route also removes the handle. Close/Escape remain keyboard alternatives when enabled. Editable/scrolling body content and footer controls do not start a drag, preserving selection and native scrolling.

Uninterface's browser dialog/manual-popover host remains responsible for top-layer stacking, focus, masking and accepted exit lifetime. Reka’s default Tab loop is bypassed for nonmodal panels and owned child surfaces so ordinary keyboard navigation remains intact. Vaul runs nonmodal with body styling disabled; it does not establish a second modal owner. The adapter restores Vaul's exposed local open state synchronously on release before asking the owner to close. Vaul 0.4.1's distance check uses height and signed translation even for side/top drawers; the adapter applies its 25% distance threshold to outward travel on the correct axis while retaining native velocity dismissal. Snap points, background scaling, inset placement and vendor gesture-configuration props are not public UiDrawer APIs.

## Drawer mask motion and panel boundaries

Modal drawers fade their browser backdrop over the same 200ms entry/exit interval and easing as the surface slide. The adapter asks the shared motion lifecycle to wait for the drawer and its own backdrop before releasing modality and restoring focus. Reduced-motion preferences skip transitions, including gesture snap-back. The mask follows native `bg-elevated/75` through `--ui-bg-elevated`; panel drawers remain unmasked and nonblocking. The browser backdrop stays in place during a drag/guard decision; it fades only after accepted closure.

Both modes retain native Drawer's `ring ring-default` at every width, before application `ui.drawer` slot overrides. Verify narrow/wide, light/dark and logical edges in both directions; automated DOM checks do not establish painted geometry.

## Stable drawer region padding

Both modes retain the agreed stable insets at every viewport width: body `p-6` (24px), header/footer `p-4 px-6` (16px vertical, 24px horizontal). The earlier Slideover mapping changed insets below `sm` even when the outer width remained fixed, visibly widening content. These stable region insets remain an adapter policy after migration to Drawer, whose native container otherwise owns padding and scrolling.

The adapter separates header/body/footer insets and keeps only the body scrollable. Drawers still meet the viewport edge, start/end span its height, and top/bottom span its width. Native exposed-corner rounding and handle orientation follow the physical edge. These contract adaptations replace native Drawer's container scrolling, viewport margins and maximum-size defaults. UiPopover is unaffected.

Application `ui.drawer.slots.header`, `body` and `footer` overrides remain supported. Use consistent base/responsive values to preserve stability. Verify unchanged region padding/content width across `sm` when outer width is unchanged, retained drafts after resizing or rejected dragging, and reachable content at narrow widths. This is a Nuxt drawer adaptation, not a rule prohibiting responsive padding in every component.

[Documentation index](README.md) · [Application setup](setup.md)

This reference describes presentation policies, toolkit mappings and integration limits. Application consumers can start with setup; backend maintainers should also review the native coordination and upgrade-sensitive details here.

## Content wrapping in narrow regions

UiContent allows an otherwise unbreakable word to wrap when it exceeds the available line width (`overflow-wrap: break-word`). This includes bare text and inline spans, independently of an enclosing card or paragraph. Ordinary word boundaries remain preferred; explicit descendant whitespace/wrapping rules retain ownership. The adapter supplies this default without author-side CSS, and without changing content insets or resize shares. Bootstrap's native card already provides equivalent inherited wrapping; UiContent also supplies it outside cards.

This is text wrapping, not a measured horizontal resize minimum: a panel narrower than its insets plus a glyph, or non-wrapping/non-text content, still needs an appropriate allocation or scrolling policy. Vertical measured minima remain separate. Verify both supporting regions near horizontal divider limits with enough width for insets and characters, and preserve mounted reading content.

## Presentation

The six Uninterface theme color roles are supported; `danger` maps privately to Nuxt UI's `error` role. Filled buttons map to Nuxt UI's solid variant. Button loading displays activity and disables activation. No theme extensions are declared.

Form controls use Nuxt UI components while validation remains entirely with Uninterface. The default field presentation hides help while an error is visible and restores it after correction. Async selects retain the selected label while candidates load or fail, remain openable, and show an unselectable status inside the candidate popup. Source recovery belongs to the source controls outside the select.

Hidden ordinary field labels retain their accessible association, while UFormField's `container` theme slot receives `mt-0` to remove the gap for an absent visible label. This applies to hidden labels wherever the field is used, including inline tables; visible labels retain native/configured spacing.

UiTable's private cell-content part middle-aligns a direct button host within the native cell's content line. This prevents the caption-baseline wrapper from adding space above an icon action in standards mode; authored baseline layouts retain their original caption reference. Verify actual button/icon centers with `<!doctype html>`, hover and differing fonts, rather than comparing cell bounds alone.

Command menus use controlled Reka DropdownMenu primitives and Nuxt UI’s generated DropdownMenu theme. Navigation uses the native NavigationMenu family with Nuxt’s navigation theme; its open panel is independent of the application-confirmed destination. Recursive children retain the command menu primitives. Optional hrefs remain ordinary links; key-only activation is supported.

Layout and hosting views implement Uninterface's allocation and scrolling rules using CSS grid/flex and Nuxt UI theme tokens. Content owns its insets; allocation boundaries adjoin. The navbar remains an always-visible, wrapping navigation landmark.

## Verification

Use the [testing guide](testing.md) to configure acceptance for this backend. Verify keyboard navigation, focus, popup placement and scrolling in a browser.

## Integration decisions

Menu shortcut hints retain Nuxt UI's responsive default: the generated DropdownMenu theme's `itemTrailingKbds` slot uses `hidden lg:inline-flex`, hiding hints below the configured `lg` breakpoint and showing them from that breakpoint upward. The default Tailwind breakpoint is `64rem` (normally 1024px). Both pinned Nuxt UI 4.12.0 DropdownMenu and ContextMenu themes use this rule. The adapter applies the DropdownMenu slot directly; narrowing an open menu can therefore hide its shortcut hint without clipping or losing the entry. Keep this native behavior rather than forcing hints visible at every width. Shortcut strings are display hints, not registered keyboard handlers. Verify hints disappear/reappear across the breakpoint while command labels, focus and operation remain available; application theme/breakpoint customization can change the threshold or treatment.

The high-level DropdownMenu wrapper does not forward controlled submenu-open updates and treats empty lazy branches as leaf items. The adapter composes Reka 2.11.0's controlled DropdownMenuRoot/Sub/Content/Item/CheckboxItem primitives instead. Native interaction supplies item highlighting, disabled states, typeahead, focus movement and floating geometry, using the generated Nuxt theme's content, viewport, group, copy and indicator slots. Application theme and icon configuration remain effective.

Core owns branch state, current destination and selected keys. Native selection requests become core activations; they do not independently close checked menus. Single-choice commands use a native item with `menuitemradio` and controlled `aria-checked`: a core selection scope may span logical groups, whereas Reka RadioGroup requires one rendered contiguous group. Submenu Escape closes one level; a root popup restores its host. Tab closes a root popup while retaining native document navigation. KeepAlive deactivation releases native menu layers; reactivation recreates presentation from the retained core control. Inline roots stay in document flow; their submenus still float. A native NavigationMenu viewport supplies the navigation panel frame, so its embedded command content does not add a second frame.

USelect receives native loading and placeholder props. It retains its native activity icon; a nonselectable status inside the candidate panel handles unloaded, pending, failed and empty sources because the pinned USelect has no automatic source-status panel. Real selected keys, including empty-string keys, are encoded separately from its reserved placeholder value. Recovery remains outside the picker.

Single and multiple pickers consume Escape at the open trigger or teleported
content before the enclosing overlay can dismiss. The adapter closes through
USelect's controlled open state and uses its native focus restoration.

UFormField supplies label/feedback presentation. Its input context is isolated after associating the core ID: the pinned toolkit writes its own `aria-describedby` after caller attributes, including help that its error presentation hides. The private bridge preserves native size, maps invalid color/highlight, and places a single checkbox's label beside its native control. Native FormField/Checkbox required treatment is retained with a decorative speech alternative; grouped field markers use the same default suffix treatment. The required-annotation strategy can select prefix or hide the visual marker without removing semantic requiredness. Context changes require association regression tests; UForm does not replace core validation.

Reka menu and select direction is synchronized with inherited document/local CSS direction. The adapter observes changes to ancestor `dir`, `class` and `style`. This maps native keyboard/placement behavior without assigning document ownership to UiApp. Direction inheritance is distinct from message selection. Application setup also synchronizes core resources and the native UApp locale through the integration descriptor.

Layout primitives implement allocation rather than a centered UContainer or fixed-height/sticky UHeader. Their spacing uses the toolkit's spacing scale. The wrapping navbar retains UHeader's background/border convention but does not hide its contents on small screens; content and form spacing use the theme's six-unit spacing default. These are backend composition defaults, not business CSS requirements.

The build hook disables automatic color-mode management. Application assembly uses core's color-mode controller; this backend does not independently consult storage or change mode through VueUse. Tailwind preflight and Nuxt's global stylesheet remain explicit imports and affect ordinary HTML defaults. UiContent owns insets; the backend’s document baseline restores the native content set after Preflight.

## Document baseline

Tailwind preflight establishes document typography and reset defaults. UiApp inherits that baseline; it does not introduce a separate font context for controls. The backend restores heading hierarchy, prose spacing, list markers and link treatment in the base layer. Native navigation lists/links, private field feedback and the modal title explicitly retain their component presentation. Toolkit utility overrides still take precedence. See [native HTML defaults](native-html.md).

Application localization and the icon catalogue are installed through `createUiApplication`; see [setup](setup.md#localization-and-icons). The integration exports native locale mappings and the 58-name default subset.

Shared grid layout uses this backend’s static `./layout` export (`uiLayoutPresentation`) for peer spacing, also used by its linear layout. Core owns the grid geometry; no separate backend grid component is needed. See **UiGridLayout** in `@uninterface/uninterface` (`docs/api/components/UiGridLayout.md`).

## Color mode

Use **core application color-mode setup** in `@uninterface/uninterface` (`docs/guides/color-mode.md`) with `colorMode: { document }` to own the document, optionally specifying preference and a storage key. Without ownership, the app observes the existing host document. The integration uses native `light`/`dark` classes on `<html>`; teleported overlays inherit the same tokens. Business components need no toolkit selectors or mode props.

For SSR, emit the native `<html class="light">` or `<html class="dark">` selector matching the rendered preference and hydrate with the same initial resolution. Multiple independently themed apps in one document are unsupported. Automatic toolkit mode controllers remain disabled; core owns system and optional storage policy.

Automated controller/DOM acceptance verifies host inheritance, live propagation and state retention. Real-browser computed-style, contrast and focus verification is also required; DOM acceptance alone does not certify visual accessibility.

## Native theme and contrast limitations

The backend preserves Nuxt UI's default semantic palette and button treatments: light-mode 500 shades, dark-mode 400 shades, and native 75% filled-button hover/active backgrounds. It does not darken those tokens to satisfy accessibility tests.

The native light palette has known normal-text contrast failures. A browser audit measured white text on the green-500 primary button at 2.23:1 and red-500 outlined Reset text on white at 3.8:1, below WCAG AA's 4.5:1 threshold. These measurements describe the audited states, not every color or interaction state. Native defaults are not a WCAG AA conformance claim.

Applications choose their accessibility acceptance policy. Native defaults do not establish certification; shared keyboard, focus, naming, feedback and interaction obligations still apply.

Applications requiring stronger contrast can opt into Nuxt's semantic color-token and button-theme customization. Check filled and outlined text, hover/active/focus/error states, all affected surfaces and dark mode. A global token change affects every consumer of that role; a passing palette calculation alone does not establish conformance. See [Nuxt UI theme customization](https://ui.nuxt.com/docs/getting-started/theme/css-variables).

Required field and checkbox labels default to the native asterisk suffix (the required-annotation strategy can select prefix or hide it), with an empty CSS speech alternative so the marker does not change the control's accessible name. `aria-required` carries the requirement. Navigation popup Escape requests update the shared expansion state and return focus to the matching native trigger. Command submenu Escape closes one branch whether focus is inside the popup or remains on its trigger after pointer opening. The adapter handles these events before Reka's whole-root dismissal; parent branches and inline roots remain available.


See [strategy support](strategies.md) for optional regional preferences, control-size mappings and unsupported values.


## Text editing modes

UInput supplies ordinary/password editing; UTextarea supplies multiline editing; both use native readonly behavior. UiTextInput keeps shared field ownership, naming, focus, size, required annotations and feedback across all supported modes. Readonly permits focus and copying without user edits; it does not exclude a field from validation/submission.

## Button presentation preferences

The native button and its persistent loading-announcement live region share a private positioned inline-flex host. The clipped announcement is anchored at that host's origin, so buttons deep inside a scrolling region do not add document overflow. Attributes, events, native form association and the exposed focus handle still target the button. The live region stays outside the button's accessible name and remains mounted while idle.

Filled, outline, soft and text map to native solid, outline, soft and ghost. Icon uses ghost with square padding. Labelled buttons use the native leading slot. Icon-only buttons carry their icon in the content slot so the native loading icon can occupy the same footprint as explicitly sized artwork.

All six variants support every declared color. The explicit variant prop takes precedence over an agreed uiButtonVariant regional preference. With neither specified, this adapter ordinarily uses filled; supported application-owned native configuration remains effective. Icon labels stay accessible and supply a native title hint; title display on focus/touch depends on the browser. Pass an explicit title when label content comes from an opaque component. These are support declarations; real-browser geometry and hint behavior need verification. See **UiButton** and **uiButtonVariant** in the core documentation.

## Cards and hierarchy

Cards support an absent header without reserving a blank header band or separator. The optional `top-end` slot anchors concise actions to the card frame using logical edges, independently of preview/media content. Its inset follows half the current card padding, including density changes; the enclosing frame stays positioned and focus remains unclipped. Collection cards use this slot for `card-action-placement="top-end"` and omit headers without selection or meaningful header fields.

UiCard supports five structural requests: -2/-1 higher, 0 ordinary, 1/2 subordinate. Its default map shares the two higher treatments; all other defaults differ. Every level retains a full outline and readable body content. Ordinary/higher levels use solid outlines; both subordinate levels use dashed outlines, independently of color. Higher cards use roomy insets, a band header, large title and raised surface; zero uses normal insets with a band, large title and raised surface; one uses compact insets and a band header; two retains the band and adds a tinted surface and smaller title. Headerless cards retain surface, boundary, density and elevation cues.

Nuxt UI retains one UCard with outline as its native foundation. Slot customization disables the native outer ring so a complete solid/dashed/dotted/double boundary and optional header band can fulfill explicit shared requests. Density uses 6/4/3 Tailwind spacing units; title sizes use xl/lg/base; raised uses shadow-md. There is no UCard color prop: scoped CSS uses --ui-<role> (danger maps to error), --ui-bg, --ui-border-accented and native text tokens. Explicit shared treatments override corresponding native slot defaults; unrelated app-config settings remain native. Root/body overflow is visible.

All eight portable treatment properties are supported through uiCardPresentation: color, header (band/plain), footer (normal/muted), density (roomy/normal/compact), surface (plain/tinted), elevation (flat/raised), border (solid/dashed/dotted/double) and titleSize (large/normal/small). A map can independently customize all five levels, including -2 and -1. Exact native values remain theme-owned; solid/dashed is a primary distinction in Uninterface’s default hierarchy; applications can override patterns, including double, through their presentation maps. This is an Uninterface convention, not a claim of a universal toolkit hierarchy.

UiCard.color overrides the level's color; null explicitly selects neutral and omission uses the profile. Colored boundaries and softly tinted header/body regions use the effective role, while body text retains ordinary foreground. Neutral uses the theme's ordinary boundary tone. Private tokens reset on every card, so a parent's explicit color does not color nested cards or controls. Shared profile scope still independently applies to each participating card. Title/description slots receive structured typography; arbitrary header content retains its own typography and replaces both slots.

The card grows with content, has no sticky regions or scrollport, and preserves descendants when level, color or profile changes. Parent layouts own peer spacing; card regions own insets. No heading rank or interaction role is inferred. See [customization](customization.md) for setup and stylesheet ordering. Structural tests do not establish visual hierarchy quality; compare representative nested content in both modes and at narrow widths.

Footer background and separator color/thickness retain native toolkit presentation; foreground follows the selected footer emphasis. Existing separator patterns follow solid/dashed/dotted card boundaries; double boundaries use solid separators. Pattern-only adaptation fulfills the shared border contract without imposing the card accent on the native footer. Card-density padding adjustments remain to fulfill the explicit shared density request. Native theme configuration can therefore affect footer appearance independently of the enclosing boundary.

Default headers at levels 1/2 retain full insets and a separator so the footer does not receive the only region boundary. Ordinary title typography is semibold, with footer decoration intended to be equal or quieter. Native footer decoration is retained. Application-owned themes, custom plain-header profiles and rich footer content require assessment of the complete pairing; the default styling cannot control the prominence of arbitrary business content.

Nuxt UI uses native divide-solid/divide-dashed/divide-dotted utilities for region divisions, alongside the band-header style. The native division may draw the body/footer line on the body, not the footer. No adapter footer border is added. Pattern changes never add a separator to a plain header, reveal a missing footer, or change nested-card requests.

Footer emphasis defaults to muted at levels 1/2 and normal elsewhere. Muted uses --ui-text-muted with --text-sm. Normal retains the native/reference foreground and body text scale. No whole-region opacity or control-size strategy is applied. Both subordinate levels use the same small scale. Card roots reset typography to the backend body baseline to prevent a nested card from inheriting reduced footer type. Backgrounds, insets and separators retain their independent policies. These scoped text changes fulfill the explicit portable footer request; native HTML/third-party content retains normal CSS inheritance responsibilities. Verify custom content and theme legibility in both modes.


### Context-menu host focus

UiMenu supplies `buttonTrigger` for explicit button activation and `contextTrigger` for contextual interaction on a content group. Apply the complete binding with `v-bind`. The contextual binding includes a private backend class that gives its element a visible keyboard-focus boundary; it does not change child control styling. Focus colors follow this backend's theme, with a system-color outline in forced-colors mode. The boundary uses a backend default radius independent of nested content; it does not infer a child card's shape. Ordinary consumers need no backend class names or focus CSS.

Nuxt UI supplies no default focus style for arbitrary ContextMenu trigger content. This adapter adds a 3px outline using the primary theme color at 25% opacity, a 2px offset and theme-based rounding, following Nuxt focus conventions.


### Reusable focus presentation

Use `useUiFocusPresentation()` from `@uninterface/uninterface` and apply its complete object with `v-bind` to an author-supplied focus target. This backend fulfills `focus.presentation.v1` through its static `./focus` module and stylesheet. The same theme treatment used by context-menu content is available on native links and suitable custom regions anywhere in the application. The binding supplies no tabindex, roles or interaction; callers retain those responsibilities. Branding applies it explicitly rather than relying on navbar ancestry. Avoid adding a second focus treatment to existing toolkit/Uninterface controls. Theme and forced-colors behavior follow the contextual focus treatment described above.

### Region framing

Ordinary UiRegionLayout supports optional separators, selectable adjacent numeric-share resize boundaries and relative sibling layers. Nuxt UI uses --ui-border, --ui-bg and --shadow-md. DashboardResizeHandle is a presentation primitive; this integration keeps the existing layout allocations and supplies the shared separator interaction rather than installing DashboardGroup/Panel state. Separators occupy one theme-owned track; resizers replace that track with a pointer/touch target and use this backend's reusable focus treatment. The initial target is 0.5rem across the split; themes may customize the private layout handle/separator size properties. Raised surfaces do not add content insets.

The adapter owns markup/geometry and uses the optional useUiLayoutResizeView helper for measured pointer interaction, RTL-aware keys and cleanup. Core owns the adjusted ratio and validates relationships. This is allocation framing, not a card or a claim of a native splitter widget. Rendering stays stable while framing changes; the reading scrollport cannot clip a sibling header's shadow. Local layering does not establish global overlay order. Forced-colors uses system boundary colors. Shared browser acceptance remains necessary for hit targets, focus and geometry.

Region separation belongs to UiRegionLayout and spans the full allocation boundary, independent of navbar/UiContent size. A designated navigation child suppresses its matching local edge even when the layout explicitly hides ordinary separators. Standalone and unrelated nested navigation retain their own borders.

Start–Main uses `--ui-border-accented`; Main–End uses `--ui-border`. These line colors express stronger/quieter emphasis in both equal-depth and raised cases. They never change elevation, shadow opacity/reach or stacking order. This is the adapter's region-framing policy, not a claim that native toolkit navbars independently implement these region roles. Application theme overrides should preserve the distinction and both lines' visibility.

Raised region presentation decorates shared edges toward lower neighbours. The adapter retains `--shadow-md` on a separate shadow plane: reflect vertically for a before/top edge, rotate for inline edges, and mirror logical mapping in RTL. Absolute decoration uses `container-type: size` and `cqw`/`cqh` units to keep the rotated plane's footprint equal to the allocation; this requires a browser supporting size container queries. Business content is neither size-contained nor clipped. The wrapper clips only edge decoration. Native shadow customization still feeds the plane, with the same recipe at both roles. No exposed outside edge gains a border.

Equal-depth boundaries retain requested ordinary separators, including all-raised and none-raised states. A raised edge replaces the ordinary separator. Resize handles retain their own tracks and boundary lines; the adjoining raised decoration omits its extra line and stays below the interactive handle. Forced-colors uses a system-color line and suppresses shadows; tone and depth distinctions may collapse. Verify short content, both axes, RTL, light/dark themes and custom theme values in a real browser.

## Input-styled controls

The core **Input-styled controls** contract (`docs/contracts/input-styled-controls.md` in the core documentation) defines this shared look-and-feel agreement. Applicable text, scalar temporal, select and compact multiselect surfaces normally fill their field-control allocation, align to its logical start, use a coherent input frame with visible focus, and default to one row. Textarea and wrapping selections are explicit adaptations. Field labels and feedback retain their existing arrangement strategies. Native theme tokens and supported customization supply the appearance; business compositions do not compensate with CSS.

UiInputFrame composes sub-inputs and supporting content into one input-styled control. UiTextInput shares its frame without adding another border. Existing native controls can fulfill the same agreement directly. Temporal ranges use the lower-level delegated-frame protocol internally. UiFileInput is input-styled: chooser, accepted filename and clear action share the surface. UiUploadRegion retains its drop-area presentation and owns the internal arrangement of optional progress, preview and actions. UiFileInput keeps previews separate. See the [reviewed components](reviewed-components.md) for ownership and native adaptations. This documents obligations, not new visual acceptance evidence.

## Shared input frames

Framed text editors support `maxWidthCharacters` as an approximate character-cell display cap (`input.frame.sizing.v1`), applied to the real editor allocation while the inner input fills it. It never supplies maxlength or changes parsing. UiInputFrameSpacer receives remaining logical inline space through an automatic start margin after editor growth; it is decorative and has no tab stop. The price example uses eleven cells for ten digits plus a decimal separator and places the spacer after USD. Narrow-width/RTL geometry remains subject to browser verification.

UInput forwards arbitrary data attributes to its native input. Framed editor allocation therefore uses an adapter class on UInput’s root and omits the standalone full-width root class; the inner input fills that allocation. This prevents each editor from occupying a separate row.

Nuxt UI has no generic public input frame. This adapter applies the generated Input theme base slot and application ui.input configuration to one compound surface. Backend CSS extends Tailwind focus/focus-visible/disabled variants specifically for this surface so descendant focus and shared disabled state retain the generated theme utilities. Ordinary controls retain their native selectors. The adapter does not render a hidden UInput. Input color/variant defaults and the size strategy are consumed; input-specific icons, loading, fixed-width, native validation and arbitrary UInput props are not frame APIs. UFieldGroup is not used as a substitute.

UiInputFrame with ordinary UiTextInput implement input.frame.v1 and input.frame.cooperation.v1; single-line search also declares input.text.search.v1. The frame consumes field invalid/busy/disabled state and existing failure/size strategies. Hidden failure presentation retains aria-invalid. Parts receive unique names/IDs and the owning field's visible feedback descriptions. Leading, default and trailing content share one wrapping surface. Readonly leaves text selectable and blocks in-frame buttons by default; allowWhenReadonly permits appropriate non-editing actions without bypassing disabled/loading. Owned popup engagement is coordinated; popup content has a separate field/surface scope.

Use the [customization guide](customization.md) for consumed configuration. Functional DOM acceptance covers focus movement, invalid-part focus, incomplete drafts, Save/Reset/Clear and restrictions. Check appearance and narrow geometry with the intended theme in a browser; DOM tests are not visual evidence.

The adapter composes the native file chooser and accepted filename within its backend input frame; Clear participates in the same surface. Filename text follows the accepted descriptor independently of the browser file list. Acquisition alone creates no preview object URL. Browser visual acceptance remains separate from functional DOM checks.

## Horizontal navigation viewport hosting

The native Reka NavigationMenu viewport is teleported to the current overlay target (or the document body). Floating UI follows the navigation root on scrolling, resizing and layout movement; Reka retains panel sizing, trigger alignment, transitions and horizontal screen clamping. This keeps neighboring UiRegionLayout stacking contexts from covering the menu. Only the visible viewport receives pointer events; the unused width of its positioning wrapper does not block application content. Modal overlay targeting remains in effect.

Reka 2.11.0 deliberately ignores trigger clicks during its 300ms hover-open guard. Backend browser tests settle that native guard before testing a separate click-to-dismiss intent; they do not change the adapter's native hover behavior or force clicks through another element. Browser checks remain necessary for stacking, pointer hit targets and geometry.

## Vertical navbar adaptation

UiNavbar follows core's resolved navigation-region orientation. In a side navigation allocation it stacks brand, links and actions vertically at every width; a top/bottom or standalone navbar retains horizontal wrapping. Theme spacing and child semantics remain native to this backend. Only the acknowledged logical edge is rendered; a region-owned edge is not duplicated. This implements the shared UiNavbar backend guidance in `@uninterface/uninterface` (`docs/api/backend/navigation.md#uinavbar-implementation-guidance`), rather than relying on incidental narrow-width wrapping.

## Popup arrow defaults

UiPopover enables Nuxt's supported native arrow as Uninterface's selected default. Specialized calendars and range calendars remain arrowless, following Nuxt's [InputDate date-picker examples](https://ui.nuxt.com/docs/components/input-date#as-a-date-picker). Suggestions remain arrowless, following [InputMenu's default](https://ui.nuxt.com/docs/components/input-menu#arrow), even though this adapter composes UPopover internally. Ordinary tooltips, selects and dropdown/navigation popups keep their optional arrows off by default. Field-failure tooltips retain their existing enabled arrow as a deliberate anchored-feedback adaptation, not a toolkit default. Popup pointers are distinct from disclosure chevrons. These defaults require no business-side CSS or arrow markup; corresponding control presentation takes precedence over the capabilities of an internal positioning primitive.


### Context menus during window resizing

The adapter uses core's backend helper `useUiMenuPoint` to retain the original click coordinates and derive an effective point constrained to the current document viewport. Shrinking past the original click recalculates the anchor; expanding restores it where possible. A changed effective point updates the virtual reference passed to Reka DropdownMenuContent. Native Floating UI auto-update, collision padding, flipping and available-size constraints continue to own placement. Button and keyboard invocation keep their element anchors. Resize preserves menu identity, open state and focus; shared point observers disconnect on deactivation/unmount. This addresses ordinary window resizing; it does not claim separate pinch-zoom or virtual-keyboard acceptance. Verify root and nested menus across shrink/expand and ensure commands remain reachable. Automated DOM tests cover state/wiring; browser geometry remains a separate acceptance check.

The text view carries its private width variable through a display:contents context because UInput forwards style attributes to its input. Its native editor root retains allocation and explicit z-order registration; the transparent context is not a stacking surface.


## Compound-control baseline alignment

The backend declares `layout.baseline.v1` for horizontal UiLayout/UiFlowLayout rows, with and without wrapping. The existing native CSS Grid/Flexbox allocation consumes `align="baseline"`; keyed allocation and stacking wrappers stay in place. Each wrapped row aligns independently. Vertical baseline alignment and UiRegionLayout baseline requests fail in core.

Input-frame editor participants supply the first editable baseline, ahead of leading icons and trailing actions. Native minimum-height surplus is centered around the content line. Button hosts use baseline vertical alignment; visible captions participate in baseline export while decorations retain their centered treatment. Field/form wrappers propagate the reference naturally; above labels expose their first line, while hidden/floating labels expose editable content. These adaptations preserve native typography, padding and control ownership. Arbitrary opaque content retains native baseline/fallback behavior; no DOM search or measured offset selects its business target.

The Shared input frame keyword row and Collections OrderSearch row exercise this behavior. Source/DOM checks do not establish painted text alignment; browser acceptance must compare actual text baselines at supported sizes, RTL, wrapping, feedback and loading states.


Framed UiTextInput also supports `minWidthCharacters` (`input.frame.min-width.v1`). The real editor allocation consumes a minimum in font-relative `ch` units; the inner native input continues to fill it. This minimum takes precedence over shrinking/percentage maxima in an insufficient host and is never a minlength constraint. Omission preserves the existing compact minimum and maximum-width behavior. OrderSearch and the Shared input frame keyword example request 20 cells; this is a business-composition choice, not a backend-wide search width.

## Neutral buttons

Uses native UButton outline with the requested semantic color (danger maps to error). Resting text/background/ring use native neutral tokens. Hover retains the native 10% semantic background tint; focus and active use native outlined semantic treatment. Disabled appearance stays neutral.

Select variant="neutral" independently of color. This fulfills the neutral-rest/semantic-interaction contract using backend-owned adaptations; it does not change omitted defaults. Test color changes, variant removal, loading/disabled behavior, keyboard focus, and light/dark themes. DOM mapping coverage does not establish browser visual acceptance.


See [Contract adaptations](contract-adaptations.md) for this backend’s native mappings, support limits, allocation defaults and verification qualifications.

## Infinite table continuation

The adapter uses UTable body-bottom for continuation, preserving the native sticky tfoot and TanStack data pipeline. Loading, append failure/Retry and completion scroll with the data, before any creation row and summary. The sentinel stays at that point. The adapter retains one announcement outside the table/loading mask; non-infinite and card status paths remain separate. Verify pending/retry/completion, bounded infinite and no-summary tables, plus switching to manual content-height accumulation, preserving keyed editor state and column alignment.

## Infinite continuation content

UiTable, UiList and collection card views forward `infinity-loading` and `infinity-complete` message-content slots with `{ message, loadedCount }`. The backend retains its loading indicator, status container, continuation position and independent sentinel; table continuation remains before creation/summary rows. Initial/refresh masks and non-infinite status paths retain their existing presentation. Missing/empty content uses the resolved default text. Core resolves per-view `messages.listAppending`/`listComplete` for visible defaults and the elected announcement. Error slots expose `placement` for initial, replacement and append recovery. See the `@uninterface/uninterface` Collection views guide, Infinite continuation content section for ownership and observable checks.

Default infinite loading/completion feedback is centered and subordinate to record text. Nuxt uses `--ui-text-dimmed` and a smaller relative text size; native table records already use `--ui-text-muted`. Both loading and completion use a centered supporting status allocation. The local loading message inherits that size instead of enlarging with control-size strategies; the backend retains its indicator. Errors, empty states and non-infinite feedback keep their own treatment. Custom infinity content inherits the status tone/alignment.

## Progress bars

Standalone and upload-hosted bars share `UiProgressBar.vue` and `progress.bar.v1`. Both measured and unknown progress use horizontal bars. See the [shared progress guide](progress.md) for this backend’s native mapping, precise range, semantic color and reduced-motion adaptations. The producer retains operation and announcement ownership.
