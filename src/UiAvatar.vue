<script setup lang="ts">
  import {
    uiAvatarImageProps,
    useUiZView,
    type UiAvatarViewProps,
  } from '@uninterface/uninterface/backend'
  import UAvatar from '@nuxt/ui/components/Avatar.vue'
  defineProps<UiAvatarViewProps>()
  useUiZView()

  const sizes = {
    '-2': 'xs',
    '-1': 'sm',
    '0': 'md',
    '1': 'lg',
    '2': 'xl',
  } as const
</script>

<template>
  <span
    class="nuxt-avatar"
    :style="size ? { width: size, height: size } : undefined"
  >
    <UAvatar
      class="nuxt-avatar-surface"
      :class="{ 'nuxt-avatar-square': shape === 'square' }"
      :size="sizes[sizeStep]"
      as="span"
      src=""
      :chip="false"
      :style="size ? { width: '100%', height: '100%' } : undefined"
    >
      <img
        v-if="image"
        :key="image.key"
        v-show="image.visible"
        class="nuxt-avatar-image"
        v-bind="uiAvatarImageProps(image)"
        :style="{ objectFit: fit }"
        alt=""
      />
      <span
        v-if="!image?.visible"
        class="nuxt-avatar-fallback"
        aria-hidden="true"
      >
        <slot name="fallback">
          <svg
            class="nuxt-avatar-glyph"
            viewBox="0 0 24 24"
            fill="currentColor"
            focusable="false"
          >
            <path
              d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4 0 8 2 8 4v2H4v-2c0-2 4-4 8-4Z"
            />
          </svg>
        </slot>
      </span>
    </UAvatar>
  </span>
</template>

<style scoped>
  .nuxt-avatar {
    display: inline-flex;
    flex: none;
    vertical-align: middle;
  }
  .nuxt-avatar-surface {
    position: relative;
    flex: none;
    overflow: hidden;
    /* Native theme slot overrides can replace UAvatar's rounded-full class. */
    border-radius: 50%;
    /* Keep UAvatar's text scale and size the surface from that text. */
    width: 3.25em;
    height: 3.25em;
  }
  .nuxt-avatar-square {
    border-radius: var(--ui-radius);
  }
  .nuxt-avatar-fallback {
    color: var(--ui-text-muted);
    font-weight: 500;
  }
  .nuxt-avatar-image,
  .nuxt-avatar-fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .nuxt-avatar-fallback {
    display: grid;
    place-items: center;
    line-height: 1;
  }

  .nuxt-avatar-glyph {
    width: 1em;
    height: 1em;
  }
</style>
