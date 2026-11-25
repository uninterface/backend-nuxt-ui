<script setup lang="ts">
  import {
    useUiCollectionBadgeReorder,
    type UiCollectionBadgeReorder,
  } from '@uninterface/uninterface/backend'
  import { ref } from 'vue'
  import UBadge from '@nuxt/ui/components/Badge.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  const props = defineProps<{
    label: string
    removeLabel: string
    disabled: boolean
    reorder?: UiCollectionBadgeReorder
  }>()
  const removeButton = ref<InstanceType<typeof UButton>>()
  defineExpose({
    focus() {
      if (!props.disabled) removeButton.value?.$el?.focus()
    },
  })
  const reorderBody = ref<HTMLElement>()
  const reorderView = useUiCollectionBadgeReorder(reorderBody, () => props)
  const emit = defineEmits<{ remove: [] }>()
  function remove() {
    if (!props.disabled) emit('remove')
  }
</script>
<template>
  <UBadge
    class="nuxt-query-badge"
    color="neutral"
    variant="soft"
    role="group"
    :aria-label="label"
  >
    <span
      ref="reorderBody"
      class="nuxt-query-badge-content"
      v-bind="reorderView.bindings.value"
    >
      <slot />
    </span>
    <span
      v-if="reorder"
      class="nuxt-query-badge-announcement"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ reorderView.announcement.value }}
    </span>
    <UButton
      ref="removeButton"
      type="button"
      color="neutral"
      variant="link"
      size="xs"
      :disabled="disabled"
      :aria-label="removeLabel"
      @click="remove"
    >
      <slot name="remove" />
    </UButton>
  </UBadge>
</template>
