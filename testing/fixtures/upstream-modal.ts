import './upstream-modal.css'
import { createApp, h } from 'vue'
import UApp from '@nuxt/ui/components/App.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import nuxtUi from '@nuxt/ui/vue-plugin'

const app = createApp({
  render: () =>
    h(UApp, { toaster: null }, () =>
      h(
        UModal,
        { title: 'Modal presentation' },
        {
          default: () => h(UButton, { label: 'Open native modal' }),
          body: () => h('p', 'Review the operation before continuing.'),
        },
      ),
    ),
})
app.use(nuxtUi)
app.mount(document.body.appendChild(document.createElement('div')))
