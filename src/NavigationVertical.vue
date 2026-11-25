<script setup lang="ts">
  import { computed, ref } from 'vue'
  import {
    AccordionRoot,
    AccordionItem,
    AccordionTrigger,
    AccordionHeader,
    AccordionContent,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
  } from 'reka-ui'
  import { tv } from '@nuxt/ui/utils/tv'
  import theme from '#build/ui/navigation-menu'
  import { useAppConfig } from '#imports'
  import {
    useUiOverlayTarget,
    useUiMenuIconColumn,
    type UiEntryViewNode,
    type UiEntryStatusViewBinding,
  } from '@uninterface/uninterface/backend'
  import NavigationCopy from './NavigationCopy.vue'
  import EntryBranch from './EntryBranch.vue'
  import EntrySurface from './EntrySurface.vue'
  import { useNativeDirection } from './nativeDirection'
  const props = defineProps<{
    entries: readonly UiEntryViewNode[]
    status?: UiEntryStatusViewBinding
    label: string
    presentation: string
    parentKey?: string
    group?: boolean
  }>()
  const emit = defineEmits<{
    activate: [key: string]
    expand: [key: string, open: boolean]
    retry: [key?: string]
  }>()
  const iconColumn = useUiMenuIconColumn(() => props.entries, {
    group: () => Boolean(props.group),
    reserve: () =>
      props.presentation === 'vertical-tree' || props.parentKey === undefined,
  })
  const element = ref<HTMLElement>()
  const direction = useNativeDirection(() => element.value)
  const target = useUiOverlayTarget()
  const config = useAppConfig()
  const tree = computed(() => props.presentation === 'vertical-tree')
  const rail = computed(
    () => props.presentation === 'icon-popup' && props.parentKey === undefined,
  )
  const ui = computed(
    () =>
      tv({ extend: theme, ...config.ui?.navigationMenu })({
        orientation: 'vertical',
        collapsed: rail.value,
      } as any) as unknown as Record<string, (options?: any) => string>,
  )
  const opened = computed(() =>
    props.entries.filter((node) => node.expanded).map((node) => node.entry.key),
  )
  function expand(keys: unknown) {
    for (const node of props.entries)
      if (
        node.entry.kind === 'submenu' &&
        Boolean(node.expanded) !==
          (Array.isArray(keys) && keys.includes(node.entry.key))
      )
        emit(
          'expand',
          node.entry.key,
          Array.isArray(keys) && keys.includes(node.entry.key),
        )
  }
  function activate(node: UiEntryViewNode, event: MouseEvent) {
    if ('disabled' in node.entry && node.entry.disabled) {
      event.preventDefault()
      return
    }
    if (
      event.button ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
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
    host(props: { buttonTrigger: Record<string, unknown> }): any
  }>()
</script>
<template>
  <nav
    ref="element"
    :aria-label="label"
    :aria-busy="status?.pending || undefined"
    :class="[ui.root(), 'nuxt-navigation-vertical']"
    :data-rail="rail || undefined"
  >
    <component
      :is="tree ? AccordionRoot : 'div'"
      type="multiple"
      :model-value="opened"
      :class="parentKey !== undefined && !group ? ui.childList() : ui.list()"
      @update:model-value="expand"
    >
      <template
        v-for="node in entries"
        :key="node.entry.key"
      >
        <hr v-if="node.entry.kind === 'separator'" />
        <template v-else-if="node.entry.kind === 'group'">
          <div
            :class="ui.label()"
            :data-rail-heading="rail || undefined"
          >
            <NavigationCopy
              :icon-column="iconColumn"
              :node="node"
              :ui="ui"
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
            </NavigationCopy>
          </div>
          <NavigationVertical
            :entries="node.children ?? []"
            :label="node.entry.label"
            :presentation="presentation"
            :parent-key="parentKey"
            group
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
        </template>
        <AccordionItem
          v-else-if="node.entry.kind === 'submenu' && tree"
          :value="node.entry.key"
          :disabled="node.entry.disabled"
          :class="ui.item()"
        >
          <AccordionHeader as="div">
            <AccordionTrigger
              class="nuxt-navigation-link"
              :class="
                ui.link({
                  active: Boolean(node.containsCurrent),
                  disabled: Boolean(node.entry.disabled),
                  level: parentKey !== undefined,
                })
              "
              :data-entry-key="node.entry.key"
              :aria-label="node.entry.label"
            >
              <NavigationCopy
                :icon-column="iconColumn"
                :node="node"
                :ui="ui"
                tree
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
              </NavigationCopy>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent
            :class="ui.content()"
            :inert="!node.expanded || undefined"
          >
            <NavigationVertical
              :entries="node.children ?? []"
              :status="node.status"
              :label="node.entry.label"
              :presentation="presentation"
              :parent-key="node.entry.key"
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
          </AccordionContent>
        </AccordionItem>
        <DropdownMenuRoot
          v-else-if="node.entry.kind === 'submenu'"
          :open="Boolean(node.expanded)"
          :modal="false"
          :dir="direction"
          @update:open="emit('expand', node.entry.key, $event)"
        >
          <DropdownMenuTrigger
            class="nuxt-navigation-link"
            :disabled="node.entry.disabled"
            :class="
              ui.link({
                active: Boolean(node.containsCurrent),
                disabled: Boolean(node.entry.disabled),
              })
            "
            :data-entry-key="node.entry.key"
            :aria-label="node.entry.label"
          >
            <NavigationCopy
              :icon-column="iconColumn"
              :node="node"
              :ui="ui"
              :rail="rail"
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
            </NavigationCopy>
          </DropdownMenuTrigger>
          <DropdownMenuPortal :to="target">
            <EntrySurface
              :side="direction === 'rtl' ? 'left' : 'right'"
              :label="node.entry.label"
              :pending="node.status?.pending"
              @close="emit('expand', node.entry.key, false)"
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
          </DropdownMenuPortal>
        </DropdownMenuRoot>
        <component
          v-else
          class="nuxt-navigation-link"
          :is="node.entry.href ? 'a' : 'button'"
          :type="node.entry.href ? undefined : 'button'"
          :href="node.entry.disabled ? undefined : node.entry.href"
          :disabled="!node.entry.href ? node.entry.disabled : undefined"
          :aria-disabled="node.entry.disabled || undefined"
          :aria-current="node.current ? 'page' : undefined"
          :class="
            ui.link({
              active: Boolean(node.current),
              disabled: Boolean(node.entry.disabled),
              level: parentKey !== undefined,
            })
          "
          :data-entry-key="node.entry.key"
          :aria-label="node.entry.label"
          @click="activate(node, $event as MouseEvent)"
        >
          <NavigationCopy
            :icon-column="iconColumn"
            :node="node"
            :ui="ui"
            :rail="rail"
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
          </NavigationCopy>
        </component>
      </template>
    </component>
    <div
      v-if="status?.message"
      role="status"
    >
      {{ status.message }}
      <button
        v-if="status.failed"
        type="button"
        :class="ui.link()"
        @click="emit('retry', parentKey)"
      >
        {{ status.retryLabel }}
      </button>
    </div>
  </nav>
</template>
