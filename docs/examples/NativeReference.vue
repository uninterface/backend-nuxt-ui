<script setup lang="ts">
  import UAccordion from '@nuxt/ui/components/Accordion.vue'
  const nativeExpanded = ref<string>()
  import { ref, computed } from 'vue'
  import UModal from '@nuxt/ui/components/Modal.vue'
  const nativeModal = ref(false)
  import UFormField from '@nuxt/ui/components/FormField.vue'
  import UInput from '@nuxt/ui/components/Input.vue'
  import USelect from '@nuxt/ui/components/Select.vue'
  import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
  import UNavigationMenu from '@nuxt/ui/components/NavigationMenu.vue'
  const props = defineProps<{
    invalid: boolean
    loading: boolean
    disabled: boolean
    sourceState: string
  }>()
  const status = computed(
    () =>
      ({
        idle: 'Entries not loaded.',
        loading: 'Loading entries…',
        error: 'Entries could not be loaded.',
        empty: 'No entries available.',
      })[props.sourceState],
  )
  const checked = ref(true)
  const commands = computed(() => [
    { label: 'Refresh' },
    {
      label: 'Show details',
      type: 'checkbox' as const,
      checked: checked.value,
      onUpdateChecked: (value: boolean) => (checked.value = value),
    },
    {
      label: 'More',
      children: [{ label: 'Inspect' }, { label: 'Delete', disabled: true }],
    },
  ])
  const navigation = [
    { label: 'Editor', active: true },
    { label: 'Examples', children: [{ label: 'Buttons' }, { label: 'Forms' }] },
  ]
  const name = ref('Ada')
  const location = ref('Shanghai')
  const active = ref(true)
</script>
<template>
  <UAccordion
    v-model="nativeExpanded"
    :items="[{ value: 'details', label: 'Additional information' }]"
    :disabled="disabled"
    :unmount-on-hide="false"
    data-native-collapsible
  >
    <template #body><p>Retained detail content.</p></template>
  </UAccordion>
  <UButton @click="nativeModal = true">Open native modal</UButton>
  <UModal
    v-model:open="nativeModal"
    title="Modal presentation"
  >
    <template #body><p>Review the operation before continuing.</p></template>
    <template #footer>
      <UButton @click="nativeModal = false">OK</UButton>
      <UButton
        color="neutral"
        @click="nativeModal = false"
      >
        Cancel
      </UButton>
    </template>
  </UModal>
  <UNavigationMenu
    :items="navigation"
    aria-label="Native destinations"
  />
  <UFormField
    label="Name"
    help="Use a recognizable name."
    :error="invalid ? 'Enter a name.' : undefined"
  >
    <UInput
      v-model="name"
      :disabled="disabled"
    />
  </UFormField>
  <UFormField label="Location">
    <USelect
      v-model="location"
      :items="sourceState === 'ready' ? ['Shanghai'] : []"
      :loading="sourceState === 'loading'"
      :disabled="disabled"
    >
      <template #content-top>
        <div
          v-if="status"
          role="status"
          class="p-2 text-sm text-muted"
        >
          {{ status }}
        </div>
      </template>
    </USelect>
  </UFormField>
  <UCheckbox
    v-model="active"
    label="Active"
    :disabled="disabled"
    :highlight="invalid"
    :color="invalid ? 'error' : undefined"
  />
  <UButton
    :loading="loading"
    :disabled="disabled"
  >
    Save
  </UButton>
  <UButton
    color="secondary"
    :disabled="disabled"
  >
    Reset
  </UButton>
  <UButton variant="outline">Outline</UButton>
  <UDropdownMenu :items="commands">
    <UButton>Commands</UButton>
  </UDropdownMenu>
</template>
