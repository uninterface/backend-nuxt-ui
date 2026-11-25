<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import type { UiFileCollectionViewProps } from '@uninterface/uninterface/backend'
  import UButton from '@nuxt/ui/components/Button.vue'
  defineProps<UiFileCollectionViewProps>()
</script>
<template>
  <ul class="nuxt-ui-file-collection">
    <li
      v-for="file in files"
      :key="file.key"
    >
      <slot :file="file" />
      <UButton
        v-if="removable"
        type="button"
        :disabled="disabled"
        :aria-label="`${removeLabel}: ${file.name}`"
        @click="remove(file.key)"
      >
        {{ removeLabel }}
      </UButton>
    </li>
  </ul>
</template>
