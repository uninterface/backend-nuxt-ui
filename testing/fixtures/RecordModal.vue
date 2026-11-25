<script setup lang="ts">
  import { ref } from 'vue'
  import {
    createUiEntryControl,
    createUiFieldControl,
    createUiModalControl,
    UiButton,
    UiField,
    UiLayout,
    UiModal,
    UiSelect,
    UiTextInput,
  } from '@uninterface/uninterface'

  const record = createUiModalControl<void>()
  const confirmation = createUiModalControl<boolean>()
  const longContent = createUiModalControl<void>()
  const name = createUiFieldControl('Acme')
  const category = createUiFieldControl('customer')
  const choices = createUiEntryControl([
    { key: 'customer', label: 'Customer' },
    { key: 'supplier', label: 'Supplier' },
  ])
  const confirmChanges = ref(true)

  function openRecord() {
    name.reset()
    category.reset()
    confirmChanges.value = true
    return record.run({
      async beforeClose() {
        if (!confirmChanges.value || name.state.input === 'Acme') return true
        const result = await confirmation.run()
        return result.status === 'completed' && result.value
      },
    })
  }

  function cancel() {
    confirmChanges.value = false
    return record.state.session?.cancel()
  }
</script>

<template>
  <UiButton @click="openRecord()">Edit record</UiButton>
  <UiButton @click="longContent.run()">Read long content</UiButton>
  <UiModal
    :control="record"
    title="Record dialog"
  >
    <UiLayout>
      <UiField
        :field="name"
        label="Name"
      >
        <UiTextInput />
      </UiField>
      <UiField
        :field="category"
        label="Category"
      >
        <UiSelect :control="choices" />
      </UiField>
    </UiLayout>
    <UiModal
      :control="confirmation"
      title="Discard changes?"
    >
      <p>The record has unsaved changes.</p>
      <template #actions="{ session }">
        <UiButton @click="session.complete(true)">Discard</UiButton>
        <UiButton @click="session.cancel()">Keep editing</UiButton>
      </template>
    </UiModal>
    <template #actions>
      <UiButton @click="cancel()">Cancel</UiButton>
    </template>
  </UiModal>
  <UiModal
    :control="longContent"
    title="Read long content"
  >
    <p
      v-for="index in 30"
      :key="index"
    >
      {{ index }}. Read the delivery instructions before completing the action.
    </p>
    <template #actions="{ session }">
      <UiButton @click="session.complete()">Done</UiButton>
    </template>
  </UiModal>
</template>
