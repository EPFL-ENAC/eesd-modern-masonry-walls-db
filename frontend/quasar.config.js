// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file
import { defineConfig } from '#q-app'
import path from 'node:path'

export default defineConfig(() => ({
  boot: ['i18n'],

  // epfl.css first: it declares the cascade layer order, then app.scss fills them.
  css: ['epfl.css', 'app.scss'],

  // No icon webfonts: icons are inline SVG imported from @quasar/extras.
  extras: [],

  build: {
    target: {
      browser: ['es2022', 'firefox115', 'chrome115', 'safari16'],
      node: 'node22'
    },
    vueRouterMode: 'history',
    sourcemap: false,
    extendViteConf(viteConf) {
      // Quasar's CSS is imported by hand in app.scss inside a cascade layer, so
      // the auto-injected copy is replaced by an empty file (co2-calculator).
      const empty = path.resolve(__dirname, './src/css/empty.scss')
      viteConf.resolve ??= {}
      viteConf.resolve.alias ??= {}
      viteConf.resolve.alias['quasar/dist/quasar.sass'] = empty
      viteConf.resolve.alias['quasar/dist/quasar.css'] = empty
      viteConf.css ??= {}
      viteConf.css.preprocessorOptions ??= {}
      viteConf.css.preprocessorOptions.scss ??= {}
      viteConf.css.preprocessorOptions.scss.silenceDeprecations = ['import']
    }
  },

  devServer: {
    // wtx exports a port per worktree; 9000 is Quasar's default.
    port: Number(process.env.FRONTEND_PORT) || 9000,
    open: false
  },

  framework: {
    iconSet: 'svg-material-icons',
    plugins: [],
    cssAddon: false
  },

  animations: []
}))
