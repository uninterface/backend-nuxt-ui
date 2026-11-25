<script setup lang="ts">
  import { onScopeDispose, ref } from 'vue'
  import {
    UiButton,
    UiDrawer,
    UiField,
    UiMenu,
    UiNavMenu,
    UiNavbar,
    UiSegmentedSelect,
    UiSelect,
    UiStrategy,
    createUiDrawerControl,
    createUiEntryControl,
    createUiFieldControl,
    uiFieldLabels,
  } from '@uninterface/uninterface'

  const scenario = new URLSearchParams(location.search).get('scenario')
  const choice = createUiFieldControl('one')
  const entries = createUiEntryControl([
    { key: 'one', label: 'First' },
    { key: 'two', label: 'Second' },
    { key: 'three', label: 'Third' },
  ])
  onScopeDispose(entries.dispose)
  const lastCommand = ref('')
  const commands = createUiEntryControl(
    [
      { key: 'refresh', label: 'Refresh' },
      { kind: 'separator', key: 'before-actions' },
      {
        kind: 'group',
        key: 'actions',
        label: 'Actions',
        entries: [{ key: 'copy', label: 'Copy' }],
      },
      { kind: 'separator', key: 'after-actions' },
      {
        kind: 'submenu',
        key: 'more',
        label: 'More actions',
        children: [
          { key: 'archive', label: 'Archive' },
          { key: 'delete', label: 'Delete', disabled: true },
          {
            kind: 'submenu',
            key: 'organize',
            label: 'Organize',
            children: [{ key: 'tag', label: 'Add tag' }],
          },
        ],
      },
    ],
    {
      selection: [{ key: 'actions', mode: 'multiple', keys: ['copy'] }],
    },
  )
  onScopeDispose(commands.dispose)
  const navigation = createUiEntryControl([
    {
      kind: 'submenu',
      key: 'records',
      label: 'Records',
      children: [{ key: 'directory', label: 'Directory', href: '#directory' }],
    },
    {
      kind: 'submenu',
      key: 'reports',
      label: 'Reports',
      children: [{ key: 'summary', label: 'Summary', href: '#summary' }],
    },
  ])
  onScopeDispose(navigation.dispose)
  const drawer = createUiDrawerControl()
</script>

<template>
  <main>
    <UiStrategy
      v-if="scenario === 'segmented-focus'"
      :use="uiFieldLabels('above')"
    >
      <UiNavbar aria-label="Field alignment">
        <template #actions>
          <UiField
            :field="choice"
            label="Selection"
          >
            <UiSelect :control="entries" />
          </UiField>
          <UiField
            :field="choice"
            label="Choices"
          >
            <UiSegmentedSelect :control="entries" />
          </UiField>
        </template>
      </UiNavbar>
    </UiStrategy>
    <template v-else-if="scenario === 'commands'">
      <UiMenu
        :control="commands"
        mode="popup"
        aria-label="Commands"
        @activate="lastCommand = $event"
      >
        <template #host="{ buttonTrigger }">
          <UiButton v-bind="buttonTrigger">Open commands</UiButton>
        </template>
      </UiMenu>
      <output aria-label="Last command">{{ lastCommand }}</output>
    </template>
    <UiDrawer
      v-else-if="scenario === 'drawer'"
      :control="drawer"
      mode="modal"
      edge="start"
      aria-label="Sections"
      preferred-extent="85%"
      max-extent="24rem"
    >
      <template #host="{ buttonTrigger }">
        <UiButton
          v-bind="buttonTrigger"
          @click="drawer.run({})"
        >
          Open sections
        </UiButton>
      </template>
      <UiNavMenu
        :control="navigation"
        presentation="vertical-tree"
        aria-label="Sections"
      />
    </UiDrawer>
  </main>
</template>
