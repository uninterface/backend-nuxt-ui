import {
  defineComponent,
  h,
  nextTick,
  ref,
  reactive,
  inject,
  provide,
} from 'vue'
import {
  createUiToastTarget,
  createUiNotificationTarget,
  createUiFeedbackRoute,
  UiButton,
  type UiFloatingFeedbackRoute,
  type UiFloatingFeedbackTarget,
  type UiFeedbackTargetOptions,
} from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'

export async function mountFloatingFeedback(
  options: UiFeedbackTargetOptions = {},
  kind: 'toast' | 'notification' = 'notification',
  colorMode?: 'light' | 'dark',
) {
  let target!: UiFloatingFeedbackTarget,
    route!: UiFloatingFeedbackRoute,
    other!: UiFloatingFeedbackRoute
  const state = reactive({
    locale: 'en',
    mounts: 0,
    unmounts: 0,
    clicks: 0,
    disabled: false,
    errors: [] as string[],
  })
  const local = Symbol('business context')
  const Rich = defineComponent({
    props: { label: String },
    setup(props) {
      const value = ref('')
      const injected = inject(local)
      if (injected !== 'preserved') throw new Error('Lost business injection')
      state.mounts++
      return () =>
        h('div', [
          h('input', {
            'aria-label': props.label,
            value: value.value,
            onInput: (event: Event) => {
              value.value = (event.target as HTMLInputElement).value
            },
          }),
          h('p', { 'data-rich-summary': '' }, value.value),
          h(
            UiButton,
            {
              onClick: () => {
                state.clicks++
              },
            },
            () => 'Custom action',
          ),
        ])
    },
  })
  const Root = defineComponent({
    setup() {
      provide(local, 'preserved')
      target =
        kind === 'toast'
          ? createUiToastTarget(options)
          : createUiNotificationTarget(options)
      route = createUiFeedbackRoute({ target })
      other = createUiFeedbackRoute({ target })
      return () => h('button', { 'data-feedback-origin': '' }, 'Origin')
    },
  })
  const app = createUiApplication(
    Root,
    colorMode ? { colorMode: { document, preference: colorMode } } : {},
  )
  app.config.errorHandler = (error) => state.errors.push(String(error))
  const host = document.createElement('div')
  document.body.append(host)
  await app.ui.ready
  app.mount(host)
  await nextTick()
  await nextTick()
  const send = (label = 'Message', rich = false, duration?: number | null) =>
    route.send(
      () => ({
        title: label,
        message: () =>
          state.locale === 'en' ? 'Operation completed' : '操作完成',
        announcement: 'polite',
        details: ['Related detail'],
        actions: [
          {
            key: 'action',
            label: 'Action',
            binding: {
              target: 'button',
              type: 'button',
              get disabled() {
                return state.disabled
              },
              loading: false,
              activate: () => {
                state.clicks++
              },
            },
          },
        ],
      }),
      { duration, ...(rich ? { content: () => h(Rich, { label }) } : {}) },
    )
  return {
    host,
    target,
    route,
    other,
    state,
    send,
    flush: nextTick,
    dispose() {
      app.unmount()
      host.remove()
    },
  }
}
