import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs([
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  prettier,
  {
    files: ['quasar.config.js', 'scripts/**/*.{js,mjs,ts}'],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/.quasar/',
      '**/coverage/',
      '**/quasar.config.*.temporary.compiled*',
      'public/**'
    ]
  }
])
