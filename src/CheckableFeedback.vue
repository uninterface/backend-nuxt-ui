<script setup lang="ts">
  import { useFieldTheme } from './fieldTheme'
  const props = defineProps<{
    id: string
    feedback: {
      help?: string | null
      issue?: string | null
      size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    }
  }>()
  const theme = useFieldTheme(() => props.feedback.size)
</script>
<template>
  <span class="nuxt-checkable-description">
    <span
      v-if="feedback.help"
      :id="`${id}-help`"
      :class="theme.help()"
      class="nuxt-checkable-help"
    >
      {{ feedback.help }}
    </span>
    <span
      v-if="feedback.issue"
      :id="`${id}-issue`"
      :class="theme.error()"
      class="nuxt-checkable-error"
    >
      {{ feedback.issue }}
    </span>
  </span>
</template>
