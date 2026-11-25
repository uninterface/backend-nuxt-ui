<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, shallowRef, useId, watch } from 'vue'
  import {
    UiDrawer,
    UiPopover,
    UiModal,
    UiForm,
    UiField,
    UiTextInput,
    UiButton,
    createUiDrawerControl,
    createUiPopoverControl,
    createUiModalControl,
    createUiFormControl,
    createUiFieldControl,
  } from '@uninterface/uninterface'
  const props = defineProps<{ presentation: 'drawer' | 'popover' }>()
  const control =
    props.presentation === 'drawer'
      ? createUiDrawerControl<string>()
      : createUiPopoverControl<string>()
  const confirmation = createUiModalControl<boolean>()
  const makeForm = (value: string) =>
    createUiFormControl(
      { note: createUiFieldControl(value) },
      { acceptOnSave: true },
    )
  const form = shallowRef<ReturnType<typeof makeForm>>()
  const input = ref<InstanceType<typeof UiTextInput>>()
  const formId = useId()
  const saveOperation = shallowRef<(value: { note: string }) => Promise<void>>()
  const surface = computed(() =>
    props.presentation === 'drawer' ? UiDrawer : UiPopover,
  )
  function run(initialValue: string, save: (value: string) => Promise<void>) {
    let owned: ReturnType<typeof makeForm> | undefined
    let stop: (() => void) | undefined
    return control.run({
      setup(session) {
        owned = makeForm(initialValue)
        form.value = owned
        saveOperation.value = (value) => save(value.note)
        stop = watch(
          () => owned!.state.outcome,
          (outcome) => {
            if (outcome === 'saved')
              void session.complete(owned!.fields.note.state.input)
          },
          { flush: 'post' },
        )
      },
      opened() {
        void input.value?.focus()
      },
      async beforeClose(request) {
        if (request.status === 'completed') return true
        if (owned?.state.pending) return false
        if (!owned?.dirty.value) return true
        const decision = await confirmation.run()
        if (decision.status === 'error') throw decision.error
        return decision.status === 'completed' && decision.value
      },
      teardown() {
        stop?.()
        owned?.dispose()
        if (form.value === owned) {
          form.value = undefined
          saveOperation.value = undefined
        }
      },
    })
  }
  defineExpose({ run })
  onBeforeUnmount(() => {
    void control.dispose()
    void confirmation.dispose()
  })
</script>
<template>
  <component
    :is="surface"
    :control="control"
    mode="modal"
    title="Edit note"
  >
    <template #host="scope">
      <slot
        name="host"
        v-bind="scope"
      />
    </template>
    <template #default>
      <UiForm
        v-if="form && saveOperation"
        :id="formId"
        :control="form"
        :save="saveOperation"
        label="Edit note"
      >
        <UiField
          :field="form.fields.note"
          label="Notes"
        >
          <UiTextInput
            ref="input"
            multiline
          />
        </UiField>
      </UiForm>
      <UiModal
        :control="confirmation"
        title="Discard changes?"
      >
        <p>The note contains unsaved changes.</p>
        <template #actions="{ session }">
          <UiButton
            color="danger"
            variant="filled"
            @click="session.complete(true)"
          >
            Discard
          </UiButton>
          <UiButton
            color="primary"
            variant="neutral"
            @click="session.cancel()"
          >
            Keep editing
          </UiButton>
        </template>
      </UiModal>
    </template>
    <template #actions="{ session }">
      <UiButton
        color="primary"
        variant="filled"
        v-if="form"
        :form="formId"
        :binding="form.bindings.submitButton"
      >
        Save note
      </UiButton>
      <UiButton
        color="primary"
        variant="neutral"
        :disabled="form?.state.pending"
        @click="session.cancel()"
      >
        Cancel
      </UiButton>
    </template>
  </component>
</template>
