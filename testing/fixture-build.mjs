import { buildFixture } from '@uninterface/testing/fixture-build'
import backendVite from '@uninterface/backend-nuxt-ui/vite'

const resolveBackend = (subpath) =>
  import.meta.resolve(
    subpath
      ? '@uninterface/backend-nuxt-ui/' + subpath
      : '@uninterface/backend-nuxt-ui',
  )

export const build = (options, presentation) =>
  buildFixture(options, {
    resolveBackend,
    backendVite: () => backendVite(presentation),
  })
