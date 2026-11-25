<script setup lang="ts">
  import UiProgressBar from './UiProgressBar.vue'
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import {
    useUiUploadProgressView,
    type UiUploadProgressViewProps,
  } from '@uninterface/uninterface/backend'
  import UButton from '@nuxt/ui/components/Button.vue'
  defineProps<UiUploadProgressViewProps>()
  const { root } = useUiUploadProgressView()
</script>
<template>
  <div
    v-if="active || issue || canRetry"
    ref="root"
    role="group"
    :aria-label="fileName || undefined"
    tabindex="-1"
    :data-recovery="!active ? '' : undefined"
    data-ui-upload-progress
    :data-cancellable="canCancel || canRetry ? '' : undefined"
    class="nuxt-ui-upload-progress"
  >
    <span
      v-if="fileName"
      data-ui-file-name
      class="upload-progress-name"
      :title="fileName"
    >
      {{ fileName }}
    </span>
    <div class="upload-progress-body">
      <div
        v-if="active || issue"
        class="upload-progress-context"
      >
        <UiProgressBar
          v-if="active"
          v-bind="bar"
        />
        <span
          v-if="issue"
          :id="issueId"
          role="status"
          data-upload-transfer-issue
          class="upload-transfer-issue"
          :title="issue"
        >
          {{ issue }}
        </span>
        <span
          v-if="active && announcement === 'polite'"
          role="status"
          class="upload-announcement"
        >
          {{ label }}
        </span>
      </div>
      <div
        v-if="canCancel || canRetry"
        class="upload-progress-actions"
      >
        <UButton
          v-if="canCancel"
          type="button"
          color="neutral"
          variant="outline"
          data-upload-action="cancel"
          :aria-label="cancelAccessibleLabel"
          @click="cancel()"
        >
          {{ cancelLabel }}
        </UButton>
        <UButton
          v-if="canRetry"
          type="button"
          color="neutral"
          variant="outline"
          data-upload-action="retry"
          :aria-describedby="issue ? issueId : undefined"
          :disabled="retryDisabled"
          @click="retry()"
        >
          {{ retryLabel }}
        </UButton>
      </div>
    </div>
  </div>
</template>
