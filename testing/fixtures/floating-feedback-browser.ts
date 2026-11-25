import '@uninterface/backend/font.css'
import '@uninterface/backend/style.css'
import { mountFloatingFeedback } from './floating-feedback'

declare global {
  interface Window {
    nuxtFeedback: {
      current: Awaited<ReturnType<typeof mountFloatingFeedback>>
      mount: typeof mountFloatingFeedback
    }
  }
}

void mountFloatingFeedback({ duration: null, maxVisible: 2 }).then(
  (current) => {
    window.nuxtFeedback = { current, mount: mountFloatingFeedback }
  },
)
