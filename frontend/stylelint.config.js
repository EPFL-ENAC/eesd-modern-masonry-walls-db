// The EPFL design system's adherence rules (adherence/.stylelintrc.json): no raw
// hex, no px, Suisse Int'l only. Colours and sizes come from DS tokens.
/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recommended-vue/scss'],
  rules: {
    'color-no-hex': true,
    'unit-disallowed-list': ['px'],
    'declaration-property-value-allowed-list': {
      'font-family': ["/Suisse Int'l/", '/^inherit$/', '/var\\(--font/']
    },
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'no-invalid-position-at-import-rule': [true, { ignoreAtRules: ['layer'] }]
  }
}
