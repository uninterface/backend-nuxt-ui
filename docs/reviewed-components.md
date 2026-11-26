# Component presentation

Nuxt UI uses USwitch, ULink, native breadcrumb theme/primitives, UTooltip/UPopover, UCalendar, UInputDate and UInputTime. Calendar values translate through @internationalized/date. Milliseconds and malformed external values remain editable as text where the native picker cannot represent them.

Password reveal preserves the editor and uses a named non-submit reveal action. Switches follow the shared switch-then-label arrangement. Search source/selection and temporal validation remain core-owned. Tooltips and suggestions use popup targets inside their owning modal. Directly owned tooltips paint below the header and footer. A managed tooltip requires at least half of its anchor area visible after clipping and overlap by known layout regions. File chooser/drop accepts one file; uploads use an application transport. Preview URLs are resolved and released by core.

Ordinary dates use **UInputDate**, times use **UInputTime**, and datetimes use **UInputDate with inline time segments**. Date editors default to year-month-day with a four-digit year and two-digit month/day. Popup calendars retain the application language independently. Nuxt owns segment order, keyboard editing, focus presentation and input styling. Locale, 12/24-hour presentation and minute/second precision map to native options. Date/datetime inputs compose the leading slot with UButton/UPopover and UCalendar, following the [InputDate popup example](https://ui.nuxt.com/docs/components/input-date). There is no duplicate time editor in a popup. Alt+ArrowDown opens the calendar; Escape dismisses it. Selection and explicit dismissal return focus to the trigger. Disabled/readonly inputs cannot open the picker; popups use the application/modal overlay target. Calendar popups have no adapter-added Close button: selection and native Escape/outside dismissal provide the interaction without a redundant footer action.

The adapter observes Reka's exported scalar and range DateField/TimeField segment contexts from Nuxt's default slot. Incomplete segments immediately update the owning control's invalid draft, so submission cannot reuse a previous complete value. Reset and external clear synchronize all segments. Native segment editing retains its normal bounds and date adjustment behavior. This integration uses the installed Nuxt 4.12.0/Reka 2.11.0 context contracts; upgrades must rerun the backend native-temporal suite, including immediate invalidation, partial edits, reset and calendar synchronization.

UInput remains the lossless fallback for explicit millisecond precision, external values the native fields cannot represent, and invalid values outside the supported temporal domain. Ordinary time ranges now use native clock segments with next-day inference and a 24-hour limit. Millisecond segments are not native InputDate/InputTime capabilities. These fallbacks preserve text for correction. Codecs consume fixed-format strings; the backend owns appearance.

Picker candidates bypass the display-text parser and are validated by the owning control. Native selection is checked before commitment; a toolkit calendar may still display a candidate that a combined datetime or interval rule later rejects. Choosing a date for an empty datetime leaves a visible incomplete draft until its time is entered. The leading boundary-mode menu switches between a native range, a scalar editor and unrestricted mode. Canonical extended-hour ends translate to ordinary native clocks with a next-day indication; the core owns the 24-hour limit.

Use the existing application-owned [customization guide](customization.md) for theme setup and stylesheet ordering. These components consume the same native theme configuration; no extra business stylesheet or generic styling wrapper is required. Keep overrides after the backend stylesheet and test teleported popup coverage in light/dark modes. Do not style only the component wrapper when the actual editor or popup lives elsewhere.

Shared control and built-DOM checks exercise state, naming, calendar/time/datetime selection, preservation of milliseconds and invalid text, disabled/readonly behavior, Escape dismissal and focus return, file replacement and tooltip associations. Check picker geometry, touch and keyboard behavior, hover continuity, modal stacking and assistive technology in the intended environment.

Suggestions compose UPopover and the generated InputMenu item, viewport, and empty-state styles, including application ui.inputMenu customization. An external host is retained rather than replaced by InputMenu’s own editor; shared mechanics coordinate its active descendant and query without native filtering.

Breadcrumbs compose Nuxt’s LinkBase, Icon and generated breadcrumb theme, including application ui.breadcrumb overrides and direction-aware separators. Links receive the native to variant; labels receive the native linkLabel slot. The installed 4.12.0 default changes ancestor text color on hover; it does not specify an underline. Applications can request an underline through their breadcrumb theme. This composition preserves target attributes and capture listeners that UBreadcrumb’s item prop picker omits, without nesting generic ULink content inside a native link.

Breadcrumb integration restores Preflight’s undecorated anchors and zero list spacing within the breadcrumb root. This prevents the ordinary native HTML content baseline from underlining breadcrumb links or adding prose list insets. These repairs stay in the base cascade layer, below application breadcrumb theme utilities. Standalone/native prose links retain their underline.

Temporal ranges compose both endpoints, separator and supporting actions inside the backend UiInputFrame view. Endpoint editors retain their own editing behavior and share one surface. Every boundary mode preserves start–separator–end order; an unbounded endpoint becomes a noninteractive neutral native badge showing infinity with an accessible endpoint description. In open modes, endpoints and the dash remain content-sized together at the logical start; remaining width sits after the range and before Clear. Owned picker state keeps the frame visually engaged while popup focus is outside it. A leading boundary-mode selector offers only allowed combinations: both specified, start only, end only, unrestricted. Mode changes retain drafts; external synchronization/reset and Clear discard them. One-sided modes show a scalar editor opposite an infinity badge; unrestricted shows two infinity badges separated by a dash and remains distinct from an absent whole value. The compact × action clears the whole range. These actions obey disabled/readonly state; an empty draft never implicitly opens a boundary.

Picker triggers occupy the leading side of the input. Their localized “Choose…” strings name the icon button and popup for assistive technology; the adapter does not add a visible popup heading from those strings.

File Clear uses the native link button treatment with compact input-relative sizing. Range endpoints use native InputDate/InputTime where supported, with the native none variant to share the enclosing input surface; documented lossless text fallbacks remain unchanged.

UiUploadRegion uses a workflow binding with retained-field or service destinations. Optional progress, preview and actions are arranged entirely by this backend. Nuxt uses the generated FileUpload area theme, UAvatar upload artwork, UProgress and UButton. Native FileUpload combines role=button area activation with single-file batch truncation; the adapter composes its theme/primitives around a group boundary and guarded chooser instead. Application ui.fileUpload slots/variants and default icon/color/size remain consumed. Changes to native file-list slots or variant/layout defaults do not select this adapter's composition. The complete named region receives drops and fits its contents within an explicit extent without scrolling; optional contents no longer reserve blank rows. Upload/association locks persist when progress or preview is absent. Focus moves to an available chooser/action or the region when a focused action disappears. Preview URL lifetime remains core-owned; controller lifetime belongs to the business composition.

The upload group is excluded from ordinary Tab traversal (tabindex=-1 while enabled). The ordinary area chooser retains native button activation while generated FileUpload utilities paint focus on the enclosing surface, with a Highlight outline in forced colors. The previous square inner outline is removed. Recovery uses a native square UButton with outline variant and its own local focus indicator and size; Retry/Cancel/Remove remain independent. Named fallback focus remains available when no action accepts focus.

The upload boundary retains FileUpload theme disabled opacity/cursor and adds the theme's muted surface background so the whole disabled area is distinguishable from the page. Its generated focus-visible theme utilities also apply when a descendant owns focus, as with the shared input frame. The previous fixed 2px outline is removed, preserving native theme focus color/width and application theme customization. Shared input-frame wrappers also lose their focus target when disabled; live disabling releases internal surface focus, and upload recovery cannot focus a disabled region.

Verify appearance and geometry in the browser, including zoom and RTL.

Bounded ranges now use UInputDate/UInputTime with range enabled, including datetime time segments. A named UDropdownMenu opened by a leading mode icon selects permitted boundary combinations. Each menu item repeats its mode icon beside its label and preserves the native selected checkmark. Reka scalar/range context access and synchronization are in temporalSegments.ts; TemporalSegments.vue is only the descendant injection host. Next-day time ranges use a private fixed CalendarDateTime anchor and display a calendar-plus-one icon beside the end with a localized “Next day” accessible name and native tooltip. Millisecond/unsupported values retain text fallback. Date calendar ranges include both days; same-day selection is valid. Contexts and native model synchronization require regression verification on Nuxt/Reka upgrades.

Native range segments receive endpoint names, field descriptions and semantic invalid state on the actual spinbuttons through a backend DOM directive after mount/update. Initial SSR segment-level naming is not verified by this integration. The native range calendar retains datetime endpoint times through partial date selection; same-day date selection is a valid one-day range.


### Narrow datetime ranges

Datetime range frames use a container query to select a two-row presentation at an available content width of 36em or less. The complete start endpoint occupies row one; the dash and complete end occupy row two. Date-only and time-only ranges retain their existing layout. Narrow desktop allocations use the same behavior as mobile allocations. Both rows remain allocated in one-sided and unrestricted modes; infinity badges stay content-sized, and unused inline space remains before Clear.

The bounded editor remains one native UInputDate range. A backend directive assigns private grid columns to its existing segment elements, including literal separators, using each endpoint's current locale order. CSS assigns start and end rows without moving nodes, replacing editors or changing native DOM order. Resizing therefore preserves focus and partial drafts. Native Left/Right navigation continues across endpoints; Up/Down continues editing the active segment. Calendar, mode and Clear remain actions of the shared frame. The adaptation does not guarantee fitting an entire endpoint into arbitrarily small allocations.

This integration depends on Nuxt's `data-slot=segment`/`separatorIcon` structure and Reka's `data-reka-date-range-field-segment-type` attributes in the pinned versions. Review these on upgrades. DOM checks cover locale changes (English, Chinese and Arabic, 12/24-hour), segment assignment, native navigation, editing and reset. Browser checks cover narrow/wide geometry, preserved focus/drafts on resizing, and stable height across modes. Check RTL presentation separately.

Temporal range-mode arrows use Nuxt UI’s native UIcon with Lucide artwork: configured arrowLeft/arrowRight icons for one-sided modes and move-horizontal for bounded ranges. The next-day indicator uses the custom calendar +1 SVG; infinity is Unicode. The backend bundles the move-horizontal asset locally alongside configured icons, with no runtime icon download.

### Concise upload states

The region shows its chooser/artwork only in the ready state. Working and retained states display file/progress or file/preview with available actions. Recovery uses one short error and a row of actions. Progress labels remain accessible without a duplicate visible caption; preview displays the filename once. Embedded previews use a compact file summary.

This backend's compact/regular/large allocations are currently 8/10/16rem. There is no shared minimum. The allocation remains stable across states; the host must respect the backend minimum size; content never introduces scrolling. These are adapter defaults, not business-authored dimensions or browser geometry acceptance.

### Image-only preview

UiImagePreview uses the container allocation or explicit dimensions, with contain by default and stretch when requested. It has no border, avatar shape, filename, caption or actions. Missing/failed content uses an accessible broken-image glyph, without visible failure prose. A parent with definite bounds retains its rectangle through failure; auto sizing cannot reserve unknown intrinsic dimensions before loading. Embedded upload previews use their region's available bounds instead of a fixed thumbnail limit. File metadata presentation remains separate.

Native img replaces UAvatar; Nuxt has no general-purpose image component matching these semantics. The broken-image glyph is adapted SVG. DOM checks pass separately from browser geometry/visual acceptance.


Upload regions declare minimum inline/block allocations and do not scroll internally. Long file/error text is abbreviated with full DOM text and title retained; recovery keeps its actions visible. This backend declares a minimum inline size of 14rem and block size of 8rem; hosts, including fill allocations, must respect those constraints. Browser acceptance of fitting is separate from DOM workflow checks.


### Upload minimum-size audit

Compact and fill omit the native chooser wrapper’s extra block padding; the area retains its native padding. This prevents nested padding from consuming the minimum allocation at larger control sizes. Delivery failures use the same single error line and recovery-action arrangement as acquisition failures, avoiding an extra filename row.

In a browser, check compact, regular, large and fill allocations at the minimum and at narrow widths. Repeat at each supported control size with known, unknown and hidden progress, long file names and errors, delivery retry, portrait and landscape previews, and no preview. Verify that visible descendants stay within the allocated region and that actions remain reachable.



### Transfer failure and retry presentation

UiUploadProgress presents both active transfer progress/Cancel and transfer failure/Cancel/Retry. Failed transfers have concise feedback and available native Cancel and Retry buttons, without a progress indicator. The file name is visible inside the progress/recovery presentation and identifies the transfer group; Retry describes its failure. The view invokes guarded producer callbacks and never creates a task. The backend retains its existing button and progress primitives and arranges feedback/actions within the allocated width.

UiUploadRegion composes the same progress view for transfer recovery, without duplicating the filename, error or Retry. Acquisition rejection and delivery failure remain region-owned. Omitting the progress indicator does not omit essential transfer feedback or selected Retry; cancellation is not an error, but an owner may retain a Retry action. Recovery layout responds to recovery participation, including cancellation without an error message. Keyboard context is preserved across standalone Retry/Cancel changes; region focus coordination includes the chooser. DOM checks cover wiring and lifetime; browser fitting and assistive-technology checks remain separate.

To verify standalone recovery, render UiUploadProgress with a named file and a failing transfer. Check that the message and Cancel and Retry remain visible at narrow widths. Repeat the failure on Retry and verify focus stays in the recovery context. Exercise the same failure inside UiUploadRegion to check that the filename and actions appear once.

### Native editing and popup boundaries

A segmented temporal control reports blur when focus leaves the whole native control, rather than when it moves between segments. Partial drafts reach core before that validation request. Multiple-selection popups consume Escape on both their trigger and popup routes before the containing native dialog can cancel, then return focus to the trigger. DOM regressions cover partial-draft validation and both Escape routes; browser modal containment remains a separate check.

Progress and transfer failure share a filename row above a context/action area. Failure uses the native danger/error foreground. Standalone messages wrap completely, including unbroken text; actions stay at logical end and wrap below if necessary. Inside UiUploadRegion, the concise summary retains full DOM text/title and Retry association. The chooser shares the identity row while the complete lower allocation is available to feedback/actions. Native action labels keep their ordinary dimensions.


Transfer-failure text uses `--ui-error`, with color and mode mapping owned by the theme. The optional shared focus helper retains keyboard context across the brief activity-to-failure rendering gap, including an immediately repeated failed Retry. Verify focus after a failure and an immediate failed retry.
