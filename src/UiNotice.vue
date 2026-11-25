<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import InfoIcon from './icons/info.vue'
  import SuccessIcon from './icons/success.vue'
  import WarningIcon from './icons/warning.vue'
  import ErrorIcon from './icons/error.vue'
  const icons = {
    info: InfoIcon,
    success: SuccessIcon,
    warning: WarningIcon,
    error: ErrorIcon,
  }

  import type { UiNoticeViewProps } from '@uninterface/uninterface/backend'
  const props = defineProps<UiNoticeViewProps>()
  const closeOptions = () =>
    props.dismissible
      ? ({
          'aria-label': props.dismissLabel,
        } as import('@nuxt/ui').ButtonProps & { 'aria-label': string })
      : false
  import UAlert from '@nuxt/ui/components/Alert.vue'
</script>
<template>
  <UAlert
    class="nuxt-notice"
    :ui="{ actions: 'nuxt-notice-actions' }"
    :data-variant="variant"
    :color="color === 'danger' ? 'error' : (color ?? 'neutral')"
    :variant="variant === 'filled' ? 'solid' : (variant ?? 'subtle')"
    :title="title"
    :close="closeOptions()"
    @update:open="onDismissRequest"
  >
    <template #leading="{ ui }">
      <span
        v-if="$slots.icon || kind !== 'custom'"
        :class="ui.icon()"
        class="nuxt-notice-icon"
        aria-hidden="true"
      >
        <slot
          v-if="$slots.icon"
          name="icon"
        />
        <component
          v-else-if="kind !== 'custom'"
          :is="icons[kind]"
        />
      </span>
    </template>
    <template
      v-if="$slots.default || message || details?.length"
      #description
    >
      <slot>
        <div v-if="message">{{ message }}</div>
        <ul v-if="details?.length">
          <li
            v-for="(detail, index) in details"
            :key="index"
          >
            {{ detail }}
          </li>
        </ul>
      </slot>
    </template>
    <template
      v-if="$slots.actions"
      #actions
    >
      <slot name="actions" />
    </template>
  </UAlert>
</template>
