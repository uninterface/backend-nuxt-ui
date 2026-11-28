import '@uninterface/backend/style.css'
import { UiAvatar } from '@uninterface/uninterface'
import { createUiApplication } from '@uninterface/uninterface/setup'
import { h, ref } from 'vue'

const src = ref<string>()
const portrait = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="navy"/></svg>',
)}`
const app = createUiApplication({
  render: () => [
    h(
      UiAvatar,
      { shape: 'circle', src: src.value, ariaLabel: 'Round avatar' },
      { fallback: () => 'RA' },
    ),
    h(
      UiAvatar,
      { shape: 'square', src: src.value, ariaLabel: 'Square avatar' },
      { fallback: () => 'SA' },
    ),
    h('button', { onClick: () => (src.value = portrait) }, 'Load portraits'),
  ],
})

void app.ui.ready.then(() =>
  app.mount(document.body.appendChild(document.createElement('div'))),
)
