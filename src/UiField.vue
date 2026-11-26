<script setup lang="ts">
  import { uiFocusPresentation } from './focus'
  import { useUiCollectionHeaderField } from '@uninterface/uninterface/backend'
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { computed, provide, ref } from 'vue'
  import { useControlSize } from './controlSize'
  import { useFieldTheme } from './fieldTheme'
  import { fieldPresentationKey } from './fieldPresentation'
  import UFormField from '@nuxt/ui/components/FormField.vue'
  import { inputIdInjectionKey } from '@nuxt/ui/composables/useFormField'
  import FieldFailureTooltip from './FieldFailureTooltip.vue'
  import FieldContent from './FieldContent.vue'
  import { useUiFieldStrategies } from '@uninterface/uninterface/backend'
  import { useComponentProps } from '@nuxt/ui/composables/useComponentProps'
  import type { UiFieldViewBinding } from '@uninterface/uninterface/backend'
  const element = ref()
  useUiCollectionHeaderField(element, '.nuxt-input-frame, .nuxt-control-focus')
  const props = defineProps<{ binding: UiFieldViewBinding }>()
  provide(
    inputIdInjectionKey,
    computed(() => props.binding.id),
  )
  const nativeField = useComponentProps('formField', {
    orientation: undefined as 'horizontal' | 'vertical' | undefined,
  })
  const policy = useUiFieldStrategies(() => props.binding, {
    ...{ feedbackRoot: element },
    help: 'replace-help',
    defaultLabels: () =>
      nativeField.orientation === 'horizontal' ? 'beside-far' : 'above',
    failureModes: ['show-below', 'show-tooltip'],
    labels: (value) =>
      props.binding.checkable
        ? value === 'above' || value === 'beside'
        : !checkboxes.value &&
          (value === 'above' || (!props.binding.group && value === 'beside')),
  })
  const deferredIssue = computed(() =>
    'inlineFeedbackDeferred' in policy.value &&
    policy.value.inlineFeedbackDeferred === true &&
    policy.value.failure !== 'show-tooltip'
      ? policy.value.issue
      : null,
  )
  const controlSize = useControlSize('UiField')
  const customFeedback = computed(
    () =>
      policy.value.help === 'together' ||
      policy.value.failure === 'show-tooltip',
  )
  const fieldTheme = useFieldTheme(() => controlSize.value)
  const checkboxes = ref(0)
  const outerLabel = computed(
    () => !checkboxes.value || policy.value.labels !== 'adjacent',
  )
  const checkableFeedback = computed(
    () =>
      !props.binding.group &&
      checkboxes.value === 1 &&
      policy.value.checkableMode === 'flushed',
  )
  provide(fieldPresentationKey, {
    feedback: computed(() =>
      checkableFeedback.value
        ? {
            help: policy.value.showHelp ? props.binding.help : undefined,
            issue:
              policy.value.failure !== 'show-tooltip' && !deferredIssue.value
                ? policy.value.issue
                : undefined,
            size: controlSize.value,
          }
        : {},
    ),
    binding: computed(() => (props.binding.group ? undefined : props.binding)),
    registerCheckbox() {
      checkboxes.value++
      return () => {
        checkboxes.value--
      }
    },
  })
</script>
<template>
  <fieldset
    ref="element"
    :data-ui-label-align="policy.labelAlignment"
    :data-ui-checkable="policy.checkableMode"
    :data-ui-checkable-group="
      binding.checkable && binding.group ? true : undefined
    "
    :data-ui-checkable-label-align="
      binding.checkable ? policy.checkableLabelAlignment : undefined
    "
    v-if="binding.group"
    :class="fieldTheme.root({ class: 'nuxt-field-group' })"
    :aria-describedby="
      [
        policy.describedBy,
        binding.requiredLabel ? `${binding.id}-required` : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined
    "
    :aria-busy="binding.validating || undefined"
    :aria-invalid="binding.issue ? true : undefined"
    v-bind="binding.group ? uiFocusPresentation : {}"
  >
    <legend
      :style="
        policy.labels === 'hidden'
          ? {
              position: 'absolute',
              insetBlockStart: 0,
              insetInlineStart: 0,
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              clipPath: 'inset(50%)',
            }
          : undefined
      "
      :class="
        fieldTheme.label({
          class:
            policy.marker === 'required'
              ? `nuxt-required${policy.markerPosition === 'prefix' ? ' nuxt-required-prefix' : ''}`
              : undefined,
        })
      "
    >
      {{ binding.label }}
    </legend>
    <span
      v-if="binding.requiredLabel"
      :id="`${binding.id}-required`"
      class="sr-only nuxt-required-description"
    >
      {{ binding.requiredLabel }}
    </span>
    <div :class="fieldTheme.container({ class: 'nuxt-strategy-content' })">
      <FieldFailureTooltip
        :message="policy.failure === 'show-tooltip' ? policy.issue : null"
        :id="`${binding.id}-issue`"
      >
        <slot />
      </FieldFailureTooltip>
      <p
        v-if="policy.showHelp"
        :id="`${binding.id}-help`"
        :class="fieldTheme.help({ class: 'nuxt-strategy-help' })"
      >
        {{ binding.help }}
      </p>
      <div class="nuxt-strategy-feedback">
        <p
          v-if="policy.issue && policy.failure !== 'show-tooltip'"
          :id="`${binding.id}-issue`"
          :class="
            fieldTheme.error({ class: deferredIssue ? 'sr-only' : undefined })
          "
        >
          {{ policy.issue }}
        </p>
      </div>
    </div>
  </fieldset>
  <UFormField
    ref="element"
    :data-ui-label-align="policy.labelAlignment"
    :data-ui-checkable="policy.checkableMode"
    :data-ui-checkable-group="
      binding.checkable && binding.group ? true : undefined
    "
    :data-ui-checkable-label-align="
      binding.checkable ? policy.checkableLabelAlignment : undefined
    "
    v-else
    class="nuxt-strategy-field"
    :size="controlSize"
    :orientation="
      policy.labels.startsWith('beside') ? 'horizontal' : 'vertical'
    "
    :class="{
      'nuxt-labels-beside': policy.labels?.startsWith('beside'),
      'nuxt-labels-hidden': policy.labels === 'hidden',
    }"
    :label="!outerLabel ? undefined : binding.label"
    :required="
      outerLabel &&
      policy.marker === 'required' &&
      policy.markerPosition === 'suffix'
    "
    :ui="{
      container: policy.labels === 'hidden' ? 'mt-0' : undefined,
      label:
        outerLabel && policy.marker === 'required'
          ? `nuxt-required${policy.markerPosition === 'prefix' ? ' nuxt-required-prefix' : ''}`
          : undefined,
    }"
    :error="
      checkableFeedback || customFeedback || deferredIssue
        ? false
        : policy.issue || undefined
    "
    :help="checkableFeedback || customFeedback ? undefined : binding.help"
  >
    <template
      v-if="outerLabel"
      #label
    >
      {{ binding.label }}
    </template>
    <FieldContent :id="binding.id">
      <div
        class="nuxt-strategy-content"
        :class="{}"
      >
        <FieldFailureTooltip
          :message="policy.failure === 'show-tooltip' ? policy.issue : null"
          :id="`${binding.id}-issue`"
        >
          <slot />
        </FieldFailureTooltip>
        <p
          v-if="!checkableFeedback && customFeedback && policy.showHelp"
          :id="`${binding.id}-help`"
          :class="fieldTheme.help({ class: 'nuxt-strategy-help' })"
        >
          {{ binding.help }}
        </p>
        <div class="nuxt-strategy-feedback">
          <p
            v-if="
              !checkableFeedback &&
              customFeedback &&
              !deferredIssue &&
              policy.issue &&
              policy.failure !== 'show-tooltip'
            "
            :id="`${binding.id}-issue`"
            :class="fieldTheme.error()"
          >
            {{ policy.issue }}
          </p>
        </div>
        <span
          v-if="deferredIssue"
          :id="`${binding.id}-issue`"
          class="sr-only"
        >
          {{ deferredIssue }}
        </span>
      </div>
    </FieldContent>
    <template
      v-if="
        !checkableFeedback && !customFeedback && !deferredIssue && policy.issue
      "
      #error
    >
      <span :id="`${binding.id}-issue`">{{ policy.issue }}</span>
    </template>
    <template
      v-if="!checkableFeedback && !customFeedback && binding.help"
      #help
    >
      <span :id="`${binding.id}-help`">{{ binding.help }}</span>
    </template>
  </UFormField>
</template>
