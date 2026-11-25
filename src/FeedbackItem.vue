<script setup lang="ts">
  import FooterActions from './FooterActions.vue'
  import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
  import { ToastProvider, ToastViewport } from 'reka-ui'
  import UToast from '@nuxt/ui/components/Toast.vue'
  import UCard from '@nuxt/ui/components/Card.vue'
  import UButton from '@nuxt/ui/components/Button.vue'
  import UProgress from '@nuxt/ui/components/Progress.vue'
  import type { ProgressProps, ButtonProps } from '@nuxt/ui'
  import { tv } from '@nuxt/ui/utils/tv'
  import theme from '#build/ui/toaster'
  import { useAppConfig } from '#imports'
  import {
    useUiFeedbackView,
    type UiFeedbackItemViewProps,
  } from '@uninterface/uninterface/backend'
  const props = defineProps<UiFeedbackItemViewProps>()
  const root = ref<HTMLElement>()
  const { events, summary, role } = useUiFeedbackView(props, root)
  const config = useAppConfig()
  const top = computed(() => props.placement.startsWith('top'))
  const ui = computed(() =>
    (
      tv({ extend: theme, ...config.ui?.toaster }) as unknown as (options: {
        position: string
      }) => Record<string, (options?: Record<string, unknown>) => string>
    )({
      position: top.value ? 'top-right' : 'bottom-right',
    }),
  )
  const now = ref(Date.now())
  let frame: number | undefined
  watch(
    () => [props.timing, props.open] as const,
    () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = undefined
      now.value = Date.now()
      if (!props.open || props.timing.startedAt === null) return
      const tick = () => {
        now.value = Date.now()
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    },
    { immediate: true },
  )
  // UToast forwards the progress object to UProgress after its own value.
  // Keep the runtime override typed locally: upstream narrows the public object
  // to color/ui even though it forwards the complete object.
  const close = computed<(ButtonProps & { 'aria-label': string }) | false>(
    () => (props.dismissible ? { 'aria-label': props.closeLabel } : false),
  )
  const progress = computed<
    false | Pick<ProgressProps, 'color' | 'ui' | 'modelValue'>
  >(() => {
    const { duration, remaining, startedAt } = props.timing
    if (!duration || remaining === null) return false
    return {
      modelValue:
        (Math.max(
          0,
          remaining -
            (startedAt === null ? 0 : Math.max(0, now.value - startedAt)),
        ) /
          duration) *
        100,
    }
  })
  // Native Presence retains its own exit animation; acknowledge after the native
  // toast node has left. Mutation observation also handles reduced-motion exits.
  let observer: MutationObserver | undefined
  watch(
    () => props.open,
    async (open) => {
      if (open || props.surface !== 'toast') return
      await nextTick()
      const check = () => {
        if (!root.value?.querySelector('[data-slot="root"]')) {
          observer?.disconnect()
          props.onExited()
        }
      }
      if (root.value) {
        observer = new MutationObserver(check)
        observer.observe(root.value, { childList: true, subtree: true })
      }
      check()
    },
  )
  onBeforeUnmount(() => {
    observer?.disconnect()
    if (frame !== undefined) cancelAnimationFrame(frame)
  })
</script>
<template>
  <div
    ref="root"
    v-bind="events"
    :id="id"
    data-ui-feedback-item
    :data-feedback-surface="surface"
    :data-closing="!open || undefined"
    class="nuxt-feedback-item"
  >
    <ToastProvider
      v-if="surface === 'toast'"
      :duration="Infinity"
      disable-swipe
    >
      <UToast
        data-ui-managed-feedback
        :aria-label="title || viewportLabel"
        :ui="{ root: 'dark:bg-elevated dark:ring-accented' }"
        :open="open"
        :duration="Infinity"
        :progress="progress"
        :close="close"
        :class="ui.base({ class: 'relative inset-auto' })"
        data-expanded="true"
        data-front="true"
        :style="{
          '--transform': 'translateY(0)',
          '--offset': 0,
          '--translate-factor': top ? '1px' : '-1px',
        }"
        :color="color === 'danger' ? 'error' : (color ?? 'neutral')"
        type="background"
        @update:open="
          (value) => {
            if (!value && open) onDismissRequest()
          }
        "
      >
        <template
          v-if="title"
          #title
        >
          <span data-reka-toast-announce-exclude>{{ title }}</span>
        </template>
        <template #description>
          <div data-reka-toast-announce-exclude>
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
          </div>
        </template>
        <template
          v-if="$slots.actions"
          #actions
        >
          <FooterActions data-reka-toast-announce-exclude>
            <slot name="actions" />
          </FooterActions>
        </template>
      </UToast>
      <ToastViewport
        :label="viewportLabel"
        as="div"
        class="nuxt-feedback-native-viewport"
      />
    </ToastProvider>
    <Transition
      v-else
      name="nuxt-notification"
      appear
      @after-leave="onExited"
    >
      <UCard
        v-if="open"
        as="section"
        data-ui-managed-feedback
        class="nuxt-notification bg-default dark:bg-elevated"
        :aria-label="title"
        :style="{
          '--nuxt-notification-enter-offset': top ? '-0.75rem' : '0.75rem',
          '--nuxt-notification-color': color
            ? `var(--ui-${color === 'danger' ? 'error' : color})`
            : undefined,
        }"
        :ui="{
          header: 'shrink-0',
          title: 'flex items-start gap-3',
          body: 'flex min-h-0 flex-col',
          footer: 'shrink-0 gap-2',
        }"
      >
        <template
          v-if="title || dismissible"
          #title
        >
          <span
            v-if="title"
            class="nuxt-notification-title"
          >
            {{ title }}
          </span>
          <UButton
            v-if="dismissible"
            data-slot="close"
            class="ms-auto shrink-0"
            :icon="config.ui?.icons.close"
            color="neutral"
            variant="ghost"
            :aria-label="closeLabel"
            @click="onDismissRequest"
          />
        </template>
        <div
          class="nuxt-notification-content"
          tabindex="0"
          role="region"
          :aria-label="title || viewportLabel"
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
        </div>
        <UProgress
          v-if="progress"
          v-bind="progress"
          :color="color === 'danger' ? 'error' : (color ?? 'neutral')"
          class="nuxt-notification-progress"
        />
        <template
          v-if="$slots.actions"
          #footer
        >
          <FooterActions><slot name="actions" /></FooterActions>
        </template>
      </UCard>
    </Transition>
    <span
      class="nuxt-feedback-announcement"
      :role="role"
      :aria-live="announcement"
      aria-atomic="true"
    >
      {{ summary }}
    </span>
  </div>
</template>
