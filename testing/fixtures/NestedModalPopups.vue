<script setup lang="ts">
  import { onScopeDispose } from 'vue'
  import {
    UiLayout,
    UiButton,
    UiModal,
    UiField,
    UiSelect,
    UiTooltip,
    createUiModalControl,
    createUiFieldControl,
    createUiEntryControl,
  } from '@uninterface/uninterface'

  const first = createUiModalControl<void>()
  const second = createUiModalControl<void>()
  const choice = createUiFieldControl('first')
  const choices = createUiEntryControl([
    { key: 'first', label: 'First choice' },
    { key: 'second', label: 'Second choice' },
  ])
  onScopeDispose(() => {
    void first.dispose()
    void second.dispose()
    choices.dispose()
  })
</script>

<template>
  <section>
    <UiButton
      data-testid="stacking-open"
      @click="first.run()"
    >
      Open first dialog
    </UiButton>
    <UiModal
      :control="first"
      title="Nested dialogs and owned popups"
    >
      <UiLayout>
        <UiField
          :field="choice"
          label="Choose a value"
        >
          <UiSelect :control="choices" />
        </UiField>
        <UiTooltip text="Nested help">
          <template #host="{ trigger }">
            <UiButton
              color="primary"
              variant="neutral"
              v-bind="trigger"
            >
              Help
            </UiButton>
          </template>
        </UiTooltip>
        <UiButton
          color="primary"
          variant="filled"
          data-testid="stacking-second-open"
          @click="second.run()"
        >
          Open second dialog
        </UiButton>
      </UiLayout>
      <UiModal
        :control="second"
        title="Open second dialog"
      >
        <p>Nested dialog content</p>
      </UiModal>
    </UiModal>
  </section>
</template>
