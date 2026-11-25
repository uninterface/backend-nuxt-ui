import type nuxtUi from '@nuxt/ui/vite'
import type { PluginOption } from 'vite'

export default function createBackendPlugins(options?: {
  ui?: NonNullable<Parameters<typeof nuxtUi>[0]>['ui']
}): PluginOption[]
