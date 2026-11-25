# Nuxt UI contract adaptations

[Documentation index](README.md) · [Presentation and integration](presentation.md)

This backend-owned reference records native mappings, support limits and integration decisions. Shared API semantics remain in @uninterface/uninterface; native component names and concrete appearance do not add business-side parameters. This documentation move adds no runtime support or browser acceptance evidence.
## Fields, controls and strategies

Field sizing uses native FormField size/orientation. Ordinary fields support above and both beside alignments; ordinary fieldset groups keep legends above; checkable group titles participate in control-aligned/separated layout. General beside resolves to beside-far, and explicit near/far applies consistently to participating headings. Omitted/show placement resolves reactive native orientation before rendering and checkable adapt selection. Unsupported floating resolves the ordinary visible treatment. Checkable labels remain adjacent except in explicit separated presentation; required annotations default to suffix. Help replacement and below/tooltip failures are supported; embedded requests approximate below.

UiSelect/UiMultiSelect use native USelect. Multiple clear is a compact sibling UButton joined by UFieldGroup, avoiding an interactive child inside the picker trigger. Segmented selection uses RadioGroup table/hidden-indicator presentation with bordered segments. Borders participate in single-row sizing; focus is contained without an extra 3px outer scroll inset. Grouped fields consume native FormField vertical container spacing. The hidden indicator container aligns with the caption baseline; native field baseline behavior is retained. Input frames adapt UInput; browser checks cover native/text endpoints. Full-width buttons use native block facilities.

Preview regions reuse the consumed input theme. Image previews use native images, with no avatar wrapper, and an accessible contained broken-image glyph. File previews use local Lucide artwork.

Ordinary beside form-label arrangements and separated checkable label/control areas stack below a 40rem viewport. Flushed/control-aligned standalone labels and individual option labels stay adjacent. Checkable labels and group titles remain visible under hidden; see the checkable modes in [strategy support](strategies.md).

## Collections and navigation

UTable uses stable private column render functions/row IDs and manual sorting, filtering, pagination and expansion. Names and aria-sort target actual table headers. Sort headers retain the documented ghost-button composition with inherited header typography. Priority text participates in content-width measurement without duplicate accessible announcements. Column allocation uses stable UTable style metadata; native sticky=header keeps bounded headers visible. The outer collection host owns scrolling. Filter triggers use compact native icon buttons/popovers; removable criteria use UBadge with UButton.

Bounded navigation uses UPagination with localized slots; jumper uses horizontal FormField/Input and size uses native select. Footer info sits at start with size → paginator → jumper at end. Narrow navigation uses the sibling window and retains end placement/flexible info space. Context menus update Reka's virtual reference when the viewport changes.

## Feedback, surfaces and stacking

Notices map default/filled/outline/soft to subtle/solid/outline/soft; custom uncolored notices use the neutral palette. Text-led actions retain native padding, hanging their leading inset into notice space while preserving targets.

Toasts use controlled UToast/Reka with native Toaster motion and Presence exits, without shared useToast state or cached global heights. Notifications have no equivalent native service: they compose UCard/UButton with optional title/close header, full-width scrollable body and optional footer. Adapter notification motion respects reduced motion. Both use localized summary regions and UProgress driven by the core remaining-time clock; progress pauses with that clock and is absent for persistent delivery. Native outside rings/shadows have viewport clearance and native close controls remain. Guarded integration suppresses Reka document-wide Escape and duplicate announcements only for managed feedback. Floating variant requests do not select native variants.

FooterActions retains native forward-inline flow for modals, drawers, popovers and feedback, preserving DOM/Tab order. Popovers compose their native surface with modal-themed header/body/footer regions, including inherited action spacing. Generated drawer/popover theme configuration is consumed. Drawers use Vaul dragging with a functional handle and exposed-corner rounding. Drag requests go through modal guards or panel ownership; pending/denied decisions preserve content and modality. No snap-point, resizing or gesture-tuning API is exposed.

UiPopover enables its optional native arrow by the selected default. This does not apply to all internal UPopover usage: calendars/ranges follow arrowless date-picker compositions and suggestions follow arrowless InputMenu defaults. Field-failure tooltips explicitly enable an arrow. Stacking registers the Reka positioning wrapper; modal-owned popups target the dialog. The collection-select/header-separator regression remains a backend browser acceptance case, with prior environment execution limits recorded separately.

Loading regions use the configured native loading icon with an adapter mask; table loading alone does not block retained rows. Empty states map message/icon/actions to UEmpty description/leading/actions with variant=naked and UTable's empty slot.

## Temporal and appearance adaptation

Date/datetime ranges use UInputDate range (with time granularity for datetime); time intervals use UInputTime range. A private fixed reference date represents overnight ordering without system date/timezone dependence. Milliseconds and unrepresentable values use lossless text fallback. Scalar/range segment synchronization is adapter-owned.

Boundary modes use an icon-triggered named menu with choice icons. Start–separator–end positions remain; one-sided modes pair a scalar editor with an infinity badge and unrestricted uses two badges. At narrow allocations datetime ranges put start on row one and dash/end on row two, preserving rows/drafts across modes; date/time layouts retain their existing arrangement. Next-day intervals use a calendar-plus-one icon, accessible name and tooltip. External values/reset and Clear discard retained mode drafts.

Color mode uses native light/dark classes. Default font is Public Sans Variable. Clear uses Lucide eraser, more-vertical uses ellipsis-vertical, and menu-item reuses file with an independent override key. Native table/field/overlay geometry and visual acceptance remain separate from DOM integration.

See [presentation](presentation.md), [strategy support](strategies.md), [collections](collections.md), [typography](typography.md) and [customization](customization.md).

## Support and native defaults

The following mappings describe this installed adapter. Shared strategy requests can generalize to supported fallbacks; native feature availability alone does not imply adapter support. Three-level control scales map out-of-range requests to the nearest native level. Embedded validation is not implemented and is approximated to below feedback. Browser geometry, wrapping, focus paint and assistive-technology acceptance remain separate from source/DOM checks.

### Native size and field-label support

| Backend | Native editor levels | Native button levels | Supported field labels |
|---|---|---|---|
| Nuxt UI | -2/-1/0/1/2 | -2/-1/0/1/2 | above/beside-near/beside-far for ordinary fields; above for ordinary fieldset groups; checkable modes include aligned/separated titles and always-visible labels |

### Collapsible color

| Backend | Color behavior |
|---|---|
| Nuxt UI | Request ignored; existing presentation retained. |

### Upload allocation

| Backend | Minimum inline size | Minimum block size | Compact / regular / large block size |
| --- | --- | --- | --- |
| Nuxt UI | 14rem | 8rem | 8 / 10 / 16rem |

### Upload integration

| Backend | Presentation and concrete adaptation |
|---|---|
| Nuxt UI | UFileUpload's generated theme and UAvatar upload artwork, UProgress and UButton. The native area is role=button and single-file selection truncates batches. The adapter uses the native theme/public primitives with a group boundary and guarded chooser, preserving avatar/area appearance without imposing those conflicting semantics. Application fileUpload theme/default icon/size inputs remain consumed |

### Notice variants

| Backend | Omitted | filled | outline | soft |
| --- | --- | --- | --- | --- |
| Nuxt UI | Subtle | Solid | Outline | Soft |

### Multiple selection

| Backend | Presentation |
| --- | --- |
| Nuxt UI | Native USelect multiple with a compact icon button joined through UFieldGroup. The clear button is a sibling, avoiding an interactive button nested inside the selector trigger. |

### Floating feedback integration

| Backend | Implementation |
|---|---|
| Nuxt UI | Toasts use controlled UToast/Reka with native Toaster motion and Presence exits; notifications compose native UCard/UButton with adapter motion and a bounded scrollable body. Both use a localized summary region and UProgress driven by the core remaining-time clock, without shared useToast state |

### Default font families

| Backend | Family order |
|---|---|
| Nuxt UI | Public Sans Variable |


## Checkable label and description alignment

Standalone checkbox/switch labels and help/visible below-error text use the native Checkbox/Switch label and description slots, sharing the text column. FormField retains ordinary field presentation but omits duplicate checkable help/errors. The private field bridge preserves shared help-replacement/coexistence policies, stable description IDs and tooltip associations; the native slot does not create a second validator. Component descriptions reset prose paragraph margins locally. Radio and grouped checkbox options keep their native label/description arrangement.

Business authors supply the existing UiField label/help and business value; no alignment CSS or new public prop is required. Verify short/wrapped labels, descriptions present/absent, requested sizes, narrow/wide fields and both text directions while preserving label activation, keyboard behavior, disabled state and help/error associations. Whole-field flushed/control-aligned/separated arrangements are implemented; see [strategy support](strategies.md) for resolution, alignment and responsive behavior.

Checkable validation recovery focuses the first enabled checkbox or selected enabled/first enabled radio without changing values. Named group/status and form fallbacks get temporary programmatic focusability with blur/disposal cleanup. Native options retain their toolkit indicators and feedback descriptions; fallback containers use the shared backend focus-visible treatment, including forced colors and scrolling containment. Group/field wrappers do not gain standing focusability merely from validation failure.
