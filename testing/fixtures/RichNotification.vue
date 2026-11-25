<script setup lang="ts">
  import { h } from 'vue'
  import {
    createUiFeedbackRoute,
    createUiNotificationTarget,
    UiButton,
    UiKeyValueItem,
    UiKeyValueList,
  } from '@uninterface/uninterface'

  const route = createUiFeedbackRoute({ target: createUiNotificationTarget() })
  const entries = [
    { label: 'Batch number', value: 'A-573' },
    { label: 'Accepted records', value: '24' },
    { label: 'Needs review', value: '3' },
  ]
  function openReport() {
    route.send(
      { title: 'Delivery report' },
      {
        duration: null,
        content: () =>
          h(UiKeyValueList, () =>
            entries.map(({ label, value }) =>
              h(UiKeyValueItem, { label }, () => value),
            ),
          ),
      },
    )
  }
</script>

<template>
  <UiButton @click="openReport()">Open report notification</UiButton>
</template>
