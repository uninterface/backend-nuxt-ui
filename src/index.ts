import type { UiBackendDescriptor } from '@uninterface/uninterface/backend'
import metadata from '../package.json'
import manifest from '../capabilities.json'

export const uiBackend: UiBackendDescriptor = {
  name: 'Nuxt UI',
  packageName: metadata.name,
  version: metadata.version,
  description: metadata.description,
  dependencies: [
    { packageName: manifest.backend.name, version: manifest.backend.version },
  ],
  capabilities: manifest.provides,
  themeColors: {},
}
