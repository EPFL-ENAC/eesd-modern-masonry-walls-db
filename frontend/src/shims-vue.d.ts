/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// The DS Vue kit's public entry (kits/vue/index.js) re-exports untyped .vue files.
declare module 'epfl-design-system/kits/vue' {
  import type { DefineComponent } from 'vue'
  export const EpflCard: DefineComponent<{
    image?: string
    category?: string
    date?: string
    title?: string
    distinction?: boolean
  }>
  export const EpflCardDeck: DefineComponent
  export const EpflKeyNumber: DefineComponent<{
    pre?: string
    value?: string | number
    label?: string
  }>
}
