import { useAppConfig } from '#imports'
import { h, onScopeDispose, ref } from 'vue'
import {
  createUiExpansionControl,
  UiApp,
  UiCard,
  UiCollapsible,
} from '@uninterface/uninterface'
import { mountCollapsibleFixture } from './collapsible-comparison'
export { mountComparison } from './collapsible-comparison'

export function configureItem(item?: string) {
  useAppConfig().ui!.accordion = item === undefined ? {} : { slots: { item } }
}

export function mountSiblingCollapsibles() {
  return mountCollapsibleFixture({
    setup() {
      const standalone = ref(false)
      const group = createUiExpansionControl({ mode: 'multiple' })
      onScopeDispose(() => group.dispose())
      return () =>
        h(UiApp, null, () => [
          h(UiCard, null, () =>
            h(
              UiCollapsible,
              {
                'data-testid': 'standalone-collapsible',
                label: 'Standalone',
                modelValue: standalone.value,
                'onUpdate:modelValue': (expanded: boolean) => {
                  standalone.value = expanded
                },
              },
              () => 'Standalone content',
            ),
          ),
          h(UiCard, { 'data-testid': 'coordinated-panels' }, () =>
            ['Delivery', 'Billing', 'Contact'].map((label) =>
              h(
                UiCollapsible,
                {
                  key: label,
                  binding: group.bindings.collapsible(label),
                  label,
                },
                () => `${label} details`,
              ),
            ),
          ),
        ])
    },
  })
}
