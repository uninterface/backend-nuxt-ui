import { fileURLToPath } from 'node:url'
import {
  collectionNames,
  generateClientBundleCode,
  resolveBundleIcons,
} from '@nuxt/icon/utils'

const backendRoot = fileURLToPath(new URL('../', import.meta.url))
const prefixes = [...collectionNames].sort((a, b) => b.length - a.length)

function iconName(value) {
  const name = value.replace(/^i[-:]/, '')
  if (name.includes(':')) return name
  const prefix = prefixes.find((prefix) => name.startsWith(`${prefix}-`))
  if (!prefix) throw new Error(`Cannot resolve native icon name: ${value}`)
  return `${prefix}:${name.slice(prefix.length + 1)}`
}

/** Retain Nuxt's registration path, with application and backend asset resolution. */
export function nativeIconsPlugin(plugins) {
  const configPlugin = plugins.find(
    (plugin) => plugin.name === 'nuxt:ui:app-config',
  )
  const nativePlugin = plugins.find((plugin) => plugin.name === 'nuxt:ui:icons')
  if (!configPlugin || !nativePlugin || typeof configPlugin.load !== 'function')
    throw new Error(
      'Review Nuxt UI native icon integration after the toolkit update.',
    )
  let root
  return {
    name: 'uninterface-nuxt-native-icons',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
    },
    async load(id) {
      if (id !== 'virtual:nuxt-ui-icons') return
      // Nuxt UI 4.12.0 serializes its merged configuration as a JSON export.
      // Read that actual configuration, including overrides, rather than copy
      // the toolkit's default icon list into the adapter.
      const source = await configPlugin.load.call(
        this,
        'virtual:nuxt-ui-app-config',
      )
      let config
      try {
        config = JSON.parse(source.trim().replace(/^export default\s+/, ''))
        if (
          !config?.ui?.icons ||
          typeof config.ui.icons !== 'object' ||
          Array.isArray(config.ui.icons)
        )
          throw new Error('Missing native icon configuration')
      } catch {
        throw new Error(
          'Review Nuxt UI native icon configuration after the toolkit update.',
        )
      }
      const names = Object.values(config.ui.icons)
        .filter((name) => typeof name === 'string' && name)
        .map(iconName)
      const { collections, failed } = await resolveBundleIcons({
        icons: [...names, 'lucide:move-horizontal', 'lucide:menu'],
        resolvePaths: [root, backendRoot],
      })
      if (failed.length)
        throw new Error(
          `Cannot bundle Nuxt UI native icons: ${failed.join(', ')}. Install their @iconify-json collection in the application.`,
        )
      return generateClientBundleCode(collections).code
    },
  }
}
