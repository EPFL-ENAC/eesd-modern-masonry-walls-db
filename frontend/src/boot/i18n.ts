import { defineBoot } from '#q-app'
import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'

export const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

export default defineBoot(({ app }) => {
  app.use(i18n)
})
