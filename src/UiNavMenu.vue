<script setup lang="ts">
  import { useUiZPopup } from '@uninterface/uninterface/backend'
  import { useUiZView } from '@uninterface/uninterface/backend'
  useUiZView()

  defineOptions({ inheritAttrs: false })
  import { ref as navigationRef } from 'vue'
  import {
    useUiNavigationPresentation,
    useUiOverlayTarget,
  } from '@uninterface/uninterface/backend'

  import NavigationVertical from './NavigationVertical.vue'
  import NavigationViewport from './NavigationViewport.vue'
  import { computed, nextTick, ref } from 'vue'
  import {
    NavigationMenuRoot,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuLink,
    NavigationMenuContent,
    DropdownMenuRoot,
  } from 'reka-ui'
  import UIcon from '@nuxt/ui/components/Icon.vue'
  import { tv } from '@nuxt/ui/utils/tv'
  import theme from '#build/ui/navigation-menu'
  import { useAppConfig } from '#imports'
  import type {
    UiNavMenuViewBinding,
    UiEntryViewNode,
  } from '@uninterface/uninterface/backend'
  import EntryBranch from './EntryBranch.vue'
  import EntrySurface from './EntrySurface.vue'
  import { useNativeDirection } from './nativeDirection'
  const props = defineProps<{ binding: UiNavMenuViewBinding }>()
  const emit = defineEmits<{
    activate: [key: string]
    expand: [key: string, open: boolean]
    retry: [key?: string]
  }>()
  const element = ref<HTMLElement>()
  const direction = useNativeDirection(
    () => element.value?.parentElement ?? undefined,
  )
  const config = useAppConfig()
  const ui = computed(
    () =>
      tv({ extend: theme, ...config.ui?.navigationMenu })({
        orientation: 'horizontal',
        contentOrientation: 'vertical',
      } as any) as unknown as Record<
        string,
        (options?: Record<string, unknown>) => string
      >,
  )
  const expanded = computed(
    () => props.binding.entries.find((node) => node.expanded)?.entry.key,
  )
  const encode = (key: string) => `entry:${key}`
  function expand(value: string) {
    for (const node of props.binding.entries)
      if (
        node.entry.kind === 'submenu' &&
        Boolean(node.expanded) !== (encode(node.entry.key) === value)
      )
        emit('expand', node.entry.key, encode(node.entry.key) === value)
  }
  async function closeBranch(key: string) {
    emit('expand', key, false)
    await nextTick()
    const trigger = Array.from(
      element.value?.querySelectorAll<HTMLElement>(
        '[data-navigation-menu-trigger]',
      ) ?? [],
    ).find((candidate) => candidate.dataset.entryKey === key)
    trigger?.focus({ preventScroll: true })
  }
  function activate(event: MouseEvent, node: UiEntryViewNode) {
    if ('disabled' in node.entry && node.entry.disabled) {
      event.preventDefault()
      return
    }
    if (
      'href' in node.entry &&
      node.entry.href &&
      (event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0)
    )
      return
    if (node.request) node.request(event)
    else emit('activate', node.entry.key)
  }
  defineSlots<{
    entry(props: {
      entry: Exclude<UiEntryViewNode['entry'], { kind: 'separator' }>
    }): any
    icon(props: {
      entry: Exclude<UiEntryViewNode['entry'], { kind: 'separator' }>
      icon?: unknown
    }): any
  }>()
  const navigationSurface = navigationRef<HTMLElement>()
  const navigationOverlay = useUiOverlayTarget()
  const {
    hint,
    hintId,
    hintAnchor,
    events: navigationEvents,
  } = useUiNavigationPresentation(() => props.binding, navigationSurface)
  useUiZPopup(
    () =>
      typeof document === 'undefined'
        ? undefined
        : document.getElementById(hintId),
    {
      tooltip: {
        anchor: () => hintAnchor.value,
        visible: () => Boolean(hint.value),
      },
      source: 'navigation hint',
    },
  )
</script>
<template>
  <div
    ref="navigationSurface"
    class="nuxt-ui-navigation-surface"
    :data-navigation-mode="binding.presentation"
    :data-navigation-boundary="
      binding.boundary ??
      (binding.presentation === 'horizontal' ? 'block-end' : 'inline-end')
    "
    v-bind="{ ...$attrs, ...navigationEvents }"
  >
    <NavigationVertical
      v-if="binding.presentation !== 'horizontal'"
      :entries="binding.entries"
      :status="binding.status"
      :label="binding.label"
      :presentation="binding.presentation"
      @activate="emit('activate', $event)"
      @expand="(key, open) => emit('expand', key, open)"
      @retry="emit('retry', $event)"
    >
      <template #entry="scope">
        <slot
          name="entry"
          v-bind="scope"
        />
      </template>
      <template #icon="scope">
        <slot
          name="icon"
          v-bind="scope"
        />
      </template>
    </NavigationVertical>
    <NavigationMenuRoot
      v-else
      :ref="
        (instance: any) => {
          element = instance?.$el
        }
      "
      :model-value="expanded === undefined ? '' : encode(expanded)"
      :dir="direction"
      :aria-label="binding.label"
      :class="ui.root()"
      @update:model-value="expand"
    >
      <NavigationMenuList :class="[ui.list(), 'nuxt-navigation-list']">
        <NavigationMenuItem
          v-for="node in binding.entries"
          :key="node.entry.key"
          :value="encode(node.entry.key)"
          :class="ui.item()"
        >
          <hr v-if="node.entry.kind === 'separator'" />
          <span
            v-else-if="node.entry.kind === 'group'"
            :class="ui.label()"
          >
            <span
              v-if="node.entry.icon"
              class="nuxt-navigation-icon"
              :class="ui.linkLeadingIcon()"
              aria-hidden="true"
            >
              <slot
                name="icon"
                :entry="node.entry"
                :icon="node.entry.icon"
              />
            </span>
            <slot
              name="entry"
              :entry="node.entry"
            >
              {{ node.entry.label }}
            </slot>
            <UiNavMenu
              :binding="{
                ...binding,
                boundary: 'none',
                entries: node.children ?? [],
                label: node.entry.label,
                status: binding.status,
              }"
              @activate="emit('activate', $event)"
              @expand="(key, open) => emit('expand', key, open)"
              @retry="emit('retry', $event)"
            >
              <template #entry="scope">
                <slot
                  name="entry"
                  v-bind="scope"
                />
              </template>
              <template #icon="scope">
                <slot
                  name="icon"
                  v-bind="scope"
                />
              </template>
            </UiNavMenu>
          </span>
          <template v-else>
            <component
              :is="
                node.entry.kind === 'submenu'
                  ? NavigationMenuTrigger
                  : NavigationMenuLink
              "
              as-child
              :active="Boolean(node.current || node.containsCurrent)"
              :disabled="node.entry.disabled"
            >
              <component
                :is="
                  node.entry.kind !== 'submenu' && node.entry.href
                    ? 'a'
                    : 'button'
                "
                :href="
                  node.entry.kind !== 'submenu' && !node.entry.disabled
                    ? node.entry.href
                    : undefined
                "
                :type="
                  node.entry.kind !== 'submenu' && node.entry.href
                    ? undefined
                    : 'button'
                "
                :disabled="
                  node.entry.kind === 'submenu' || !node.entry.href
                    ? node.entry.disabled
                    : undefined
                "
                :aria-disabled="node.entry.disabled || undefined"
                :aria-current="node.current ? 'page' : undefined"
                :aria-label="node.entry.label"
                :data-entry-key="node.entry.key"
                class="nuxt-navigation-link"
                :class="
                  ui.link({
                    active: Boolean(node.current || node.containsCurrent),
                    disabled: Boolean(node.entry.disabled),
                    level: true,
                  })
                "
                @click="node.entry.kind !== 'submenu' && activate($event, node)"
              >
                <span
                  v-if="node.entry.icon"
                  class="nuxt-navigation-icon"
                  :class="ui.linkLeadingIcon()"
                  aria-hidden="true"
                >
                  <slot
                    name="icon"
                    :entry="node.entry"
                    :icon="node.entry.icon"
                  />
                </span>
                <span :class="ui.linkLabel()">
                  <slot
                    name="entry"
                    :entry="node.entry"
                  >
                    {{ node.entry.label }}
                  </slot>
                </span>
                <span
                  v-if="node.entry.kind === 'submenu'"
                  :class="ui.linkTrailing()"
                >
                  <UIcon
                    :name="config.ui?.icons.chevronDown"
                    :class="ui.linkTrailingIcon()"
                    aria-hidden="true"
                  />
                </span>
              </component>
            </component>
            <NavigationMenuContent
              v-if="node.entry.kind === 'submenu'"
              :class="ui.content()"
              :aria-busy="node.status?.pending || undefined"
            >
              <div class="nuxt-menu-inline nuxt-navigation-content">
                <DropdownMenuRoot
                  :open="Boolean(node.expanded)"
                  :modal="false"
                  :dir="direction"
                  @update:open="emit('expand', node.entry.key, $event)"
                >
                  <EntrySurface
                    :label="node.entry.label"
                    :pending="node.status?.pending"
                    inline
                    @close="closeBranch(node.entry.key)"
                  >
                    <EntryBranch
                      :entries="node.children ?? []"
                      :status="node.status"
                      :label="node.entry.label"
                      :parent-key="node.entry.key"
                      navigation
                      :direction="direction"
                      @activate="emit('activate', $event)"
                      @expand="(key, open) => emit('expand', key, open)"
                      @retry="emit('retry', $event)"
                    >
                      <template #entry="scope">
                        <slot
                          name="entry"
                          v-bind="scope"
                        />
                      </template>
                      <template #icon="scope">
                        <slot
                          name="icon"
                          v-bind="scope"
                        />
                      </template>
                    </EntryBranch>
                  </EntrySurface>
                </DropdownMenuRoot>
              </div>
            </NavigationMenuContent>
          </template>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationViewport :viewport-class="ui.viewport()" />
      <span
        v-if="binding.status.message"
        role="status"
      >
        {{ binding.status.message }}
      </span>
    </NavigationMenuRoot>
  </div>
  <Teleport :to="navigationOverlay ?? 'body'">
    <span
      v-if="hint"
      :id="hintId"
      role="tooltip"
      class="nuxt-ui-navigation-hint"
      :style="{ left: `${hint.x}px`, top: `${hint.y}px` }"
    >
      {{ hint.label }}
    </span>
  </Teleport>
</template>
