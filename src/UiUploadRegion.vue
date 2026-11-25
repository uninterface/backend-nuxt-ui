<script setup lang="ts">
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  import {
    useUiUploadRegionView,
    type UiUploadRegionViewProps,
  } from '@uninterface/uninterface/backend'
  import { computed } from 'vue'
  import { tv } from '@nuxt/ui/utils/tv'
  import theme from '#build/ui/file-upload'
  import UAvatar from '@nuxt/ui/components/Avatar.vue'
  import { useAppConfig } from '#imports'
  import { useComponentProps } from '@nuxt/ui/composables/useComponentProps'
  import { useControlSize } from './controlSize'
  import Preview from './UiFilePreview.vue'
  import Progress from './UiUploadProgress.vue'
  import UploadIcon from './icons/upload.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import RemoveIcon from './icons/delete.vue'
  defineOptions({ inheritAttrs: false })
  const props = defineProps<UiUploadRegionViewProps>()
  const {
    root,
    input,
    dragging,
    labelled,
    choose,
    changed,
    dragover,
    dragleave,
    drop,
    focus,
  } = useUiUploadRegionView(props)
  const appConfig = useAppConfig()
  const defaults = useComponentProps('fileUpload', {
    icon: undefined as string | false | undefined,
    color: undefined as string | undefined,
  })
  const size = useControlSize('UiUploadRegion')
  // Native FileUpload's area is a role=button and its single mode truncates
  // batches. Reuse its public theme and avatar, keeping a group boundary and
  // one guarded acceptance path for our independently interactive contents.
  const ui = computed(
    () =>
      tv({ extend: theme, ...appConfig.ui?.fileUpload })({
        variant: 'area',
        layout: 'grid',
        position: 'outside',
        size: size.value,
        color: defaults.color,
        dropzone: props.canAcquire,
        interactive: props.canAcquire,
        disabled: props.binding.disabled,
        highlight: props.binding.invalid || !!props.issue,
      } as any) as unknown as Record<string, (options?: any) => string>,
  )
  defineExpose({ focus })
</script>
<template>
  <div
    ref="root"
    v-bind="$attrs"
    role="group"
    :aria-label="label || chooseLabel"
    :aria-busy="busy || undefined"
    :aria-disabled="binding.disabled || undefined"
    :aria-describedby="labelled['aria-describedby']"
    :tabindex="binding.disabled ? undefined : -1"
    data-ui-upload-region
    :data-upload-phase="phase"
    :data-upload-error="!!issue || undefined"
    :data-upload-recovery="!!issue || !!progress?.canRetry || undefined"
    :class="ui.base({ class: 'nuxt-ui-upload-region' })"
    :data-extent="extent"
    :style="
      allocatedHeight === undefined
        ? undefined
        : { blockSize: allocatedHeight + 'px' }
    "
    :data-drop-ready="canAcquire || undefined"
    :data-dragging="(dragging && canAcquire) || undefined"
    :data-invalid="binding.invalid || !!issue || undefined"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
  >
    <span
      v-if="requiredLabel"
      :id="binding.id + '-upload-required'"
      class="upload-required-description"
    >
      {{ requiredLabel }}
    </span>
    <input
      ref="input"
      type="file"
      hidden
      :accept="accept"
      :capture="capture"
      :disabled="!canAcquire"
      @change="changed"
    />
    <button
      v-bind="labelled"
      type="button"
      data-upload-choose
      :title="chooseLabel"
      v-if="phase === 'ready' && !issue && !progress?.canRetry"
      :class="ui.wrapper({ class: 'nuxt-ui-upload-choose' })"
      :disabled="!canAcquire"
      @click="choose"
    >
      <UAvatar
        v-if="defaults.icon !== false"
        :icon="defaults.icon ?? appConfig.ui?.icons?.upload"
        :size="size"
        :class="ui.avatar()"
        data-slot="avatar"
        aria-hidden="true"
      />
      <span :class="ui.label()">
        {{ chooseLabel }}
      </span>
    </button>
    <UButton
      v-else-if="phase === 'ready'"
      v-bind="labelled"
      type="button"
      color="neutral"
      variant="outline"
      square
      :size="size"
      data-upload-choose
      :title="chooseLabel"
      :disabled="!canAcquire"
      @click="choose"
    >
      <UploadIcon
        aria-hidden="true"
        class="nuxt-ui-upload-recovery-icon"
      />
    </UButton>
    <span
      v-if="
        fileName &&
        !preview &&
        !(
          progress?.fileName &&
          (progress.active || progress.issue || progress.canRetry)
        )
      "
      data-ui-file-name
      :title="fileName ?? undefined"
      class="nuxt-ui-upload-name"
    >
      {{ fileName }}
    </span>
    <div
      v-if="!progress?.issue"
      :id="binding.id + '-upload-issue'"
      role="status"
      class="nuxt-ui-upload-feedback"
      :title="issue ?? undefined"
    >
      {{ issue }}
    </div>
    <Progress
      v-if="progress"
      v-bind="progress"
    />
    <div
      v-if="preview"
      data-upload-preview
      class="nuxt-ui-upload-preview"
    >
      <Preview
        v-bind="preview"
        :presentation="issue ? 'row' : preview.presentation"
      />
    </div>
    <div
      v-if="actions.length"
      class="nuxt-ui-upload-actions"
    >
      <UButton
        v-for="action in actions"
        :key="action.name"
        type="button"
        color="neutral"
        :variant="action.name === 'remove' ? 'ghost' : 'outline'"
        :square="action.name === 'remove'"
        :data-upload-action="action.name"
        :aria-label="
          action.accessibleLabel ??
          (action.name === 'remove' ? action.label : undefined)
        "
        :title="action.name === 'remove' ? action.label : undefined"
        :disabled="action.disabled"
        @click="action.invoke"
      >
        <RemoveIcon
          v-if="action.name === 'remove'"
          aria-hidden="true"
          class="upload-remove-icon"
        />
        <template v-if="action.name !== 'remove'">{{ action.label }}</template>
      </UButton>
    </div>
  </div>
</template>
