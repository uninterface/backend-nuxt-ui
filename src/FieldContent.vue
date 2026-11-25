<script setup lang="ts">
  import { computed, inject, provide, watchEffect } from 'vue'
  import {
    inputIdInjectionKey,
    formFieldInjectionKey,
  } from '@nuxt/ui/composables/useFormField'

  import { fieldSizeKey } from './fieldPresentation'
  const nativeField = inject(formFieldInjectionKey, undefined)
  provide(
    fieldSizeKey,
    computed(
      () =>
        nativeField?.value.size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined,
    ),
  )
  const props = defineProps<{ id: string }>()
  const inputId = inject(inputIdInjectionKey, undefined)
  watchEffect(() => {
    if (inputId) inputId.value = props.id
  })
  // Nuxt UI supplies field presentation; Uninterface supplies input semantics.
  // In particular, the toolkit's generated descriptions must not overwrite
  // the associations supplied by the Uninterface binding.
  provide(formFieldInjectionKey, undefined)
</script>
<template><slot /></template>
