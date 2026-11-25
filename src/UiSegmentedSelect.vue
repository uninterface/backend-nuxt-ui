<script setup lang="ts">
  import { uiFocusPresentation } from './focus'
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()
  import { computed, ref, watchPostEffect, onUpdated } from 'vue'
  import {
    useUiChoiceGroupView,
    useUiFieldDescription,
    useUiFieldFailure,
  } from '@uninterface/uninterface/backend'
  import type { UiChoiceGroupViewProps } from '@uninterface/uninterface/backend'
  import { useControlSize } from './controlSize'
  import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiChoiceGroupViewProps>()
  const emit = defineEmits<{ choose: [key: string]; blur: [] }>()
  const root = ref<HTMLElement>()
  const size = useControlSize('UiSegmentedSelect')
  // The hidden indicator leaves an empty native flex item before the caption.
  // Baseline-align both items so FormField's horizontal label uses the caption
  // baseline, not the empty indicator container's synthesized baseline.
  // RadioGroup's table variant shares card padding. Joined segments use the
  // native Button spacing scale, accounting for table borders inside that
  // height budget rather than adding them outside a ring-based input height.
  const segmentSpacing = computed(
    () =>
      ({
        xs: 'px-2 py-[calc(var(--spacing)-1px)]',
        sm: 'px-2.5 py-[calc(var(--spacing)*1.5-1px)]',
        md: 'px-2.5 py-[calc(var(--spacing)*1.5-1px)]',
        lg: 'px-3 py-[calc(var(--spacing)*2-1px)]',
        xl: 'px-3 py-[calc(var(--spacing)*2-1px)]',
      })[size.value ?? 'md'],
  )
  const description = useUiFieldDescription(() => props.binding, 'replace-help')
  const failure = useUiFieldFailure(() => props.binding)
  const describedBy = computed(
    () =>
      [
        description.value,
        props.status.message ? `${props.binding.id}-source-status` : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined,
  )
  const selected = computed(
    () => props.options.find((option) => option.selected)?.key,
  )
  function targets() {
    return Array.from(
      root.value?.querySelectorAll<HTMLElement>(
        'input[type=radio], input[type=checkbox], [role=radio], [role=checkbox]',
      ) ?? [],
    )
      .filter(
        (element) =>
          element.getAttribute('aria-hidden') !== 'true' &&
          element.tabIndex >= -1,
      )
      .flatMap((element) => {
        const key =
          element
            .closest('[data-uninterface-key]')
            ?.getAttribute('data-uninterface-key') ??
          (element.getAttribute('value')?.startsWith('choice:')
            ? decodeURIComponent(element.getAttribute('value')!.slice(7))
            : undefined)
        return key === null || key === undefined ? [] : [{ key, element }]
      })
  }
  const { focus, keydown, focusout } = useUiChoiceGroupView(
    props,
    () => false,
    () => root.value,
    targets,
    (key) => emit('choose', key),
    () => emit('blur'),
    { fieldLabel: true },
  )
  defineExpose({ focus })
  // Nuxt's native list descriptions have no input association. Keep its slots
  // and theme, adding IDs and ARIA relationships on the actual Reka targets.
  function syncDescriptions() {
    for (const target of targets()) {
      const index = props.options.findIndex(
        (option) => option.key === target.key,
      )
      if (index < 0) continue
      target.element.setAttribute('aria-label', props.options[index].label)
      const item = target.element.closest('[data-slot=item]')
      const help = item?.querySelector('[data-slot=description]')
      if (help) help.id = `${props.binding.id}-option-${index}-help`
      const descriptions = optionDescription(index)
      if (descriptions)
        target.element.setAttribute('aria-describedby', descriptions)
      else target.element.removeAttribute('aria-describedby')
      if (props.binding.invalid)
        target.element.setAttribute('aria-invalid', 'true')
      else target.element.removeAttribute('aria-invalid')
    }
  }
  watchPostEffect(syncDescriptions)
  onUpdated(syncDescriptions)
  function optionDescription(index: number) {
    return (
      [
        description.value,
        props.options[index].description
          ? `${props.binding.id}-option-${index}-help`
          : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined
    )
  }
</script>
<template>
  <div
    ref="root"
    v-bind="$attrs"
    :id="binding.id"
    :role="'group'"
    :aria-label="label"
    :aria-describedby="describedBy"
    :aria-invalid="binding.invalid || undefined"
    :aria-disabled="binding.disabled || undefined"
    :aria-busy="binding.validating || status.pending || undefined"
    :class="uiFocusPresentation.class"
    data-uninterface-segmented-select
    data-uninterface-choice-group
    class="nuxt-choice-group"
    @keydown.capture="keydown"
    @focusout="focusout"
  >
    <div class="segmented-scroll">
      <URadioGroup
        :id="`${binding.id}-radios`"
        :name="binding.id"
        :aria-label="label"
        :aria-required="binding.required || undefined"
        :aria-describedby="describedBy"
        :aria-invalid="binding.invalid || undefined"
        :model-value="
          selected === undefined ? '' : `choice:${encodeURIComponent(selected)}`
        "
        :items="
          options.map((option) => ({
            value: `choice:${encodeURIComponent(option.key)}`,
            label: option.label,
            description: option.description,
            disabled: option.disabled || binding.disabled || !available,
          }))
        "
        :orientation="orientation"
        variant="table"
        indicator="hidden"
        :size="size"
        :color="failure ? 'error' : undefined"
        :highlight="failure"
        :ui="{
          base: 'nuxt-control-focus absolute start-0 top-0',
          fieldset: 'flex-nowrap w-full min-w-max',
          item: `relative items-baseline whitespace-nowrap flex-1 min-w-max outline-offset-[-3px] ${segmentSpacing}`,
        }"
        loop
        @update:model-value="
          typeof $event === 'string' &&
          emit('choose', decodeURIComponent($event.slice(7)))
        "
      />
    </div>
    <div
      v-for="item in retained"
      :key="item.key"
      data-uninterface-retained
      class="mt-2"
    >
      {{ item.label }}
      <template v-if="unavailableLabel">— {{ unavailableLabel }}</template>
    </div>
    <div
      :id="`${binding.id}-source-status`"
      role="status"
      :data-uninterface-source-state="status.state"
      :class="status.message ? 'mt-2' : undefined"
    >
      {{ status.message }}
    </div>
  </div>
</template>

<style scoped>
  .nuxt-choice-group {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .segmented-scroll {
    max-width: 100%;
    overflow-x: auto;
  }
</style>
