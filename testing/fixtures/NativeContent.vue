<script setup lang="ts">
  import { onUnmounted } from 'vue'
  import {
    UiNavMenu,
    UiBreadcrumbs,
    UiBreadcrumb,
    UiField,
    UiTextInput,
    UiStrategy,
    UiButton,
    UiModal,
    createUiEntryControl,
    createUiFieldControl,
    createUiModalControl,
    uiFieldHelp,
  } from '@uninterface/uninterface'
  const navigation = createUiEntryControl([
    { key: 'overview', label: 'Overview', href: '#overview' },
    {
      key: 'more',
      kind: 'submenu',
      label: 'More',
      children: [{ key: 'details', label: 'Details', href: '#details' }],
    },
  ])
  const name = createUiFieldControl('', undefined, [
    (value) => (value.trim() ? null : 'Enter a name.'),
  ])
  const modal = createUiModalControl<void>()
  onUnmounted(() => {
    navigation.dispose()
    modal.dispose()
  })
</script>
<template>
  <main>
    <section data-native-copy>
      <h1>Native content</h1>
      <h2>Delivery review</h2>
      <p>
        Review
        <strong>important details</strong>
        and
        <em>changed destinations</em>
        .
      </p>
      <a href="#details">Read the details</a>
      <ul>
        <li>Invoice</li>
        <li>Packing list</li>
      </ul>
      <ol
        v-for="type in ['1', 'a', 'A', 'i', 'I']"
        :key="type"
        :type="type as '1' | 'a' | 'A' | 'i' | 'I'"
        :data-numbering="type"
        start="3"
      >
        <li>First step</li>
        <li>Second step</li>
      </ol>
      <p>
        <mark>Updated</mark>
        <kbd>Enter</kbd>
      </p>
      <pre>  DELIVERY-{{ '0123456789'.repeat(20) }}</pre>
    </section>
    <section data-native-overrides>
      <h2 class="text-sm font-normal">Application heading</h2>
      <p class="mb-8">Application spacing</p>
      <ol
        type="A"
        class="list-disc"
      >
        <li>Application markers</li>
      </ol>
      <a
        href="#details"
        class="no-underline"
      >
        Application link
      </a>
    </section>
    <UiBreadcrumbs aria-label="Multi-level trail">
      <UiBreadcrumb href="#home">Home</UiBreadcrumb>
      <UiBreadcrumb href="#documents">Documents</UiBreadcrumb>
      <UiBreadcrumb>Delivery</UiBreadcrumb>
    </UiBreadcrumbs>
    <a href="#example">Example link</a>
    <UiNavMenu
      :control="navigation"
      model-value="overview"
      aria-label="Content navigation"
    />
    <UiStrategy :use="uiFieldHelp('together')">
      <UiField
        :field="name"
        label="Name"
        help="Use the recipient name."
      >
        <UiTextInput />
      </UiField>
    </UiStrategy>
    <UiButton @click="name.validate()">Validate</UiButton>
    <UiButton @click="modal.run()">Open dialog</UiButton>
    <UiModal
      :control="modal"
      title="Native title"
    >
      <h2 data-dialog-heading>Authored heading</h2>
      <p>Authored dialog prose retains paragraph spacing.</p>
    </UiModal>
  </main>
</template>
