<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import { useId } from 'vue'
  import FieldContent from './FieldContent.vue'
  import UInput from '@nuxt/ui/components/Input.vue'
  import UFormField from '@nuxt/ui/components/FormField.vue'
  import { useUiFieldStrategies } from '@uninterface/uninterface/backend'
  import FieldFailureTooltip from './FieldFailureTooltip.vue'
  import type { UiPaginatorJumperViewProps } from '@uninterface/uninterface/backend'
  const props = defineProps<UiPaginatorJumperViewProps>()
  const id = `paginator-jumper-${useId()}`
  const policy = useUiFieldStrategies(
    () => ({
      id,
      label: props.label,
      issue: props.error || null,
      validating: false,
      describedBy: props.error ? `${id}-issue` : undefined,
    }),
    { failureModes: ['show-tooltip', 'show-below'] },
  )
  function keydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.isComposing) return
    event.preventDefault()
    event.stopPropagation()
    void props.commit('enter')
  }
</script>
<template>
  <UFormField
    class="nuxt-paginator-jumper"
    orientation="horizontal"
    :ui="{
      wrapper: 'shrink-0',
      label: 'whitespace-nowrap',
      container: 'min-w-0',
    }"
    :label="label"
    :error="false"
    :aria-busy="pending"
  >
    <FieldContent :id="id">
      <FieldFailureTooltip
        :message="policy.failure === 'show-tooltip' ? policy.issue : null"
        :id="`${id}-issue`"
      >
        <UInput
          :id="id"
          :color="error ? 'error' : undefined"
          :highlight="Boolean(error)"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="policy.describedBy"
          :model-value="value"
          :disabled="disabled"
          inputmode="numeric"
          autocomplete="off"
          @update:model-value="(value) => update(String(value))"
          @keydown="keydown"
          @blur="commit('blur')"
        />
      </FieldFailureTooltip>
      <div
        v-if="policy.issue && policy.failure === 'show-below'"
        :id="`${id}-issue`"
        class="text-error text-sm"
        role="alert"
      >
        {{ policy.issue }}
      </div>
    </FieldContent>
  </UFormField>
</template>
