<script setup lang="ts">
  import { computed, onScopeDispose, ref } from 'vue'
  import UAccordion from '@nuxt/ui/components/Accordion.vue'
  import {
    UiApp,
    UiCard,
    UiCollapsible,
    createUiExpansionControl,
  } from '@uninterface/uninterface'

  const order = ref(['delivery', 'billing', 'contact'])
  const labels: Record<string, string> = {
    delivery: 'Delivery information',
    billing:
      'Billing information with a longer summary that wraps on narrow screens',
    contact: 'Contact information',
  }
  const disabled = ref(false)
  const nativeExpanded = ref<string[]>([])
  const control = createUiExpansionControl({ mode: 'multiple' })
  const items = computed(() =>
    order.value.map((value) => ({ value, label: labels[value] })),
  )
  onScopeDispose(() => control.dispose())
</script>
<template>
  <UiApp>
    <button
      data-reorder
      @click="order = [...order].reverse()"
    >
      Reverse order
    </button>
    <button
      data-remove
      @click="order = order.filter((key) => key !== 'contact')"
    >
      Remove contact
    </button>
    <button
      data-disable
      @click="disabled = !disabled"
    >
      Toggle disabled
    </button>
    <UiCard>
      <div data-native-group>
        <UAccordion
          v-model="nativeExpanded"
          type="multiple"
          :items="items"
          :disabled="disabled"
          :unmount-on-hide="false"
        >
          <template #body="{ item }">
            <p>Retained detail content.</p>
            <input :aria-label="`Native ${item.value} draft`" />
          </template>
        </UAccordion>
      </div>
    </UiCard>
    <UiCard>
      <div data-adapter-group>
        <UiCollapsible
          v-for="key in order"
          :key="key"
          :binding="control.bindings.collapsible(key)"
          :label="labels[key]"
          :disabled="disabled"
        >
          <p>Retained detail content.</p>
          <input :aria-label="`Adapter ${key} draft`" />
        </UiCollapsible>
      </div>
    </UiCard>
  </UiApp>
</template>
