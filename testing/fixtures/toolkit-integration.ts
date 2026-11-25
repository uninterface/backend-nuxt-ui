import '../../src/style.css'
export { mountAsyncChoice, mountMenuHost } from './toolkit-entries'
export { mountMultiSelect } from './toolkit-multi-select'
import { mountOverlays as mountDrawerOverlays } from './drawer-gestures'
export { mountFloatingFeedback } from './floating-feedback'

// The smoke case clicks the same toggle when the panel is open. Dock the
// panel at the bottom so the toggle stays reachable on a narrow viewport.
export const mountOverlays = () => mountDrawerOverlays('bottom')
