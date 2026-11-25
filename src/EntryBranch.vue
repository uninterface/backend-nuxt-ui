<script setup lang="ts">
  import {
    useUiOverlayTarget,
    useUiMenuIconColumn,
  } from '@uninterface/uninterface/backend'
  const overlayTarget = useUiOverlayTarget()
  import { useId } from 'vue'
  import {
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
  } from 'reka-ui'
  import UButton from '@nuxt/ui/components/Button.vue'
  import type {
    UiEntryViewNode,
    UiEntryStatusViewBinding,
  } from '@uninterface/uninterface/backend'
  import { useMenuTheme } from './menuTheme'
  import EntryCopy from './EntryCopy.vue'
  import EntrySurface from './EntrySurface.vue'
  const props = defineProps<{
    entries: readonly UiEntryViewNode[]
    status?: UiEntryStatusViewBinding
    label: string
    parentKey?: string
    group?: boolean
    navigation?: boolean
    direction?: 'ltr' | 'rtl'
  }>()
  const emit = defineEmits<{
    activate: [key: string]
    expand: [key: string, open: boolean]
    retry: [key?: string]
  }>()
  defineSlots<{
    entry(props: {
      entry: Exclude<UiEntryViewNode['entry'], { kind: 'separator' }>
    }): any
    icon(props: {
      entry: Exclude<UiEntryViewNode['entry'], { kind: 'separator' }>
      icon?: unknown
    }): any
  }>()
  const iconColumn = useUiMenuIconColumn(() => props.entries, {
    group: () => Boolean(props.group),
  })
  const ui = useMenuTheme()
  const id = useId()
  function activate(event: Event, node: UiEntryViewNode) {
    // Only core decides whether an activation closes a menu or changes state.
    event.preventDefault()
    if (!node.request) emit('activate', node.entry.key)
  }
  function triggerKeyboard(event: KeyboardEvent, node: UiEntryViewNode) {
    if (event.key !== 'Escape' || !node.expanded) return
    // Pointer opening retains trigger focus. Close this branch before Reka's
    // window-level Escape listener can request closure of the entire root.
    event.preventDefault()
    event.stopImmediatePropagation()
    emit('expand', node.entry.key, false)
  }
  function linkClick(event: MouseEvent, node: UiEntryViewNode) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      event.stopPropagation()
    if ('disabled' in node.entry && node.entry.disabled) {
      event.preventDefault()
      return
    }
    if (
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey &&
      event.button === 0
    )
      node.request?.(event)
  }
</script>
<template>
  <div
    data-slot="viewport"
    :class="ui.viewport()"
  >
    <DropdownMenuGroup
      data-slot="group"
      :class="ui.group()"
    >
      <template
        v-for="(node, index) in entries"
        :key="node.entry.key"
      >
        <DropdownMenuSeparator
          v-if="node.entry.kind === 'separator'"
          :class="ui.separator()"
        />
        <template v-else-if="node.entry.kind === 'group'">
          <DropdownMenuLabel
            :id="`${id}-${index}`"
            :class="ui.label()"
          >
            <span
              v-if="node.entry.icon || iconColumn"
              class="nuxt-entry-icon"
              :class="ui.itemLeadingIcon()"
              aria-hidden="true"
            >
              <slot
                v-if="node.entry.icon"
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
          </DropdownMenuLabel>
          <EntryBranch
            :entries="node.children ?? []"
            :label="node.entry.label"
            :aria-labelledby="`${id}-${index}`"
            :parent-key="parentKey"
            group
            :navigation="navigation"
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
        </template>
        <DropdownMenuSub
          v-else-if="node.entry.kind === 'submenu'"
          :open="Boolean(node.expanded)"
          @update:open="emit('expand', node.entry.key, $event)"
        >
          <DropdownMenuSubTrigger
            as="button"
            type="button"
            :disabled="node.entry.disabled"
            :text-value="node.entry.label"
            :aria-label="node.entry.label"
            :aria-describedby="
              node.entry.description ? `${id}-description-${index}` : undefined
            "
            :data-entry-key="node.entry.key"
            :class="
              ui.item({ active: Boolean(node.current || node.containsCurrent) })
            "
            @keydown.capture="triggerKeyboard($event, node)"
          >
            <EntryCopy
              :icon-column="iconColumn"
              :node="node"
              :description-id="`${id}-description-${index}`"
              :direction="direction"
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
            </EntryCopy>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal :to="overlayTarget">
            <EntrySurface
              sub
              :label="node.entry.label"
              :parent-key="node.entry.key"
              :pending="node.status?.pending"
              @close="emit('expand', node.entry.key, false)"
            >
              <EntryBranch
                :entries="node.children ?? []"
                :status="node.status"
                :label="node.entry.label"
                :parent-key="node.entry.key"
                :navigation="navigation"
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
        </DropdownMenuSub>
        <component
          v-else
          :is="
            node.selectionMode === 'multiple'
              ? DropdownMenuCheckboxItem
              : DropdownMenuItem
          "
          :as="navigation && node.entry.href ? 'a' : 'button'"
          :type="navigation && node.entry.href ? undefined : 'button'"
          :href="
            navigation && !node.entry.disabled ? node.entry.href : undefined
          "
          :disabled="node.entry.disabled"
          :model-value="
            node.selectionMode === 'multiple'
              ? Boolean(node.selected)
              : undefined
          "
          :role="
            node.selectionMode === 'single'
              ? 'menuitemradio'
              : node.selectionMode === 'multiple'
                ? 'menuitemcheckbox'
                : 'menuitem'
          "
          :aria-checked="
            node.selectionMode ? Boolean(node.selected) : undefined
          "
          :aria-current="node.current ? 'page' : undefined"
          :aria-label="node.entry.label"
          :aria-describedby="
            node.entry.description ? `${id}-description-${index}` : undefined
          "
          :text-value="node.entry.label"
          :data-entry-key="node.entry.key"
          class="nuxt-entry-link"
          :class="
            ui.item({ active: Boolean(node.current || node.containsCurrent) })
          "
          @select="activate($event, node)"
          @click.capture="linkClick($event, node)"
        >
          <EntryCopy
            :icon-column="iconColumn"
            :node="node"
            :description-id="`${id}-description-${index}`"
            :direction="direction"
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
          </EntryCopy>
        </component>
      </template>
      <div
        v-if="status?.message"
        role="status"
        :class="ui.empty()"
      >
        {{ status.message }}
      </div>
      <DropdownMenuItem
        v-if="status?.failed"
        as-child
        :text-value="status.retryLabel"
        @select.prevent="emit('retry', parentKey)"
      >
        <UButton
          type="button"
          color="primary"
          variant="ghost"
          class="nuxt-control-focus"
          :loading-auto="false"
        >
          {{ status.retryLabel }}
        </UButton>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  </div>
</template>
