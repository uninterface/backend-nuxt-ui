/** Activate a native tab through its pointer event path in DOM simulation. */
export function activateTab(element) {
  const window = element.ownerDocument.defaultView
  element.dispatchEvent(
    new window.MouseEvent('mousedown', {
      button: 0,
      ctrlKey: false,
      bubbles: true,
      cancelable: true,
    }),
  )
  element.click()
}

export function isTabPresentedSelected(element) {
  return element.getAttribute('data-state') === 'active'
}
