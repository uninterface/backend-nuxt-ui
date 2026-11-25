<script setup lang="ts">
  import { onScopeDispose, ref } from 'vue'
  import {
    UiDrawer,
    UiButton,
    UiCard,
    UiLayout,
    UiField,
    UiTextInput,
    createUiExpansionControl,
    createUiFieldControl,
  } from '@uninterface/uninterface'
  import OverlayEditor from './OverlayEditor.vue'
  const drawer = ref<InstanceType<typeof OverlayEditor>>()
  const popover = ref<InstanceType<typeof OverlayEditor>>()
  const panels = createUiExpansionControl()
  const scratch = createUiFieldControl('')
  async function edit(editor: InstanceType<typeof OverlayEditor> | undefined) {
    if (!editor) return
    await editor.run('', async () => {})
  }
  onScopeDispose(() => {
    panels.dispose()
  })
</script>
<template>
  <UiLayout direction="vertical">
    <UiCard>
      <template #header>Modal drawer</template>
      <OverlayEditor
        ref="drawer"
        presentation="drawer"
      >
        <template #host="{ buttonTrigger }">
          <UiButton
            color="primary"
            variant="filled"
            v-bind="buttonTrigger"
            data-testid="open-modal-drawer"
            @click="edit(drawer)"
          >
            Edit note
          </UiButton>
        </template>
      </OverlayEditor>
    </UiCard>
    <UiCard>
      <template #header>Panel drawer</template>
      <UiDrawer
        mode="panel"
        :binding="panels.bindings.drawer('notes')"
        title="Scratchpad"
        edge="start"
        lazy
      >
        <template #host="{ buttonTrigger }">
          <UiButton
            color="primary"
            variant="filled"
            v-bind="buttonTrigger"
            data-testid="toggle-panel-drawer"
          >
            Scratchpad
          </UiButton>
        </template>
        <template #default>
          <UiField
            :field="scratch"
            label="Notes"
          >
            <UiTextInput multiline />
          </UiField>
        </template>
        <template #footer>
          <span data-testid="scratchpad-retention">
            Notes are retained while closed.
          </span>
        </template>
      </UiDrawer>
    </UiCard>
    <UiCard>
      <template #header>Popover</template>
      <OverlayEditor
        ref="popover"
        presentation="popover"
      >
        <template #host="{ buttonTrigger }">
          <UiButton
            color="primary"
            variant="filled"
            v-bind="buttonTrigger"
            data-testid="open-popover"
            @click="edit(popover)"
          >
            Edit note
          </UiButton>
        </template>
      </OverlayEditor>
    </UiCard>
  </UiLayout>
</template>
