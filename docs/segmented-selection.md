# Segmented selection

UiSegmentedSelect uses URadioGroup with table variant and hidden indicator. Core supplies a UiChoiceGroupViewProps binding and owns field updates, validation, source state and retained values. The backend owns actual markup, focus and theme presentation.

The public component requires an ordinary UiField without group and an owner-supplied entry control. Horizontal is the default, vertical is optional. The strip scrolls locally when labels exceed the available width; it does not open a popup or truncate the choice set. Standard field feedback and size strategies remain supported. Native defaults and application theme configuration supply visual values; no business CSS is required.

Radio semantics preserve undefined/no selection and empty-string keys, skip disabled choices during arrow navigation, and retain the selected value when activated again. Local size strategies use native size APIs and preserve query barriers. Light/dark appearance follows the backend theme.

The table variant supplies joined borders and native state treatments. Its card-like item padding is adapted to Nuxt's Button spacing scale for all five sizes, keeping label-only segments compact. Option descriptions intentionally add content below the label. Component label/description paragraphs are exempt from prose margins, and an empty source-status region adds no spacing. Focus outlines are painted inside the scrollable items, without a padded outer alignment box. These adaptations belong to the backend; application radio-group theme configuration still controls native visual treatments, while adapter item spacing takes precedence over its card-padding choices.

Automated DOM regressions cover selection, codec integration, keyboard events, feedback and focus. Actual browser scrolling, visible focus, RTL geometry and assistive-technology acceptance remain separate checks.

The existing native bordered table treatment, including its subtle selected tint, remains unchanged. The fieldset fills the allocation and its segments grow to share available width, with intrinsic minima retaining full labels and local scrolling.

## Field alignment

Follow the core field alignment discipline (`@uninterface/uninterface` documentation: `docs/guides/field-alignment.md`). Navbar field peers anchor at block-start, so tall editors and feedback grow downward. The segmented scrollport has no outer padding; focus is contained inside the items while preserving theme colors and local scrolling. Segmented editors use the ordinary native FormField container, including configured theme spacing. Beside labels use its native baseline layout. Segment items align their internal indicator container and caption on the same baseline: the hidden indicator must not supply an empty synthetic baseline above the caption. The caption’s first row remains the anchor as descriptions, vertical choices and feedback grow below it. This internal item alignment is adapter-owned; native typography, theme spacing, local overflow and focus targets remain in use. Segment padding accounts for table borders inside the ordinary height budget. Verify focused scrolling and geometry in the browser.


## Ordinary field label integration

UiSegmentedSelect is one composite editor inside an ordinary UiField, not a grouped field. Remove `group` from consumers; explicit group is rejected. The backend still owns its internal named radiogroup and individual option names, requiredness, feedback associations and keyboard behavior. Overall label placement follows ordinary field strategies, retaining this backend's existing adaptations. Hidden preserves the accessible name. Activating an external field label focuses the selected enabled option, then the first available option or named fallback, without selecting a value; disabled state blocks focus. Native integrated labels retain their existing interaction. This distinction also applies to settings-container responsive strategies.
