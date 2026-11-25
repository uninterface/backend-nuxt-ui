/** Modules supplied by this backend's Nuxt UI Vite hook. */
declare module '#build/ui/dropdown-menu' {
  const theme: any
  export default theme
}
declare module '#imports' {
  export function useAppConfig(): { ui?: Record<string, any> }
}
declare module '#build/ui/navigation-menu' {
  const theme: any
  export default theme
}

declare module '#build/ui/form-field' {
  const theme: any
  export default theme
}

declare module '#build/ui/modal' {
  const theme: any
  export default theme
}
declare module '#build/ui/accordion' {
  const theme: Record<string, unknown> & { slots: Record<string, string> }
  export default theme
}

declare module '#build/ui/input-menu' {
  const theme: Record<string, unknown>
  export default theme
}
declare module '#build/ui/breadcrumb' {
  const theme: Record<string, unknown>
  export default theme
}

declare module '#build/ui/input' {
  const theme: Record<string, unknown>
  export default theme
}

declare module '#build/ui/file-upload' {
  const theme: Record<string, unknown>
  export default theme
}

declare module '#build/ui/pagination' {
  const theme: any
  export default theme
}

declare module '#build/ui/drawer' {
  const theme: any
  export default theme
}
declare module '#build/ui/popover' {
  const theme: any
  export default theme
}

declare module '#build/ui/toaster' {
  const theme: any
  export default theme
}
