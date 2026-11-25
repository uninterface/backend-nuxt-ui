import { buildFixture } from '@uninterface/testing/fixture-build'
import backendVite from '@uninterface/backend-nuxt-ui/vite'

const backend = {
  resolveBackend: (subpath) =>
    import.meta.resolve(
      subpath
        ? '@uninterface/backend-nuxt-ui/' + subpath
        : '@uninterface/backend-nuxt-ui',
    ),
  backendVite,
}

export const build = (options) => buildFixture(options, backend)
