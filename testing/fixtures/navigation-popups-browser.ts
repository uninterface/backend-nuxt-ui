import '@uninterface/uninterface/style.css'
import { mount } from './navigation-popups'
import type { UiNavMenuPresentation } from '@uninterface/uninterface'

const mode = new URLSearchParams(location.search).get(
  'mode',
) as UiNavMenuPresentation
void mount(mode)
