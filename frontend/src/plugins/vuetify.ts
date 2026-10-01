import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/styles'

export default createVuetify({
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#FF0000', // EPFL red
          secondary: '#413D3A' // EPFL ardoise
        }
      }
    }
  }
})
