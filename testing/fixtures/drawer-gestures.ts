import { defineComponent, h, nextTick, ref } from 'vue'
import { createUiApplication } from '@uninterface/uninterface/setup'
import {
  UiDrawer,
  UiPopover,
  UiModal,
  UiButton,
  createUiModalControl,
  createUiDrawerControl,
  createUiPopoverControl,
  createUiExpansionControl,
  type UiOverlaySession,
  type UiOverlayCloseTrigger,
  type UiPopoverPlacement,
  type UiDrawerEdge,
} from '@uninterface/uninterface'

export async function mountOverlays(panelEdge?: UiDrawerEdge) {
  const drawer = createUiDrawerControl<string>(),
    popover = createUiPopoverControl<string>()
  const confirmation = createUiModalControl<boolean>()
  const nested = createUiPopoverControl<void>()
  const modelExpanded = ref(false),
    acceptCollapse = ref(false)
  const panels = createUiExpansionControl({ mode: 'multiple' })
  const title = ref('Edit record'),
    anchorShown = ref(true),
    disabled = ref(false)
  const popoverModal = ref(false)
  const placement = ref<UiPopoverPlacement>('bottom')
  const drawerEdge = ref<UiDrawerEdge>('end')
  const drawerCloseOn = ref<readonly UiOverlayCloseTrigger[]>()
  const panelCloseOn = ref<readonly UiOverlayCloseTrigger[]>()
  const errors: string[] = []
  const host = document.createElement('div')
  document.body.append(host)
  const app = createUiApplication(
    defineComponent({
      setup() {
        const content = ({
          session,
        }: {
          session: UiOverlaySession<string>
        }) => [
          h('input', { 'aria-label': 'Run draft' }),
          h(
            UiPopover,
            { control: nested, title: 'Owned choices' },
            {
              host: ({ buttonTrigger }: any) =>
                h(
                  UiButton,
                  { ...buttonTrigger, id: 'nested-trigger' },
                  () => 'Choices',
                ),
              default: () => h('input', { 'aria-label': 'Nested draft' }),
            },
          ),
          h(
            UiModal<boolean>,
            { control: confirmation, title: 'Confirm closure' },
            { default: () => h('p', 'Confirm') },
          ),
          h(
            UiButton,
            { onClick: () => session.complete('saved') },
            () => 'Save',
          ),
        ]
        return () => [
          h('button', { id: 'outside' }, 'Outside'),
          h(
            UiDrawer,
            {
              mode: 'modal',
              control: drawer,
              title: title.value,
              edge: drawerEdge.value,
              closeOn: drawerCloseOn.value,
            },
            {
              host: ({ buttonTrigger }: any) =>
                h(
                  UiButton,
                  {
                    ...buttonTrigger,
                    id: 'drawer-trigger',
                    onClick: () => {
                      void drawer.run()
                    },
                  },
                  () => 'Edit',
                ),
              default: content,
            },
          ),
          h(
            UiDrawer,
            {
              mode: 'panel',
              edge: panelEdge ?? drawerEdge.value,
              binding: panels.bindings.drawer('filters'),
              title: 'Filters',
              closeOn: panelCloseOn.value,
              disabled: disabled.value,
              lazy: true,
            },
            {
              host: ({ buttonTrigger }: any) =>
                h(
                  UiButton,
                  { ...buttonTrigger, id: 'panel-trigger' },
                  () => 'Filters',
                ),
              default: () => h('input', { 'aria-label': 'Retained draft' }),
            },
          ),
          h(
            UiDrawer,
            {
              mode: 'panel',
              edge: drawerEdge.value,
              expanded: modelExpanded.value,
              title: 'Controlled panel',
              'onUpdate:expanded': (value: boolean) => {
                if (value || acceptCollapse.value) modelExpanded.value = value
              },
            },
            {
              host: ({ buttonTrigger }: any) =>
                h(
                  UiButton,
                  { ...buttonTrigger, id: 'model-panel-trigger' },
                  () => 'Controlled panel',
                ),
              default: () => h('p', 'Retained controlled content'),
            },
          ),
          h(
            UiPopover,
            {
              key: String(popoverModal.value),
              control: popover,
              title: 'Quick edit',
              modal: popoverModal.value,
              placement: placement.value,
            },
            {
              host: ({ buttonTrigger, anchor }: any) =>
                anchorShown.value
                  ? [
                      h(
                        UiButton,
                        {
                          ...buttonTrigger,
                          id: 'popover-trigger',
                          onClick: () => {
                            void popover.run()
                          },
                        },
                        () => 'Quick edit',
                      ),
                      h('span', { ...anchor, id: 'separate-anchor' }, 'Anchor'),
                    ]
                  : null,
              default: content,
            },
          ),
        ]
      },
    }),
  )
  app.config.errorHandler = (error) => errors.push(String(error))
  app.mount(host)
  await app.ui.ready
  await nextTick()
  return {
    drawer,
    popover,
    confirmation,
    nested,
    modelExpanded,
    acceptCollapse,
    panels,
    title,
    disabled,
    anchorShown,
    popoverModal,
    placement,
    panelCloseOn,
    drawerEdge,
    drawerCloseOn,
    errors,
    async dispose() {
      app.unmount()
      await drawer.dispose()
      await popover.dispose()
      await confirmation.dispose()
      await nested.dispose()
      panels.dispose()
      host.remove()
    },
  }
}
